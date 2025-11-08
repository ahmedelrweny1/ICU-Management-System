using Microsoft.AspNetCore.Mvc;
using Shefaa.ICU.Web.Data;
using Microsoft.EntityFrameworkCore;

namespace Shefaa.ICU.Web.Controllers
{
    public class ReportsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Reports
        public async Task<IActionResult> Index()
        {
            ViewBag.Patients = await _context.Patients.ToListAsync();
            ViewBag.Rooms = await _context.Rooms.ToListAsync();
            ViewBag.Staff = await _context.Staff.ToListAsync();
            return View();
        }

        // GET: Reports/ExportPDF
        public IActionResult ExportPDF()
        {
            // PDF export implementation
            return File(new byte[0], "application/pdf", "report.pdf");
        }

        // GET: Reports/ExportCSV
        public async Task<IActionResult> ExportCSV()
        {
            var patients = await _context.Patients.ToListAsync();
            // CSV export implementation
            return File(new byte[0], "text/csv", "patients.csv");
        }
    }
}

