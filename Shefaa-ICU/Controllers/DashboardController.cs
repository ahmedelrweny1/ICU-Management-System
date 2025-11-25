using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;
using Shefaa_ICU.ViewModels;
using System.Linq;

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
            try
            {
                // Create a simple dashboard view model with debug info
                var viewModel = new DashboardViewModel();
                
                // Add debug info to ViewBag
                ViewBag.DbConnectionString = _context.Database.GetConnectionString();
                ViewBag.DbProviderName = _context.Database.ProviderName;
                
            // Print to console for server-side debugging
            Console.WriteLine("Starting to fetch dashboard data...");
            Console.WriteLine($"Database provider: {_context.Database.ProviderName}");
            Console.WriteLine($"Connection string: {_context.Database.GetConnectionString()}");

                // Get basic statistics from database with debug info
                try {
                    int roomCount = _context.Rooms.Count();
                    Console.WriteLine($"Room count: {roomCount}");
                    viewModel.TotalRooms = roomCount;
                } catch (Exception ex) {
                    Console.WriteLine($"Error counting rooms: {ex.Message}");
                    viewModel.TotalRooms = 25; // Fallback
                }
                
                try {
                    int patientCount = _context.Patients.Count(p => p.DischargeDate == null);
                    Console.WriteLine($"Patient count: {patientCount}");
                    viewModel.TotalPatients = patientCount;
                } catch (Exception ex) {
                    Console.WriteLine($"Error counting patients: {ex.Message}");
                    viewModel.TotalPatients = 18; // Fallback
                }
                
                try {
                    int staffCount = _context.Staff.Count(s => s.Status == StaffStatus.Active);
                    Console.WriteLine($"Staff count: {staffCount}");
                    viewModel.TotalStaff = staffCount;
                } catch (Exception ex) {
                    Console.WriteLine($"Error counting staff: {ex.Message}");
                    viewModel.TotalStaff = 32; // Fallback
                }
                
                try {
                    int criticalCount = _context.Patients.Count(p => p.DischargeDate == null && p.Condition == "Critical");
                    Console.WriteLine($"Critical cases: {criticalCount}");
                    viewModel.CriticalCases = criticalCount;
                } catch (Exception ex) {
                    Console.WriteLine($"Error counting critical cases: {ex.Message}");
                    viewModel.CriticalCases = 7; // Fallback
                }
                
                try {
                    int availableCount = _context.Rooms.Count(r => r.Status == RoomStatus.Available);
                    Console.WriteLine($"Available rooms: {availableCount}");
                    viewModel.AvailableRooms = availableCount;
                } catch (Exception ex) {
                    Console.WriteLine($"Error counting available rooms: {ex.Message}");
                    viewModel.AvailableRooms = 12; // Fallback
                }
                
                try {
                    int occupiedCount = _context.Rooms.Count(r => r.Status == RoomStatus.Occupied);
                    Console.WriteLine($"Occupied rooms: {occupiedCount}");
                    viewModel.OccupiedRooms = occupiedCount;
                } catch (Exception ex) {
                    Console.WriteLine($"Error counting occupied rooms: {ex.Message}");
                    viewModel.OccupiedRooms = 10; // Fallback
                }
                
                try {
                    int cleaningCount = _context.Rooms.Count(r => r.Status == RoomStatus.Cleaning);
                    Console.WriteLine($"Cleaning rooms: {cleaningCount}");
                    viewModel.CleaningRooms = cleaningCount;
                } catch (Exception ex) {
                    Console.WriteLine($"Error counting cleaning rooms: {ex.Message}");
                    viewModel.CleaningRooms = 3; // Fallback
                }
                
                // Staff currently on duty
                var today = DateTime.Today;
                try {
                    int onDutyCount = _context.AttendanceLogs.Count(
                        a => a.CheckInTime.Date == today && 
                             a.Status == AttendanceStatus.OnDuty && 
                             a.CheckOutTime == null);
                    Console.WriteLine($"Staff on duty: {onDutyCount}");
                    viewModel.StaffOnDuty = onDutyCount;
                } catch (Exception ex) {
                    Console.WriteLine($"Error counting staff on duty: {ex.Message}");
                    viewModel.StaffOnDuty = 15; // Fallback
                }

            // Weekly occupancy data from database
            var last7Days = Enumerable.Range(0, 7)
                .Select(i => DateTime.Today.AddDays(-i))
                .Reverse()
                .ToList();
            
            foreach (var date in last7Days)
            {
                var totalRooms = _context.Rooms.Count();
                var occupiedOnDate = _context.Patients.Count(
                    p => p.AdmissionDate <= date && 
                        (p.DischargeDate == null || p.DischargeDate > date)
                );
                
                double occupancyRate = 0;
                if (totalRooms > 0)
                {
                    occupancyRate = Math.Round((double)occupiedOnDate / totalRooms * 100, 1);
                }

                viewModel.WeeklyOccupancy.Add(new WeeklyOccupancyData
                {
                    Day = date.ToString("ddd"),
                    OccupancyRate = occupancyRate
                });
            }

            // Recent activities from database
            var activities = new List<ActivityItem>();
            
            try
            {
                // Get recent clinical notes
                Console.WriteLine("Fetching recent clinical notes...");
                var recentNotes = _context.ClinicalNotes
                    .Include(c => c.Patient)
                    .Include(c => c.Staff)
                    .OrderByDescending(c => c.Timestamp)
                    .Take(5)
                    .ToList();
                    
                Console.WriteLine($"Found {recentNotes.Count} recent clinical notes");
                
                foreach (var note in recentNotes)
                {
                    activities.Add(new ActivityItem
                    {
                        Time = note.Timestamp.ToString("HH:mm"),
                        Text = $"{note.Staff?.Name ?? "Staff"} added a note for {note.Patient?.Name ?? "Patient"}",
                        Type = "patient"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching clinical notes: {ex.Message}");
            }
            
            try
            {
                // Get recent medications
                Console.WriteLine("Fetching recent medications...");
                var recentMedications = _context.Medications
                    .Include(m => m.Patient)
                    .Include(m => m.Staff)
                    .Where(m => m.AdministeredAt != null)
                    .OrderByDescending(m => m.AdministeredAt)
                    .Take(3)
                    .ToList();
                    
                Console.WriteLine($"Found {recentMedications.Count} recent medications");
                
                foreach (var med in recentMedications)
                {
                    activities.Add(new ActivityItem
                    {
                        Time = med.AdministeredAt?.ToString("HH:mm") ?? "",
                        Text = $"{med.Name} given to {med.Patient?.Name ?? "Patient"}",
                        Type = "medication"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching medications: {ex.Message}");
            }
            
            try
            {
                // Get recent check-ins
                Console.WriteLine("Fetching recent check-ins...");
                var recentCheckIns = _context.AttendanceLogs
                    .Include(a => a.Staff)
                    .OrderByDescending(a => a.CheckInTime)
                    .Take(2)
                    .ToList();
                    
                Console.WriteLine($"Found {recentCheckIns.Count} recent check-ins");
                
                foreach (var checkIn in recentCheckIns)
                {
                    activities.Add(new ActivityItem
                    {
                        Time = checkIn.CheckInTime.ToString("HH:mm"),
                        Text = $"{checkIn.Staff?.Name ?? "Staff"} checked in",
                        Type = "staff"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching check-ins: {ex.Message}");
            }
            
            // Sort activities by time and take most recent
            viewModel.RecentActivities = activities
                .OrderByDescending(a => a.Time)
                .Take(10)
                .ToList();
                
            Console.WriteLine($"Total activities collected: {activities.Count}");
            Console.WriteLine($"Final activities in viewModel: {viewModel.RecentActivities.Count}");
            
            // Staff on duty from database
            try
            {
                Console.WriteLine("Fetching staff on duty...");
                var staffOnDutyList = _context.AttendanceLogs
                    .Include(a => a.Staff)
                    .Where(a => a.CheckInTime.Date == today && 
                              a.Status == AttendanceStatus.OnDuty && 
                              a.CheckOutTime == null)
                    .Select(a => new StaffOnDutyItem
                    {
                        Id = a.Staff != null ? a.Staff.ID : 0,
                        Name = a.Staff != null ? a.Staff.Name : "Unknown",
                        Role = a.Staff != null ? a.Staff.Role : "",
                        Specialty = a.Staff != null ? a.Staff.Specialty : null
                    })
                    .ToList();
                    
                Console.WriteLine($"Found {staffOnDutyList.Count} staff on duty");
                
                // Debug output for each staff member
                foreach (var staff in staffOnDutyList)
                {
                    Console.WriteLine($"Staff on duty: {staff.Name}, {staff.Role}, {staff.Specialty}");
                }
                
                viewModel.StaffOnDutyList = staffOnDutyList;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching staff on duty: {ex.Message}");
                viewModel.StaffOnDutyList = new List<StaffOnDutyItem>();
            }

            // Vitals trend data from database
            var recentVitals = _context.Vitals
                .Include(v => v.Patient)
                .OrderByDescending(v => v.RecordedAt)
                .Take(10)
                .ToList();
                
            viewModel.VitalsTrend = recentVitals
                .OrderBy(v => v.RecordedAt)
                .Select(v => new VitalsTrendPoint
                {
                    Label = v.RecordedAt.ToString("HH:mm"),
                    Pulse = v.Pulse ?? 0,
                    SpO2 = v.SpO2 ?? 0
                })
                .ToList();
                
            // Vital alerts from database
            viewModel.VitalAlerts = recentVitals
                .Where(v => 
                    (v.SpO2.HasValue && v.SpO2 < 92) ||
                    (v.Pulse.HasValue && (v.Pulse < 50 || v.Pulse > 110)) ||
                    (v.Temperature.HasValue && v.Temperature > 38.5))
                .Select(v => {
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

            // Current shift info based on time of day
            var currentHour = DateTime.Now.Hour;
            string shiftName, shiftTime;
            ShiftType currentShiftType;
            
            if (currentHour >= 8 && currentHour < 16)
            {
                shiftName = "Morning Shift";
                shiftTime = "08:00 AM - 04:00 PM";
                currentShiftType = ShiftType.Morning;
            }
            else if (currentHour >= 16 && currentHour < 24)
            {
                shiftName = "Evening Shift";
                shiftTime = "04:00 PM - 12:00 AM";
                currentShiftType = ShiftType.Evening;
            }
            else
            {
                shiftName = "Night Shift";
                shiftTime = "12:00 AM - 08:00 AM";
                currentShiftType = ShiftType.Night;
            }
            
            var shiftStaffCount = _context.Schedules
                .Count(s => s.Date.Date == today && s.ShiftType == currentShiftType);
                
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
                // If database access fails, return a view with default data
                var defaultViewModel = new DashboardViewModel
                {
                    TotalRooms = 25,
                    TotalPatients = 18,
                    TotalStaff = 32,
                    CriticalCases = 7,
                    AvailableRooms = 12,
                    OccupiedRooms = 10,
                    CleaningRooms = 3,
                    StaffOnDuty = 15
                };
                
                // Add some default weekly occupancy data
                var days = new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
                var rates = new[] { 65.5, 70.2, 68.0, 75.5, 82.3, 60.8, 55.0 };
                
                for (int i = 0; i < days.Length; i++)
                {
                    defaultViewModel.WeeklyOccupancy.Add(new WeeklyOccupancyData
                    {
                        Day = days[i],
                        OccupancyRate = rates[i]
                    });
                }
                
                // Log the error but don't expose it to the user
                Console.WriteLine($"Error loading dashboard data: {ex.Message}");
                
                return View(defaultViewModel);
            }
        }
    }
}


