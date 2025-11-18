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

namespace Shefaa_ICU.Controllers
{
    [AllowAnonymous]
    public class AccountController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Staff> _passwordHasher;
        private readonly ILogger<AccountController> _logger;

        public AccountController(AppDbContext context, IPasswordHasher<Staff> passwordHasher, ILogger<AccountController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _logger = logger;
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
    }
}

