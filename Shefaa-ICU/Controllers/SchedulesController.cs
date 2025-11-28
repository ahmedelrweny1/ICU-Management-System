using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;
using Shefaa_ICU.Services;
using System.Linq;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class SchedulesController : Controller
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;

        public SchedulesController(AppDbContext context, NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public IActionResult Index(string weekStart = null)
        {
            // Get today's date
            var today = DateTime.Today;
            
            // Get start of week - use parameter if provided, otherwise use current week
            DateTime startOfWeek;
            if (!string.IsNullOrEmpty(weekStart) && DateTime.TryParse(weekStart, out DateTime parsedDate))
            {
                startOfWeek = parsedDate.AddDays(-(int)parsedDate.DayOfWeek + (int)DayOfWeek.Monday);
                if (parsedDate.DayOfWeek == DayOfWeek.Sunday)
                {
                    startOfWeek = startOfWeek.AddDays(-7);
                }
            }
            else
            {
                startOfWeek = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
                if (today.DayOfWeek == DayOfWeek.Sunday)
                {
                    startOfWeek = startOfWeek.AddDays(-7);
                }
            }
            
            // Get end of week (Sunday)
            var endOfWeek = startOfWeek.AddDays(6);

            // Get all schedules for this week
            var schedules = _context.Schedules
                .Include(s => s.Staff)
                .Where(s => s.Date >= startOfWeek && s.Date <= endOfWeek)
                .ToList();

            // Count schedules by shift type for today
            var morningCount = _context.Schedules
                .Count(s => s.Date.Date == today && s.ShiftType == ShiftType.Morning);
            
            var eveningCount = _context.Schedules
                .Count(s => s.Date.Date == today && s.ShiftType == ShiftType.Evening);
            
            var nightCount = _context.Schedules
                .Count(s => s.Date.Date == today && s.ShiftType == ShiftType.Night);

            // Get all staff for dropdown
            var staffList = _context.Staff
                .Where(s => s.Status == StaffStatus.Active)
                .OrderBy(s => s.Name)
                .ToList();

            // Pass data to view
            ViewBag.Schedules = schedules;
            ViewBag.MorningCount = morningCount;
            ViewBag.EveningCount = eveningCount;
            ViewBag.NightCount = nightCount;
            ViewBag.StaffList = staffList;
            ViewBag.StartOfWeek = startOfWeek;
            ViewBag.EndOfWeek = endOfWeek;

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveSchedule(string date, string shiftType, string notes, int[] staffIds)
        {
            try
            {
                // Debug logging
                Console.WriteLine($"SaveSchedule called - Date: {date}, ShiftType: {shiftType}, StaffIds: {(staffIds != null ? string.Join(",", staffIds) : "null")}");
                
                // Parse date
                if (!DateTime.TryParse(date, out DateTime scheduleDate))
                {
                    return Json(new { success = false, message = "Invalid date" });
                }

                // Parse shift type
                if (!Enum.TryParse<ShiftType>(shiftType, out ShiftType shift))
                {
                    return Json(new { success = false, message = "Invalid shift type" });
                }

                // Validate staff IDs - check if null or empty
                if (staffIds == null || staffIds.Length == 0)
                {
                    // Try to get from form collection as fallback
                    var formStaffIds = Request.Form["staffIds"];
                    if (formStaffIds.Count > 0)
                    {
                        staffIds = formStaffIds.Select(id => int.Parse(id.ToString())).ToArray();
                        Console.WriteLine($"Got staffIds from Form collection: {string.Join(",", staffIds)}");
                    }
                    else
                    {
                        return Json(new { success = false, message = "Please select at least one staff member. No staff IDs received." });
                    }
                }
                
                // Final validation
                if (staffIds == null || staffIds.Length == 0)
                {
                    return Json(new { success = false, message = "Please select at least one staff member" });
                }

                // Verify all staff exist and are active, and get their names
                var staffList = new List<string>();
                foreach (var staffId in staffIds)
                {
                    var staff = await _context.Staff
                        .FirstOrDefaultAsync(s => s.ID == staffId && s.Status == StaffStatus.Active);
                    
                    if (staff == null)
                    {
                        return Json(new { success = false, message = $"Staff member with ID {staffId} is not active or does not exist" });
                    }
                    staffList.Add(staff.Name);
                }

                // Save schedule for each staff member
                foreach (var staffId in staffIds)
                {
                    // Check if schedule already exists
                    var existing = await _context.Schedules
                        .FirstOrDefaultAsync(s => s.Date.Date == scheduleDate.Date && 
                                           s.ShiftType == shift && 
                                           s.StaffID == staffId);

                    if (existing == null)
                    {
                        var schedule = new Schedule
                        {
                            Date = scheduleDate,
                            ShiftType = shift,
                            StaffID = staffId,
                            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim()
                        };

                        _context.Schedules.Add(schedule);
                    }
                }

                await _context.SaveChangesAsync();

                // Main action: Notify everyone about schedule changes
                var staffNames = string.Join(", ", staffList);
                
                await _notificationService.NotifyMainActionAsync(
                    "Schedule Updated",
                    $"{shift} shift scheduled for {scheduleDate:MMM dd} - Staff: {staffNames}",
                    NotificationType.Info,
                    "fa-calendar-alt",
                    "Schedule",
                    null
                );

                return Json(new { success = true, message = "Schedule saved successfully" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteSchedule(string date, string shiftType)
        {
            try
            {
                // Parse date
                if (!DateTime.TryParse(date, out DateTime scheduleDate))
                {
                    return Json(new { success = false, message = "Invalid date" });
                }

                // Parse shift type
                if (!Enum.TryParse<ShiftType>(shiftType, out ShiftType shift))
                {
                    return Json(new { success = false, message = "Invalid shift type" });
                }

                // Find and delete all schedules for this date and shift type
                var schedulesToDelete = _context.Schedules
                    .Where(s => s.Date.Date == scheduleDate.Date && s.ShiftType == shift)
                    .ToList();

                if (schedulesToDelete.Count == 0)
                {
                    return Json(new { success = false, message = "No schedules found to delete" });
                }

                _context.Schedules.RemoveRange(schedulesToDelete);
                await _context.SaveChangesAsync();

                // Main action: Notify everyone about schedule deletion
                await _notificationService.NotifyMainActionAsync(
                    "Schedule Deleted",
                    $"{shift} shift deleted for {scheduleDate:MMM dd}",
                    NotificationType.Warning,
                    "fa-calendar-times",
                    "Schedule",
                    null
                );

                return Json(new { success = true, message = "Schedule deleted successfully" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }
    }
}

