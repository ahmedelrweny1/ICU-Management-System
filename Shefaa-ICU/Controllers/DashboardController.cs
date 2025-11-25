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

                // Set default values that will definitely show up
                viewModel.TotalRooms = 25;
                viewModel.TotalPatients = 18;
                viewModel.TotalStaff = 32;
                viewModel.CriticalCases = 7;
                viewModel.AvailableRooms = 12;
                viewModel.OccupiedRooms = 10;
                viewModel.CleaningRooms = 3;
                viewModel.StaffOnDuty = 15;
                
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

                // Add sample weekly occupancy data
                var days = new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
                var rates = new[] { 65.5, 70.2, 68.0, 75.5, 82.3, 60.8, 55.0 };
                
                for (int i = 0; i < days.Length; i++)
                {
                    viewModel.WeeklyOccupancy.Add(new WeeklyOccupancyData
                    {
                        Day = days[i],
                        OccupancyRate = rates[i]
                    });
                }

                // Add sample activities
                var activities = new List<ActivityItem>
                {
                    new ActivityItem { Time = "08:30", Text = "Dr. Smith added a note for Patient Ahmed", Type = "patient" },
                    new ActivityItem { Time = "09:15", Text = "Paracetamol administered to Patient Fatima by Nurse Johnson", Type = "medication" },
                    new ActivityItem { Time = "10:00", Text = "Dr. Wilson checked in", Type = "staff" },
                    new ActivityItem { Time = "11:30", Text = "Antibiotics administered to Patient Omar by Nurse Williams", Type = "medication" },
                    new ActivityItem { Time = "12:45", Text = "Dr. Brown added a note for Patient Sara", Type = "patient" },
                    new ActivityItem { Time = "13:20", Text = "Nurse Davis checked in", Type = "staff" },
                    new ActivityItem { Time = "14:00", Text = "Insulin administered to Patient Khalid by Nurse Miller", Type = "medication" }
                };
                
                viewModel.RecentActivities = activities;

                // Add sample staff on duty
                var staffOnDuty = new List<StaffOnDutyItem>
                {
                    new StaffOnDutyItem { Id = 1, Name = "Dr. Sarah Johnson", Role = "Doctor", Specialty = "Cardiology" },
                    new StaffOnDutyItem { Id = 2, Name = "Nurse Michael Brown", Role = "Nurse", Specialty = "Critical Care" },
                    new StaffOnDutyItem { Id = 3, Name = "Dr. Ahmed Hassan", Role = "Doctor", Specialty = "Pulmonology" },
                    new StaffOnDutyItem { Id = 4, Name = "Nurse Emily Wilson", Role = "Nurse", Specialty = "Emergency" },
                    new StaffOnDutyItem { Id = 5, Name = "Dr. James Taylor", Role = "Doctor", Specialty = "Neurology" }
                };
                
                viewModel.StaffOnDutyList = staffOnDuty;

                // Add sample vitals trend data
                var times = new[] { "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" };
                var pulseValues = new[] { 72, 75, 78, 80, 76, 74, 73 };
                var spo2Values = new[] { 98, 97, 96, 95, 96, 97, 98 };
                
                var vitalsTrend = new List<VitalsTrendPoint>();
                for (int i = 0; i < times.Length; i++)
                {
                    vitalsTrend.Add(new VitalsTrendPoint
                    {
                        Label = times[i],
                        Pulse = pulseValues[i],
                        SpO2 = spo2Values[i]
                    });
                }
                viewModel.VitalsTrend = vitalsTrend;
                
                // Add sample vital alerts
                var vitalAlerts = new List<VitalAlertItem>
                {
                    new VitalAlertItem
                    {
                        PatientName = "Ahmed Mohamed",
                        Metric = "SpO₂",
                        Value = "88%",
                        Severity = "danger",
                        RecordedAt = "10:15"
                    },
                    new VitalAlertItem
                    {
                        PatientName = "Sara Ali",
                        Metric = "Pulse",
                        Value = "115 bpm",
                        Severity = "warning",
                        RecordedAt = "11:30"
                    },
                    new VitalAlertItem
                    {
                        PatientName = "Khalid Omar",
                        Metric = "Temp",
                        Value = "39.2°C",
                        Severity = "warning",
                        RecordedAt = "12:45"
                    }
                };
                viewModel.VitalAlerts = vitalAlerts;

                // Set current shift info
                viewModel.CurrentShift = new ShiftInfo
                {
                    ShiftName = "Morning Shift",
                    ShiftTime = "08:00 AM - 04:00 PM",
                    StaffCount = 12
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


