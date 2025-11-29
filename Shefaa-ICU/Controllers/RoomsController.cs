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

            var patients = await _context.Patients
                .Where(p => p.RoomId == null)
                .Select(p => new { p.ID, p.Name, p.Condition })
                .ToListAsync();

            ViewBag.Rooms = rooms;
            ViewBag.Patients = patients;

            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var room = await _context.Rooms
                .Include(r => r.Patient)
                .FirstOrDefaultAsync(r => r.ID == id);

            if (room == null) return NotFound();

            ViewBag.Room = room;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Add(Room room)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(room.Number))
                {
                    TempData["Error"] = "Room number is required";
                    return RedirectToAction(nameof(Index));
                }

                var existingRoom = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Number == room.Number.Trim());

                if (existingRoom != null)
                {
                    TempData["Error"] = "Room number already exists";
                    return RedirectToAction(nameof(Index));
                }

                room.Number = room.Number.Trim();
                room.Status = RoomStatus.Available;

                _context.Rooms.Add(room);
                await _context.SaveChangesAsync();

                TempData["Success"] = "Room added successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding room: {ex.Message}");
                TempData["Error"] = $"Error adding room: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Update(int id, Room room)
        {
            if (id != room.ID)
            {
                TempData["Error"] = "Invalid room ID";
                return RedirectToAction(nameof(Index));
            }

            try
            {
                if (string.IsNullOrWhiteSpace(room.Number))
                {
                    TempData["Error"] = "Room number is required";
                    return RedirectToAction(nameof(Index));
                }

                var existingRoom = await _context.Rooms.FindAsync(id);
                if (existingRoom == null)
                {
                    TempData["Error"] = "Room not found";
                    return RedirectToAction(nameof(Index));
                }

                var duplicateRoom = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Number == room.Number.Trim() && r.ID != id);

                if (duplicateRoom != null)
                {
                    TempData["Error"] = "Room number already exists";
                    return RedirectToAction(nameof(Index));
                }

                existingRoom.Number = room.Number.Trim();
                existingRoom.Notes = room.Notes?.Trim();

                await _context.SaveChangesAsync();

                TempData["Success"] = "Room updated successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating room: {ex.Message}");
                TempData["Error"] = $"Error updating room: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var room = await _context.Rooms
                    .Include(r => r.Patient)
                    .FirstOrDefaultAsync(r => r.ID == id);

                if (room == null)
                {
                    TempData["Error"] = "Room not found";
                    return RedirectToAction(nameof(Index));
                }

                if (room.PatientID.HasValue)
                {
                    TempData["Error"] = "Cannot delete room with assigned patient";
                    return RedirectToAction(nameof(Index));
                }

                _context.Rooms.Remove(room);
                await _context.SaveChangesAsync();

                TempData["Success"] = "Room deleted successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting room: {ex.Message}");
                TempData["Error"] = $"Error deleting room: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AssignPatient(int roomId, int patientId)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(roomId);
                var patient = await _context.Patients.FindAsync(patientId);

                if (room == null || patient == null)
                {
                    TempData["Error"] = "Room or patient not found";
                    return RedirectToAction(nameof(Index));
                }

                if (room.Status != RoomStatus.Available)
                {
                    TempData["Error"] = "Room is not available";
                    return RedirectToAction(nameof(Index));
                }

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

                TempData["Success"] = "Patient assigned to room successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error assigning patient: {ex.Message}");
                TempData["Error"] = $"Error assigning patient: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EvacuateRoom(int id)
        {
            try
            {
                var room = await _context.Rooms
                    .Include(r => r.Patient)
                    .FirstOrDefaultAsync(r => r.ID == id);

                if (room == null)
                {
                    TempData["Error"] = "Room not found";
                    return RedirectToAction(nameof(Index));
                }

                if (!room.PatientID.HasValue)
                {
                    TempData["Error"] = "No patient assigned to this room";
                    return RedirectToAction(nameof(Index));
                }

                var patient = room.Patient;
                if (patient != null)
                {
                    patient.RoomId = null;
                }
                room.Status = RoomStatus.Available;
                room.PatientID = null;

                await _context.SaveChangesAsync();

                TempData["Success"] = "Patient removed from room successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error evacuating room: {ex.Message}");
                TempData["Error"] = $"Error evacuating room: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarkAvailable(int id)
        {
            try
            {
                var room = await _context.Rooms
                    .Include(r => r.Patient)
                    .FirstOrDefaultAsync(r => r.ID == id);

                if (room == null)
                {
                    TempData["Error"] = "Room not found";
                    return RedirectToAction(nameof(Index));
                }

                if (room.PatientID.HasValue)
                {
                    TempData["Error"] = "Cannot mark room as available while patient is assigned. Please remove the patient first.";
                    return RedirectToAction(nameof(Index));
                }

                room.Status = RoomStatus.Available;
                room.Notes = room.Notes ?? "Room cleaned and ready for use";

                await _context.SaveChangesAsync();

                TempData["Success"] = "Room marked as available successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error marking room available: {ex.Message}");
                TempData["Error"] = $"Error marking room available: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }
    }
}
