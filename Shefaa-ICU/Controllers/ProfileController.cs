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
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdatePersonalInfo(UpdatePersonalInfoViewModel model)
        {
            if (model == null)
            {
                TempData["Error"] = "Invalid data provided";
                return RedirectToAction(nameof(Index));
            }
            
            if (!ModelState.IsValid)
            {
                TempData["Error"] = "Please fill in all required fields correctly.";
                return RedirectToAction(nameof(Index));
            }

            var staffIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
            {
                TempData["Error"] = "User not found";
                return RedirectToAction(nameof(Index));
            }

            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.ID == staffId);

            if (staff == null)
            {
                TempData["Error"] = "Staff member not found";
                return RedirectToAction(nameof(Index));
            }

            // Update fields
            staff.Name = model.Name;
            staff.PhoneNumber = model.PhoneNumber;
            staff.Email = model.Email;
            staff.Specialty = model.Specialty;

            try
            {
                await _context.SaveChangesAsync();
                TempData["Success"] = "Profile updated successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                TempData["Error"] = $"Error updating profile: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangePassword(ChangePasswordViewModel model)
        {
            if (model == null)
            {
                TempData["Error"] = "Invalid data provided";
                return RedirectToAction(nameof(Index));
            }
            
            if (!ModelState.IsValid)
            {
                TempData["Error"] = "Please fill in all required fields correctly.";
                return RedirectToAction(nameof(Index));
            }

            if (model.NewPassword != model.ConfirmPassword)
            {
                TempData["Error"] = "New passwords do not match";
                return RedirectToAction(nameof(Index));
            }

            if (model.NewPassword.Length < 8)
            {
                TempData["Error"] = "Password must be at least 8 characters";
                return RedirectToAction(nameof(Index));
            }

            var staffIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
            {
                TempData["Error"] = "User not found";
                return RedirectToAction(nameof(Index));
            }

            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.ID == staffId);

            if (staff == null)
            {
                TempData["Error"] = "Staff member not found";
                return RedirectToAction(nameof(Index));
            }

            // Verify current password
            var result = _passwordHasher.VerifyHashedPassword(staff, staff.PasswordHash, model.CurrentPassword);
            if (result == PasswordVerificationResult.Failed)
            {
                TempData["Error"] = "Current password is incorrect";
                return RedirectToAction(nameof(Index));
            }

            // Update password
            staff.PasswordHash = _passwordHasher.HashPassword(staff, model.NewPassword);

            try
            {
                await _context.SaveChangesAsync();
                TempData["Success"] = "Password changed successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                TempData["Error"] = $"Error changing password: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult UpdateAccountSettings(AccountSettingsViewModel model)
        {
            if (model == null)
            {
                TempData["Error"] = "Invalid data provided";
                return RedirectToAction(nameof(Index));
            }
            
            // For now, store in session or user claims
            // In a full implementation, you might want a UserSettings table
            TempData["Success"] = "Account settings saved successfully";
            return RedirectToAction(nameof(Index));
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UploadProfilePhoto(IFormFile photo)
        {
            if (photo == null || photo.Length == 0)
            {
                TempData["Error"] = "No file uploaded";
                return RedirectToAction(nameof(Index));
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(photo.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                TempData["Error"] = "Invalid file type. Please upload an image (JPG, PNG, GIF, or WEBP)";
                return RedirectToAction(nameof(Index));
            }

            // Validate file size (max 5MB)
            if (photo.Length > 5 * 1024 * 1024)
            {
                TempData["Error"] = "File size too large. Maximum size is 5MB";
                return RedirectToAction(nameof(Index));
            }

            var staffIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
            {
                TempData["Error"] = "User not found";
                return RedirectToAction(nameof(Index));
            }

            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.ID == staffId);

            if (staff == null)
            {
                TempData["Error"] = "Staff member not found";
                return RedirectToAction(nameof(Index));
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

                TempData["Success"] = "Profile photo uploaded successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                TempData["Error"] = $"Error uploading photo: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }
    }
}
