using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Shefaa.ICU.Web.Models;
using Shefaa.ICU.Web.Data;
using Microsoft.EntityFrameworkCore;

namespace Shefaa.ICU.Web.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly ApplicationDbContext _context;

    public HomeController(ILogger<HomeController> logger, ApplicationDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    // Login page
    public IActionResult Index()
    {
        return View();
    }

    // Dashboard
    public async Task<IActionResult> Dashboard()
    {
        ViewBag.TotalRooms = await _context.Rooms.CountAsync();
        ViewBag.TotalPatients = await _context.Patients.CountAsync();
        ViewBag.TotalStaff = await _context.Staff.CountAsync();
        ViewBag.CriticalCases = await _context.Patients.CountAsync(p => p.Condition == "Critical");
        ViewBag.AvailableRooms = await _context.Rooms.CountAsync(r => r.Status == "Available");
        ViewBag.StaffOnDuty = await _context.Staff.CountAsync(s => s.Status == "On Duty");
        
        ViewBag.Activities = await _context.Activities.OrderByDescending(a => a.CreatedAt).Take(10).ToListAsync();
        ViewBag.OnDutyStaff = await _context.Staff.Where(s => s.Status == "On Duty").ToListAsync();
        ViewBag.Rooms = await _context.Rooms.ToListAsync();
        
        return View();
    }

    // Signup page
    public IActionResult Signup()
    {
        return View();
    }

    // Profile page
    public IActionResult Profile()
    {
        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = System.Diagnostics.Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
