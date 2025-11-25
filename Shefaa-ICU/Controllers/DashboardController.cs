using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shefaa_ICU.Data;
using Shefaa_ICU.ViewModels;

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

        public IActionResult Index()
        {
            // Create a simple dashboard view model
            var viewModel = new DashboardViewModel();

            // Basic statistics
            viewModel.TotalRooms = 25;
            viewModel.TotalPatients = 18;
            viewModel.TotalStaff = 32;
            viewModel.CriticalCases = 7;
            viewModel.AvailableRooms = 12;
            viewModel.OccupiedRooms = 10;
            viewModel.CleaningRooms = 3;
            viewModel.StaffOnDuty = 15;

            // Weekly occupancy data - simple array approach
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

            // Recent activities
            viewModel.RecentActivities = new List<ActivityItem>
            {
                new ActivityItem { Time = "08:30", Text = "Dr. Smith added a note for Patient Ahmed", Type = "patient" },
                new ActivityItem { Time = "09:15", Text = "Medication given to Patient Fatima", Type = "medication" },
                new ActivityItem { Time = "10:00", Text = "Dr. Wilson checked in", Type = "staff" },
                new ActivityItem { Time = "11:30", Text = "Medication given to Patient Omar", Type = "medication" },
                new ActivityItem { Time = "12:45", Text = "Dr. Brown added a note for Patient Sara", Type = "patient" }
            };
            
            // Staff on duty
            viewModel.StaffOnDutyList = new List<StaffOnDutyItem>
            {
                new StaffOnDutyItem { Id = 1, Name = "Dr. Sarah Johnson", Role = "Doctor", Specialty = "Cardiology" },
                new StaffOnDutyItem { Id = 2, Name = "Nurse Michael Brown", Role = "Nurse", Specialty = "Critical Care" },
                new StaffOnDutyItem { Id = 3, Name = "Dr. Ahmed Hassan", Role = "Doctor", Specialty = "Pulmonology" },
                new StaffOnDutyItem { Id = 4, Name = "Nurse Emily Wilson", Role = "Nurse", Specialty = "Emergency" }
            };

            // Vitals trend data
            viewModel.VitalsTrend = new List<VitalsTrendPoint>
            {
                new VitalsTrendPoint { Label = "08:00", Pulse = 72, SpO2 = 98 },
                new VitalsTrendPoint { Label = "09:00", Pulse = 75, SpO2 = 97 },
                new VitalsTrendPoint { Label = "10:00", Pulse = 78, SpO2 = 96 },
                new VitalsTrendPoint { Label = "11:00", Pulse = 80, SpO2 = 95 },
                new VitalsTrendPoint { Label = "12:00", Pulse = 76, SpO2 = 96 },
                new VitalsTrendPoint { Label = "13:00", Pulse = 74, SpO2 = 97 }
            };
            
            // Vital alerts
            viewModel.VitalAlerts = new List<VitalAlertItem>
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
                }
            };

            // Current shift info
            viewModel.CurrentShift = new ShiftInfo
            {
                ShiftName = "Morning Shift",
                ShiftTime = "08:00 AM - 04:00 PM",
                StaffCount = 12
            };

            return View(viewModel);
        }
    }
}


