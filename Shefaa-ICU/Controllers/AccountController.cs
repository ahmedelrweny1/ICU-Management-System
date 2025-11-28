using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;
using Shefaa_ICU.ViewModels;
using Shefaa_ICU.Services;
using Microsoft.Extensions.Caching.Memory;

namespace Shefaa_ICU.Controllers
{
    [AllowAnonymous]
    public class AccountController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Staff> _passwordHasher;
        private readonly ILogger<AccountController> _logger;
        private readonly IMemoryCache _cache;
        private readonly IEmailSender _emailSender;

        public AccountController(
            AppDbContext context,
            IPasswordHasher<Staff> passwordHasher,
            ILogger<AccountController> logger,
            IMemoryCache cache,
            IEmailSender emailSender)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _logger = logger;
            _cache = cache;
            _emailSender = emailSender;
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View("~/Views/Home/Index.cshtml", model);
            }

            var identifier = model.Identifier.Trim();
            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.Username == identifier || s.Email == identifier);

            if (staff == null)
            {
                ModelState.AddModelError(string.Empty, "Invalid username/email or password.");
                return View("~/Views/Home/Index.cshtml", model);
            }

            var verificationResult = _passwordHasher.VerifyHashedPassword(staff, staff.PasswordHash, model.Password);
            if (verificationResult == PasswordVerificationResult.Failed)
            {
                ModelState.AddModelError(string.Empty, "Invalid username/email or password.");
                return View("~/Views/Home/Index.cshtml", model);
            }

            await SignInStaffAsync(staff, model.RememberMe);
            return RedirectToAction("Index", "Dashboard");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View("~/Views/Home/Signup.cshtml", model);
            }

            var emailKey = GetRegisterVerifiedKey(model.Email.Trim());
            if (!_cache.TryGetValue<bool>(emailKey, out var emailVerified) || !emailVerified)
            {
                ModelState.AddModelError(nameof(model.Email), "Please verify your email with the OTP code first.");
                return View("~/Views/Home/Signup.cshtml", model);
            }

            if (await _context.Staff.AnyAsync(s => s.Username == model.Username.Trim()))
            {
                ModelState.AddModelError(nameof(model.Username), "Username already exists.");
                return View("~/Views/Home/Signup.cshtml", model);
            }

            if (await _context.Staff.AnyAsync(s => s.Email == model.Email.Trim()))
            {
                ModelState.AddModelError(nameof(model.Email), "Email already registered.");
                return View("~/Views/Home/Signup.cshtml", model);
            }

            var staff = new Staff
            {
                Username = model.Username.Trim(),
                Name = model.FullName.Trim(),
                Email = model.Email.Trim(),
                PhoneNumber = model.PhoneNumber?.Trim(),
                Role = model.Role,
                Status = StaffStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            staff.PasswordHash = _passwordHasher.HashPassword(staff, model.Password);

            _context.Staff.Add(staff);
            await _context.SaveChangesAsync();

            await SignInStaffAsync(staff, false);

            _cache.Remove(emailKey);
            return RedirectToAction("Index", "Dashboard");
        }

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Index", "Home");
        }

        private async Task SignInStaffAsync(Staff staff, bool remember)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, staff.ID.ToString()),
                new Claim(ClaimTypes.Name, staff.Name),
                new Claim(ClaimTypes.Email, staff.Email ?? string.Empty),
                new Claim(ClaimTypes.Role, staff.Role)
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = remember,
                AllowRefresh = true
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);
        }

        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> SendRegisterOtp([FromBody] OtpRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email))
            {
                return Json(new { success = false, message = "Email is required." });
            }

            var email = request.Email.Trim();
            var code = GenerateOtpCode();
            var cacheKey = GetRegisterOtpKey(email);

            _cache.Set(cacheKey, code, TimeSpan.FromMinutes(10));

            var body = $"Your Shefaa ICU registration code is: {code}\n\nThis code will expire in 10 minutes.";
            var sent = await _emailSender.SendAsync(email, "Shefaa ICU Registration Code", body);

            if (!sent)
            {
                _logger.LogWarning("Failed to send registration OTP email to {Email}", email);
                return Json(new { success = false, message = "Could not send email. Please check email address or try again later." });
            }

            return Json(new { success = true, message = "OTP sent to email." });
        }

        [HttpPost]
        [IgnoreAntiforgeryToken]
        public IActionResult VerifyRegisterOtp([FromBody] OtpVerifyRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Code))
            {
                return Json(new { success = false, message = "Email and code are required." });
            }

            var email = request.Email.Trim();
            var cacheKey = GetRegisterOtpKey(email);

            if (!_cache.TryGetValue<string>(cacheKey, out var expected) || !string.Equals(expected, request.Code.Trim(), StringComparison.Ordinal))
            {
                return Json(new { success = false, message = "Invalid or expired code." });
            }

            _cache.Remove(cacheKey);
            _cache.Set(GetRegisterVerifiedKey(email), true, TimeSpan.FromMinutes(15));

            return Json(new { success = true, message = "Email verified successfully." });
        }

        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> SendResetOtp([FromBody] OtpRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email))
            {
                return Json(new { success = false, message = "Email is required." });
            }

            var email = request.Email.Trim();
            var staff = await _context.Staff.FirstOrDefaultAsync(s => s.Email == email);
            if (staff == null)
            {
                return Json(new { success = false, message = "No account found with this email." });
            }

            var code = GenerateOtpCode();
            var cacheKey = GetResetOtpKey(email);
            _cache.Set(cacheKey, code, TimeSpan.FromMinutes(10));

            var body = $"Your Shefaa ICU password reset code is: {code}\n\nThis code will expire in 10 minutes.";
            var sent = await _emailSender.SendAsync(email, "Shefaa ICU Password Reset Code", body);

            if (!sent)
            {
                _logger.LogWarning("Failed to send reset OTP email to {Email}", email);
                return Json(new { success = false, message = "Could not send email. Please check email address or try again later." });
            }

            return Json(new { success = true, message = "OTP sent to email." });
        }

        [HttpPost]
        [IgnoreAntiforgeryToken]
        public IActionResult VerifyResetOtp([FromBody] OtpVerifyRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Code))
            {
                return Json(new { success = false, message = "Email and code are required." });
            }

            var email = request.Email.Trim();
            var cacheKey = GetResetOtpKey(email);

            if (!_cache.TryGetValue<string>(cacheKey, out var expected) || !string.Equals(expected, request.Code.Trim(), StringComparison.Ordinal))
            {
                return Json(new { success = false, message = "Invalid or expired code." });
            }

            _cache.Remove(cacheKey);
            _cache.Set(GetResetVerifiedKey(email), true, TimeSpan.FromMinutes(15));

            return Json(new { success = true, message = "OTP verified. You can set a new password." });
        }

        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return Json(new { success = false, message = "Invalid reset data." });
            }

            var email = request.Email.Trim();
            var verifiedKey = GetResetVerifiedKey(email);

            if (!_cache.TryGetValue<bool>(verifiedKey, out var verified) || !verified)
            {
                return Json(new { success = false, message = "OTP not verified." });
            }

            var staff = await _context.Staff.FirstOrDefaultAsync(s => s.Email == email);
            if (staff == null)
            {
                return Json(new { success = false, message = "Account not found." });
            }

            staff.PasswordHash = _passwordHasher.HashPassword(staff, request.NewPassword);
            await _context.SaveChangesAsync();

            _cache.Remove(verifiedKey);

            return Json(new { success = true, message = "Password updated successfully." });
        }

        private static string GenerateOtpCode()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        private static string GetRegisterOtpKey(string email) => $"register-otp:{email.ToLowerInvariant()}";
        private static string GetRegisterVerifiedKey(string email) => $"register-verified:{email.ToLowerInvariant()}";
        private static string GetResetOtpKey(string email) => $"reset-otp:{email.ToLowerInvariant()}";
        private static string GetResetVerifiedKey(string email) => $"reset-verified:{email.ToLowerInvariant()}";

        public sealed class OtpRequest
        {
            public string Email { get; set; } = string.Empty;
        }

        public sealed class OtpVerifyRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Code { get; set; } = string.Empty;
        }

        public sealed class ResetPasswordRequest
        {
            public string Email { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }
    }
}

