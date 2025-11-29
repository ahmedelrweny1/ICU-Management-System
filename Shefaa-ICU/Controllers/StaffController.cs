using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class StaffController : Controller
    {
        private readonly AppDbContext _context;

        public StaffController(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var staff = await _context.Staff
                .OrderBy(s => s.Name)
                .Select(s => new
                {
                    s.ID,
                    s.Name,
                    s.Role,
                    s.Specialty,
                    s.Email,
                    s.PhoneNumber,
                    s.Status,
                    s.ProfilePhotoPath,
                    s.CreatedAt
                })
                .ToListAsync();

            ViewBag.Staff = staff;
            ViewData["Title"] = "Staff Management";
            ViewData["PageTitle"] = "Staff Management";
            ViewData["ActivePage"] = "Staff";

            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                TempData["Error"] = "Staff ID not provided";
                return RedirectToAction(nameof(Index));
            }

            var staff = await _context.Staff.FirstOrDefaultAsync(s => s.ID == id);

            if (staff == null)
            {
                TempData["Error"] = "Staff member not found";
                return RedirectToAction(nameof(Index));
            }

            ViewBag.StaffMember = staff;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Staff staff)
        {
            if (staff.Name == null)
            {
                TempData["Error"] = "Staff name is required";
                return RedirectToAction(nameof(Index));
            }

            if (staff.Role == null)
            {
                TempData["Error"] = "Role is required";
                return RedirectToAction(nameof(Index));
            }

            if (staff.Username == null)
                staff.Username = staff.Name.Replace(" ", ".").ToLower();

            var existingUser = await _context.Staff.FirstOrDefaultAsync(s => s.Username == staff.Username);

            if (existingUser != null)
            {
                TempData["Error"] = "Username already exists";
                return RedirectToAction(nameof(Index));
            }

            staff.Status = StaffStatus.Active;
            staff.CreatedAt = DateTime.Now;

            _context.Staff.Add(staff);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Staff member added successfully";
            return RedirectToAction(nameof(Index));
        }

        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                TempData["Error"] = "Staff ID not provided";
                return RedirectToAction(nameof(Index));
            }

            var staff = await _context.Staff.FindAsync(id);
            if (staff == null)
            {
                TempData["Error"] = "Staff member not found";
                return RedirectToAction(nameof(Index));
            }

            ViewBag.StaffMember = staff;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Update(int id, Staff staff)
        {
            if (id != staff.ID)
            {
                TempData["Error"] = "Invalid staff ID";
                return RedirectToAction(nameof(Index));
            }

            if (staff.Name == null)
            {
                TempData["Error"] = "Staff name is required";
                return RedirectToAction(nameof(Index));
            }

            if (staff.Role == null)
            {
                TempData["Error"] = "Role is required";
                return RedirectToAction(nameof(Index));
            }
            var existingStaff = await _context.Staff.FindAsync(id);
            if (existingStaff == null)
            {
                TempData["Error"] = "Staff member not found";
                return RedirectToAction(nameof(Index));
            }

            if (existingStaff.Username != staff.Username)
            {
                var existingUser = await _context.Staff
                    .FirstOrDefaultAsync(s => s.Username == staff.Username && s.ID != id);

                if (existingUser != null)
                {
                    TempData["Error"] = "Username already exists";
                    return RedirectToAction(nameof(Index));
                }
                existingStaff.Username = staff.Username;
            }

            existingStaff.Name = staff.Name.Trim();
            existingStaff.Role = staff.Role;
            existingStaff.Specialty = staff.Specialty?.Trim();
            existingStaff.PhoneNumber = staff.PhoneNumber?.Trim();
            existingStaff.Email = staff.Email?.Trim();
            
            // Handle Status enum conversion from form
            var statusValue = Request.Form["Status"].ToString();
            if (Enum.TryParse<StaffStatus>(statusValue, out StaffStatus parsedStatus))
            {
                existingStaff.Status = parsedStatus;
            }
            else if (staff.Status.HasValue)
            {
                existingStaff.Status = staff.Status;
            }
            
            existingStaff.ProfilePhotoPath = staff.ProfilePhotoPath?.Trim();

            await _context.SaveChangesAsync();

            TempData["Success"] = "Staff member updated successfully";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var staff = await _context.Staff
                    .Include(s => s.AttendanceLogs)
                    .Include(s => s.ClinicalNotes)
                    .Include(s => s.Schedules)
                    .FirstOrDefaultAsync(s => s.ID == id);

                if (staff == null)
                {
                    TempData["Error"] = "Staff member not found";
                    return RedirectToAction(nameof(Index));
                }

                // Delete related records first (cascade delete)
                // AttendanceLogs
                if (staff.AttendanceLogs.Any())
                {
                    _context.AttendanceLogs.RemoveRange(staff.AttendanceLogs);
                }

                // ClinicalNotes
                if (staff.ClinicalNotes.Any())
                {
                    _context.ClinicalNotes.RemoveRange(staff.ClinicalNotes);
                }

                // Schedules
                if (staff.Schedules.Any())
                {
                    _context.Schedules.RemoveRange(staff.Schedules);
                }

                // Medications have SetNull delete behavior, so they will be automatically handled
                // Remove staff member
                _context.Staff.Remove(staff);
                await _context.SaveChangesAsync();

                TempData["Success"] = $"Staff member '{staff.Name}' deleted successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"Database error deleting staff: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                TempData["Error"] = $"Cannot delete staff member. They may have related records that cannot be removed. Error: {ex.InnerException?.Message ?? ex.Message}";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting staff: {ex.Message}");
                TempData["Error"] = $"Error deleting staff member: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CheckIn(int staffId)
        {

            var staff = await _context.Staff.FindAsync(staffId);
            if (staff == null)
            {
                TempData["Error"] = "Staff member not found";
                return RedirectToAction(nameof(Index));
            }
            var activeAttendance = await _context.AttendanceLogs
               .FirstOrDefaultAsync(a => a.StaffID == staffId && a.Status == AttendanceStatus.OnDuty && a.CheckOutTime == null);

            if (activeAttendance != null)
            {
                TempData["Error"] = $"{staff.Name} is already checked in since {activeAttendance.CheckInTime:MMM dd, yyyy HH:mm}";
                return RedirectToAction(nameof(Index));
            }
            var attendanceLog = new AttendanceLog
            {
                StaffID = staffId,
                CheckInTime = DateTime.Now,
                Status = AttendanceStatus.OnDuty
            };

            _context.AttendanceLogs.Add(attendanceLog);
            await _context.SaveChangesAsync();

            await UpdateStatusAsync(staffId, StaffStatus.Active);

            TempData["Success"] = $"{staff.Name} checked in successfully at {attendanceLog.CheckInTime:MMM dd, yyyy HH:mm}";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CheckOut(int staffId)
        {
            var staff = await _context.Staff.FindAsync(staffId);
            if (staff == null)
            {
                TempData["Error"] = "Staff member not found";
                return RedirectToAction(nameof(Index));
            }

            var activeAttendance = await _context.AttendanceLogs
                .FirstOrDefaultAsync(a => a.StaffID == staffId && a.Status == AttendanceStatus.OnDuty && a.CheckOutTime == null);

            if (activeAttendance == null)
            {
                TempData["Error"] = $"{staff.Name} is not currently checked in";
                return RedirectToAction(nameof(Index));
            }

            activeAttendance.CheckOutTime = DateTime.Now;
            activeAttendance.Status = AttendanceStatus.OffDuty;

            await _context.SaveChangesAsync();

            await UpdateStatusAsync(staffId, StaffStatus.Inactive);
            var duration = activeAttendance.CheckOutTime - activeAttendance.CheckInTime;
            TempData["Success"] = $"{staff.Name} checked out successfully. Duration: {duration.Value.Hours}h {duration.Value.Minutes}m";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateStatus(int id, StaffStatus status)
        {
                var staff = await _context.Staff.FindAsync(id);
                if (staff == null)
                {
                    TempData["Error"] = "Staff member not found";
                    return RedirectToAction(nameof(Index));
                }
                
                staff.Status = status;
                await _context.SaveChangesAsync();

                TempData["Success"] = $"Status updated to {status} for {staff.Name}";
                return RedirectToAction(nameof(Index));
        }

        private async Task UpdateStatusAsync(int staffId, StaffStatus status)
        {
            var staff = await _context.Staff.FindAsync(staffId);
            if (staff != null)
            {
                staff.Status = status;
                await _context.SaveChangesAsync();
            }
        }

        [HttpGet]
        public async Task<IActionResult> AttendanceReport(int? id)
        {
            if (id == null)
            {
                var allAttendance = await _context.AttendanceLogs
                    .Include(a => a.Staff)
                    .OrderByDescending(a => a.CheckInTime)
                    .Take(100)
                    .ToListAsync();

                ViewBag.AttendanceLogs = allAttendance;
                ViewBag.ReportType = "All Staff";
            }
            else
            {
                var staff = await _context.Staff.FindAsync(id);
                if (staff == null)
                {
                    TempData["Error"] = "Staff member not found";
                    return RedirectToAction(nameof(Index));
                }

                var staffAttendance = await _context.AttendanceLogs
                    .Where(a => a.StaffID == id)
                    .OrderByDescending(a => a.CheckInTime)
                    .Take(50)
                    .ToListAsync();

                ViewBag.AttendanceLogs = staffAttendance;
                ViewBag.StaffMember = staff;
                ViewBag.ReportType = $"{staff.Name}'s Attendance";
            }

            return View();
        }
    }
}
