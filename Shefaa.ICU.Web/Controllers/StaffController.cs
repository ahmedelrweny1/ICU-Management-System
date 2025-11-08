using Microsoft.AspNetCore.Mvc;
using Shefaa.ICU.Web.Data;
using Shefaa.ICU.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Shefaa.ICU.Web.Controllers
{
    public class StaffController : Controller
    {
        private readonly ApplicationDbContext _context;

        public StaffController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Staff
        public async Task<IActionResult> Index()
        {
            var staff = await _context.Staff.ToListAsync();
            return View(staff);
        }

        // GET: Staff/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: Staff/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Staff staff)
        {
            if (ModelState.IsValid)
            {
                var count = await _context.Staff.CountAsync();
                staff.Id = "S" + (count + 1).ToString().PadLeft(3, '0');
                _context.Add(staff);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(staff);
        }

        // GET: Staff/Edit/5
        public async Task<IActionResult> Edit(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var staff = await _context.Staff.FindAsync(id);
            if (staff == null)
            {
                return NotFound();
            }
            return View(staff);
        }

        // POST: Staff/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(string id, Staff staff)
        {
            if (id != staff.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(staff);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!StaffExists(staff.Id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            return View(staff);
        }

        // POST: Staff/UpdateAttendance
        [HttpPost]
        public async Task<IActionResult> UpdateAttendance(string id, string status, string time)
        {
            var staff = await _context.Staff.FindAsync(id);
            if (staff == null)
            {
                return NotFound();
            }

            staff.Status = status;
            if (status == "On Duty")
            {
                staff.CheckInTime = time;
            }
            else
            {
                staff.CheckOutTime = time;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        private bool StaffExists(string id)
        {
            return _context.Staff.Any(e => e.Id == id);
        }
    }
}

