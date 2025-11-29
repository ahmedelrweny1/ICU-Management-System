using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Models;
using Shefaa_ICU.Data;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class RoomsController : Controller
    {
        private readonly AppDbContext _context;

        public RoomsController(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var rooms = await _context.Rooms
                .Include(r => r.Patient)
                .Select(r => new
                {
                    r.ID,
                    r.Number,
                    r.Status,
                    r.Notes,
                    PatientName = r.Patient != null ? r.Patient.Name : "Available",
                    PatientCondition = r.Patient != null ? r.Patient.Condition : null,
                    PatientId = r.Patient != null ? r.Patient.ID : (int?)null
                })
                .ToListAsync();

            ViewBag.Rooms = rooms;
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetRooms()
        {
            var rooms = await _context.Rooms
                .Include(r => r.Patient)
                .Select(r => new
                {
                    r.ID,
                    r.Number,
                    r.Status,
                    r.Notes,
                    PatientName = r.Patient != null ? r.Patient.Name : "Available",
                    PatientId = r.Patient != null ? r.Patient.ID : (int?)null,
                    PatientCondition = r.Patient != null ? r.Patient.Condition : null
                })
                .ToListAsync();

            return Json(new { success = true, data = rooms });

        }

        [HttpGet]
        public async Task<IActionResult> GetRoom(int id)
        {
            var room = await _context.Rooms
                .Include(r => r.Patient)
                .FirstOrDefaultAsync(r => r.ID == id);

            if (room == null)
                return Json(new { success = false, message = "Room not found" });

            return Json(new { success = true, data = room });
        }

        [HttpPost]
        public async Task<IActionResult> AddRoom([FromBody] Room room)
        {
            if (!ModelState.IsValid)
                return Json(new { success = false, message = "Invalid room data" });

            var existingRoom = await _context.Rooms
                .FirstOrDefaultAsync(r => r.Number == room.Number);

            if (existingRoom != null)
                return Json(new { success = false, message = "Room number already exists" });

            room.Status = RoomStatus.Available;
            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Room added successfully", data = room });
        }

        [HttpPost]
        public async Task<IActionResult> UpdateRoom([FromBody] Room room)
        {
            if (!ModelState.IsValid)
                return Json(new { success = false, message = "Invalid room data" });

            var existingRoom = await _context.Rooms.FindAsync(room.ID);
            if (existingRoom == null)
                return Json(new { success = false, message = "Room not found" });

            var duplicateRoom = await _context.Rooms
                .FirstOrDefaultAsync(r => r.Number == room.Number && r.ID != room.ID);

            if (duplicateRoom != null)
                return Json(new { success = false, message = "Room number already exists" });

            existingRoom.Number = room.Number;
            existingRoom.Status = room.Status;
            existingRoom.Notes = room.Notes;

            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Room updated successfully" });
        }

        [HttpPost]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var room = await _context.Rooms
                .Include(r => r.Patient)
                .FirstOrDefaultAsync(r => r.ID == id);

            if (room == null)
                return Json(new { success = false, message = "Room not found" });

            if (room.PatientID.HasValue)
                return Json(new { success = false, message = "Cannot delete room with assigned patient" });

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Room deleted successfully" });
        }

        [HttpPost]
        public async Task<IActionResult> AssignPatientToRoom(int roomId, int patientId)
        {
            var room = await _context.Rooms.FindAsync(roomId);
            var patient = await _context.Patients.FindAsync(patientId);

            if (room == null || patient == null)
                return Json(new { success = false, message = "Room or patient not found" });

            if (room.Status != RoomStatus.Available)
                return Json(new { success = false, message = "Room is not available" });

            if (patient.RoomId.HasValue)
            {
                var oldRoom = await _context.Rooms.FindAsync(patient.RoomId.Value);
                if (oldRoom != null)
                {
                    oldRoom.Status = RoomStatus.Available;
                    oldRoom.PatientID = null;
                }
            }

            room.Status = RoomStatus.Occupied;
            room.PatientID = patientId;
            patient.RoomId = roomId;

            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Patient assigned to room successfully" });
        }

        [HttpPost]
        public async Task<IActionResult> EvacuateRoom(int roomId)
        {
            var room = await _context.Rooms
                .Include(r => r.Patient)
                .FirstOrDefaultAsync(r => r.ID == roomId);

            if (room == null)
                return Json(new { success = false, message = "Room not found" });

            if (!room.PatientID.HasValue)
                return Json(new { success = false, message = "No patient assigned to this room" });

            var patient = room.Patient;
            patient.RoomId = null;
            room.Status = RoomStatus.Available;
            room.PatientID = null;

            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Patient removed from room successfully" });
        }

        [HttpPost]
        public async Task<IActionResult> MarkRoomAvailable(int roomId)
        {
            var room = await _context.Rooms
                .Include(r => r.Patient)
                .FirstOrDefaultAsync(r => r.ID == roomId);

            if (room == null)
                return Json(new { success = false, message = "Room not found" });

            if (room.PatientID.HasValue)
            {
                return Json(new
                {
                    success = false,
                    message = "Cannot mark room as available while patient is assigned. Please remove the patient first."
                });
            }

            room.Status = RoomStatus.Available;
            room.Notes = room.Notes ?? "Room cleaned and ready for use";

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                message = "Room marked as available successfully",
                data = new
                {
                    room.ID,
                    room.Number,
                    room.Status
                }
            });
        }
    }
}

