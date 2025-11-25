using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;
using Shefaa_ICU.ViewModels;
using System.Globalization;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                // Add debug information
                ViewBag.Debug = "Dashboard controller executed";
                
                var viewModel = new DashboardViewModel();

                // Set some default values for testing
                viewModel.TotalRooms = 10;
                viewModel.TotalPatients = 8;
                viewModel.TotalStaff = 12;
                viewModel.CriticalCases = 3;
                
                // Try to get actual values from database
                try {
                    viewModel.TotalRooms = await _context.Rooms.CountAsync();
                    viewModel.TotalPatients = await _context.Patients
                        .Where(p => p.DischargeDate == null)
                        .CountAsync();
                    viewModel.TotalStaff = await _context.Staff
                        .Where(s => s.Status == StaffStatus.Active)
                        .CountAsync();
                    viewModel.CriticalCases = await _context.Patients
                        .Where(p => p.DischargeDate == null && p.Condition == "Critical")
                        .CountAsync();
                } catch (Exception dbEx) {
                    ViewBag.DbError = dbEx.Message;
                }

                viewModel.AvailableRooms = await _context.Rooms
                    .Where(r => r.Status == RoomStatus.Available)
                    .CountAsync();
                viewModel.OccupiedRooms = await _context.Rooms
                    .Where(r => r.Status == RoomStatus.Occupied)
                    .CountAsync();
                viewModel.CleaningRooms = await _context.Rooms
                    .Where(r => r.Status == RoomStatus.Cleaning)
                    .CountAsync();

                var today = DateTime.Today;
                viewModel.StaffOnDuty = await _context.AttendanceLogs
                    .Where(a => a.CheckInTime.Date == today && 
                                a.Status == AttendanceStatus.OnDuty && 
                                a.CheckOutTime == null)
                    .CountAsync();

                var last7Days = Enumerable.Range(0, 7)
                    .Select(i => DateTime.Today.AddDays(-i))
                    .Reverse()
                    .ToList();

                foreach (var date in last7Days)
                {
                    var totalRooms = await _context.Rooms.CountAsync();
                    var occupiedOnDate = await _context.Patients
                        .Where(p => p.AdmissionDate <= date && 
                                   (p.DischargeDate == null || p.DischargeDate > date))
                        .CountAsync();
                    
                    var occupancyRate = totalRooms > 0 
                        ? Math.Round((occupiedOnDate / (double)totalRooms) * 100, 1)
                        : 0;

                    viewModel.WeeklyOccupancy.Add(new WeeklyOccupancyData
                    {
                        Day = date.ToString("ddd", CultureInfo.InvariantCulture),
                        OccupancyRate = occupancyRate
                    });
                }

                var recentActivities = new List<ActivityItem>();

                var recentNotes = await _context.ClinicalNotes
                    .Include(c => c.Patient)
                    .Include(c => c.Staff)
                    .OrderByDescending(c => c.Timestamp)
                    .Take(5)
                    .ToListAsync();

                foreach (var note in recentNotes)
                {
                    recentActivities.Add(new ActivityItem
                    {
                        Time = note.Timestamp.ToString("HH:mm"),
                        Text = $"{note.Staff?.Name ?? "Staff"} added a note for {note.Patient?.Name ?? "Patient"}",
                        Type = "patient"
                    });
                }

                var recentMedications = await _context.Medications
                    .Include(m => m.Patient)
                    .Include(m => m.Staff)
                    .Where(m => m.AdministeredAt != null)
                    .OrderByDescending(m => m.AdministeredAt)
                    .Take(3)
                    .ToListAsync();

                foreach (var med in recentMedications)
                {
                    recentActivities.Add(new ActivityItem
                    {
                        Time = med.AdministeredAt?.ToString("HH:mm") ?? "",
                        Text = $"{med.Name} administered to {med.Patient?.Name ?? "Patient"} by {med.Staff?.Name ?? "Staff"}",
                        Type = "medication"
                    });
                }

                var recentCheckIns = await _context.AttendanceLogs
                    .Include(a => a.Staff)
                    .OrderByDescending(a => a.CheckInTime)
                    .Take(2)
                    .ToListAsync();

                foreach (var checkIn in recentCheckIns)
                {
                    recentActivities.Add(new ActivityItem
                    {
                        Time = checkIn.CheckInTime.ToString("HH:mm"),
                        Text = $"{checkIn.Staff?.Name ?? "Staff"} checked in",
                        Type = "staff"
                    });
                }

                viewModel.RecentActivities = recentActivities
                    .OrderByDescending(a => a.Time)
                    .Take(10)
                    .ToList();

                var staffOnDuty = await _context.AttendanceLogs
                    .Include(a => a.Staff)
                    .Where(a => a.CheckInTime.Date == today && 
                                a.Status == AttendanceStatus.OnDuty && 
                                a.CheckOutTime == null)
                    .Select(a => new StaffOnDutyItem
                    {
                        Id = a.Staff!.ID,
                        Name = a.Staff.Name,
                        Role = a.Staff.Role,
                        Specialty = a.Staff.Specialty
                    })
                    .ToListAsync();

                viewModel.StaffOnDutyList = staffOnDuty;

                var recentVitals = await _context.Vitals
                    .Include(v => v.Patient)
                    .OrderByDescending(v => v.RecordedAt)
                    .Take(10)
                    .ToListAsync();

                viewModel.VitalsTrend = recentVitals
                    .OrderBy(v => v.RecordedAt)
                    .Select(v => new VitalsTrendPoint
                    {
                        Label = v.RecordedAt.ToString("HH:mm"),
                        Pulse = v.Pulse ?? 0,
                        SpO2 = v.SpO2 ?? 0
                    })
                    .ToList();

                viewModel.VitalAlerts = recentVitals
                    .Where(v =>
                        (v.SpO2.HasValue && v.SpO2 < 92) ||
                        (v.Pulse.HasValue && (v.Pulse < 50 || v.Pulse > 110)) ||
                        (v.Temperature.HasValue && v.Temperature > 38.5))
                    .Select(v =>
                    {
                        string metric;
                        string value;
                        string severity = "warning";

                        if (v.SpO2.HasValue && v.SpO2 < 92)
                        {
                            metric = "SpO₂";
                            value = $"{v.SpO2}%";
                            severity = "danger";
                        }
                        else if (v.Pulse.HasValue && (v.Pulse < 50 || v.Pulse > 110))
                        {
                            metric = "Pulse";
                            value = $"{v.Pulse} bpm";
                        }
                        else
                        {
                            metric = "Temp";
                            value = $"{v.Temperature:0.0}°C";
                        }

                        return new VitalAlertItem
                        {
                            PatientName = v.Patient?.Name ?? "Unknown",
                            Metric = metric,
                            Value = value,
                            Severity = severity,
                            RecordedAt = v.RecordedAt.ToString("HH:mm")
                        };
                    })
                    .Take(4)
                    .ToList();

                var currentHour = DateTime.Now.Hour;
                string shiftName, shiftTime;
                
                if (currentHour >= 8 && currentHour < 16)
                {
                    shiftName = "Morning Shift";
                    shiftTime = "08:00 AM - 04:00 PM";
                }
                else if (currentHour >= 16 && currentHour < 24)
                {
                    shiftName = "Evening Shift";
                    shiftTime = "04:00 PM - 12:00 AM";
                }
                else
                {
                    shiftName = "Night Shift";
                    shiftTime = "12:00 AM - 08:00 AM";
                }

                var currentShiftType = currentHour >= 8 && currentHour < 16 ? ShiftType.Morning :
                                      currentHour >= 16 && currentHour < 24 ? ShiftType.Evening :
                                      ShiftType.Night;

                var shiftStaffCount = await _context.Schedules
                    .Where(s => s.Date == today && s.ShiftType == currentShiftType)
                    .CountAsync();

                viewModel.CurrentShift = new ShiftInfo
                {
                    ShiftName = shiftName,
                    ShiftTime = shiftTime,
                    StaffCount = shiftStaffCount
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                ViewBag.Error = "An error occurred while loading dashboard data";
                return View(new DashboardViewModel());
            }
        }
    }
}


