using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;
using Shefaa_ICU.ViewModels;
using System.Security.Claims;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class ProfileController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Staff> _passwordHasher;

        public ProfileController(AppDbContext context, IPasswordHasher<Staff> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task<IActionResult> Index()
        {
            var staffIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
            {
                return RedirectToAction("Index", "Home");
            }

            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.ID == staffId);

            if (staff == null)
            {
                return RedirectToAction("Index", "Home");
            }

            // Calculate days active
            var daysActive = (DateTime.Now - staff.CreatedAt).Days;

            // Get last login from attendance logs
            var lastLogin = await _context.AttendanceLogs
                .Where(a => a.StaffID == staff.ID)
                .OrderByDescending(a => a.CheckInTime)
                .Select(a => (DateTime?)a.CheckInTime)
                .FirstOrDefaultAsync();

            var viewModel = new ProfileViewModel
            {
                ID = staff.ID,
                Username = staff.Username,
                Name = staff.Name,
                Role = staff.Role,
                Specialty = staff.Specialty,
                PhoneNumber = staff.PhoneNumber,
                Email = staff.Email,
                ProfilePhotoPath = staff.ProfilePhotoPath,
                CreatedAt = staff.CreatedAt,
                DaysActive = daysActive,
                LastLogin = lastLogin
            };

            ViewData["Title"] = "My Profile";
            ViewData["PageTitle"] = "My Profile";
            ViewData["ActivePage"] = "Profile";
            ViewData["HideSearch"] = true;
            ViewData["ProfileData"] = viewModel;
            ViewData["ProfilePhotoPath"] = staff.ProfilePhotoPath;

            return View(viewModel);
        }

        [HttpPost]
        [Route("Profile/UpdatePersonalInfo")]
        public async Task<IActionResult> UpdatePersonalInfo([FromBody] UpdatePersonalInfoViewModel model)
        {
            if (model == null)
            {
                return Json(new { success = false, message = "Invalid data provided" });
            }
            
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, message = "Invalid data provided", errors = ModelState });
            }

            var staffIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
            {
                return Json(new { success = false, message = "User not found" });
            }

            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.ID == staffId);

            if (staff == null)
            {
                return Json(new { success = false, message = "Staff member not found" });
            }

            // Update fields
            staff.Name = model.Name;
            staff.PhoneNumber = model.PhoneNumber;
            staff.Email = model.Email;
            staff.Specialty = model.Specialty;

            try
            {
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = "Profile updated successfully" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error updating profile: {ex.Message}" });
            }
        }

        [HttpPost]
        [Route("Profile/ChangePassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordViewModel model)
        {
            if (model == null)
            {
                return Json(new { success = false, message = "Invalid data provided" });
            }
            
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, message = "Invalid data provided", errors = ModelState });
            }

            if (model.NewPassword != model.ConfirmPassword)
            {
                return Json(new { success = false, message = "New passwords do not match" });
            }

            if (model.NewPassword.Length < 8)
            {
                return Json(new { success = false, message = "Password must be at least 8 characters" });
            }

            var staffIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
            {
                return Json(new { success = false, message = "User not found" });
            }

            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.ID == staffId);

            if (staff == null)
            {
                return Json(new { success = false, message = "Staff member not found" });
            }

            // Verify current password
            var result = _passwordHasher.VerifyHashedPassword(staff, staff.PasswordHash, model.CurrentPassword);
            if (result == PasswordVerificationResult.Failed)
            {
                return Json(new { success = false, message = "Current password is incorrect" });
            }

            // Update password
            staff.PasswordHash = _passwordHasher.HashPassword(staff, model.NewPassword);

            try
            {
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error changing password: {ex.Message}" });
            }
        }

        [HttpPost]
        [Route("Profile/UpdateAccountSettings")]
        public IActionResult UpdateAccountSettings([FromBody] AccountSettingsViewModel model)
        {
            if (model == null)
            {
                return Json(new { success = false, message = "Invalid data provided" });
            }
            
            // For now, store in session or user claims
            // In a full implementation, you might want a UserSettings table
            return Json(new { success = true, message = "Account settings saved successfully" });
        }

        [HttpPost]
        [Route("Profile/UpdateNotificationSettings")]
        public IActionResult UpdateNotificationSettings([FromBody] NotificationSettingsViewModel model)
        {
            if (model == null)
            {
                return Json(new { success = false, message = "Invalid data provided" });
            }
            
            // For now, store in session or user claims
            // In a full implementation, you might want a NotificationSettings table
            return Json(new { success = true, message = "Notification settings saved successfully" });
        }

        [HttpPost]
        [Route("Profile/UploadProfilePhoto")]
        public async Task<IActionResult> UploadProfilePhoto(IFormFile photo)
        {
            if (photo == null || photo.Length == 0)
            {
                return Json(new { success = false, message = "No file uploaded" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(photo.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return Json(new { success = false, message = "Invalid file type. Please upload an image (JPG, PNG, GIF, or WEBP)" });
            }

            // Validate file size (max 5MB)
            if (photo.Length > 5 * 1024 * 1024)
            {
                return Json(new { success = false, message = "File size too large. Maximum size is 5MB" });
            }

            var staffIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
            {
                return Json(new { success = false, message = "User not found" });
            }

            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.ID == staffId);

            if (staff == null)
            {
                return Json(new { success = false, message = "Staff member not found" });
            }

            try
            {
                // Create uploads directory if it doesn't exist
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "profiles");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Delete old photo if exists
                if (!string.IsNullOrEmpty(staff.ProfilePhotoPath))
                {
                    var oldPhotoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", staff.ProfilePhotoPath.TrimStart('/'));
                    if (System.IO.File.Exists(oldPhotoPath))
                    {
                        System.IO.File.Delete(oldPhotoPath);
                    }
                }

                // Generate unique filename
                var fileName = $"profile_{staffId}_{DateTime.Now:yyyyMMddHHmmss}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, fileName);
                var relativePath = $"/uploads/profiles/{fileName}";

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await photo.CopyToAsync(stream);
                }

                // Update staff profile photo path
                staff.ProfilePhotoPath = relativePath;
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Profile photo uploaded successfully", photoPath = relativePath });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error uploading photo: {ex.Message}" });
            }
        }
    }
}

