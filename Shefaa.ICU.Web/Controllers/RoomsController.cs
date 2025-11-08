using Microsoft.AspNetCore.Mvc;
using Shefaa.ICU.Web.Data;
using Shefaa.ICU.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Shefaa.ICU.Web.Controllers
{
    public class RoomsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public RoomsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Rooms
        public async Task<IActionResult> Index()
        {
            var rooms = await _context.Rooms.Include(r => r.Patient).ToListAsync();
            return View(rooms);
        }

        // POST: Rooms/UpdateStatus
        [HttpPost]
        public async Task<IActionResult> UpdateStatus(int id, string status)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
            {
                return NotFound();
            }

            room.Status = status;
            await _context.SaveChangesAsync();

            return Ok();
        }

        // POST: Rooms/AssignPatient
        [HttpPost]
        public async Task<IActionResult> AssignPatient(int roomId, string patientId)
        {
            var room = await _context.Rooms.FindAsync(roomId);
            var patient = await _context.Patients.FindAsync(patientId);

            if (room == null || patient == null)
            {
                return NotFound();
            }

            room.Status = "Occupied";
            room.PatientId = patientId;
            patient.Room = $"ICU-{roomId}";

            await _context.SaveChangesAsync();

            return Ok();
        }

        // POST: Rooms/Evacuate
        [HttpPost]
        public async Task<IActionResult> Evacuate(int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
            {
                return NotFound();
            }

            room.Status = "Cleaning";
            room.PatientId = null;
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}

