using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class ReportsController : Controller
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            // Get all patients
            var patients = _context.Patients.ToList();
            
            // Get all rooms
            var rooms = _context.Rooms.ToList();
            
            // Get all staff
            var staff = _context.Staff.ToList();
            
            // Get all schedules
            var schedules = _context.Schedules.ToList();
            
            // Get attendance logs
            var attendanceLogs = _context.AttendanceLogs.ToList();

            // Calculate patient statistics
            var totalAdmissions = patients.Count;
            var ages = patients.Where(p => p.Age.HasValue).Select(p => p.Age.Value).ToList();
            var minAge = ages.Any() ? ages.Min() : 0;
            var maxAge = ages.Any() ? ages.Max() : 0;
            
            // Calculate average length of stay
            var avgStay = 0.0;
            if (patients.Any())
            {
                var totalDays = 0;
                foreach (var patient in patients)
                {
                    var days = (DateTime.Now - patient.AdmissionDate).Days;
                    totalDays += days;
                }
                avgStay = totalDays / (double)patients.Count;
            }

            // Calculate room occupancy
            var occupiedRooms = rooms.Count(r => r.Status == RoomStatus.Occupied);
            var occupancyRate = rooms.Any() ? (occupiedRooms * 100.0 / rooms.Count) : 0;
            var totalBeds = rooms.Count;

            // Calculate staff statistics
            var totalShifts = schedules.Count;
            var activeStaff = staff.Count(s => s.Status == StaffStatus.Active);
            var staffUtilization = activeStaff > 0 ? (totalShifts * 100.0 / (activeStaff * 30)) : 0; // Rough estimate

            // Pass data to view
            ViewBag.Patients = patients;
            ViewBag.Rooms = rooms;
            ViewBag.Staff = staff;
            ViewBag.TotalAdmissions = totalAdmissions;
            ViewBag.MinAge = minAge;
            ViewBag.MaxAge = maxAge;
            ViewBag.AvgStay = avgStay;
            ViewBag.OccupancyRate = occupancyRate;
            ViewBag.TotalBeds = totalBeds;
            ViewBag.TotalShifts = totalShifts;
            ViewBag.StaffUtilization = staffUtilization;

            return View();
        }
    }
}

