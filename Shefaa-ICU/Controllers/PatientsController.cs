using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Models;
using Shefaa_ICU.Data;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Security.Claims;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class PatientsController : Controller
    {
        private readonly AppDbContext _context;

        public PatientsController(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var patients = await _context.Patients.Include(p => p.Room).Select(p => new
            {
                p.ID,
                p.Code,
                p.Name,
                p.Age,
                p.Gender,
                p.Condition,
                p.AdmissionDate,
                RoomNumber = p.Room != null ? p.Room.Number : "N/A"
            }).ToListAsync();

            var availableRooms = await _context.Rooms.Where(r => r.Status == RoomStatus.Available)
                .Select(r => new { r.ID, r.Number }).ToListAsync();

            var allRooms = await _context.Rooms
                .Select(r => new { r.ID, r.Number }).ToListAsync();

            ViewBag.Patients = patients;
            ViewBag.PatientRooms = availableRooms;
            ViewBag.AllRooms = allRooms;

            return View();
        }

        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();

            var patient = await _context.Patients.Include(p => p.Room).Include(p => p.ClinicalNotes)
                    .ThenInclude(cn => cn.Staff).Include(p => p.Medications).ThenInclude(m => m.Staff)
                    .Include(p => p.Vitals).FirstOrDefaultAsync(p => p.ID == id);

            if (patient == null) return NotFound();

            ViewData["PatientId"] = id;
            ViewBag.PatientDetail = patient;

            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var patient = await _context.Patients
                .Include(p => p.Room)
                .FirstOrDefaultAsync(p => p.ID == id);

            if (patient == null) return NotFound();

            var allRooms = await _context.Rooms
       .Where(r => r.Status == RoomStatus.Available || r.ID == patient.RoomId)
       .Select(r => new { r.ID, r.Number, r.Status })
       .ToListAsync();

            ViewBag.Patient = patient;
            ViewBag.AllRooms = allRooms;

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Add(Patient patient)
        {
            try
            {
                // Validate required fields
                if (string.IsNullOrWhiteSpace(patient.Name))
                {
                    TempData["Error"] = "Patient name is required";
                    return RedirectToAction(nameof(Index));
                }

                if (!patient.Age.HasValue || patient.Age < 0 || patient.Age > 120)
                {
                    TempData["Error"] = "Valid age (0-120) is required";
                    return RedirectToAction(nameof(Index));
                }

                if (patient.Gender == null)
                {
                    TempData["Error"] = "Gender is required";
                    return RedirectToAction(nameof(Index));
                }

                if (string.IsNullOrWhiteSpace(patient.Condition))
                {
                    TempData["Error"] = "Condition is required";
                    return RedirectToAction(nameof(Index));
                }

                // Generate patient code
                patient.Code = $"P{DateTime.Now:yyyyMMddHHmmss}";
                
                if (patient.AdmissionDate == DateTime.MinValue)
                {
                    patient.AdmissionDate = DateTime.Now;
                }

                _context.Patients.Add(patient);
                await _context.SaveChangesAsync(); // Save first to get the patient ID

                if (patient.RoomId.HasValue)
                {
                    var room = await _context.Rooms.FindAsync(patient.RoomId.Value);
                    if (room != null)
                    {
                        room.Status = RoomStatus.Occupied;
                        room.PatientID = patient.ID;
                        await _context.SaveChangesAsync();
                    }
                }

                TempData["Success"] = "Patient added successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding patient: {ex.Message}");
                TempData["Error"] = $"Error adding patient: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Update(int id, Patient patient)
        {
            if (id != patient.ID)
            {
                TempData["Error"] = "Invalid patient ID";
                return RedirectToAction(nameof(Index));
            }

            try
            {
                // Validate required fields
                if (string.IsNullOrWhiteSpace(patient.Name))
                {
                    TempData["Error"] = "Patient name is required";
                    return RedirectToAction(nameof(Index));
                }

                if (!patient.Age.HasValue || patient.Age < 0 || patient.Age > 120)
                {
                    TempData["Error"] = "Valid age (0-120) is required";
                    return RedirectToAction(nameof(Index));
                }

                if (patient.Gender == null)
                {
                    TempData["Error"] = "Gender is required";
                    return RedirectToAction(nameof(Index));
                }

                if (string.IsNullOrWhiteSpace(patient.Condition))
                {
                    TempData["Error"] = "Condition is required";
                    return RedirectToAction(nameof(Index));
                }

                var existingPatient = await _context.Patients.FindAsync(id);
                if (existingPatient == null)
                {
                    TempData["Error"] = "Patient not found";
                    return RedirectToAction(nameof(Index));
                }

                // Handle room changes
                if (existingPatient.RoomId != patient.RoomId)
                {
                    if (existingPatient.RoomId.HasValue)
                    {
                        var oldRoom = await _context.Rooms.FindAsync(existingPatient.RoomId.Value);
                        if (oldRoom != null)
                        {
                            oldRoom.Status = RoomStatus.Available;
                            oldRoom.PatientID = null;
                        }
                    }

                    if (patient.RoomId.HasValue)
                    {
                        var newRoom = await _context.Rooms.FindAsync(patient.RoomId.Value);
                        if (newRoom != null)
                        {
                            newRoom.Status = RoomStatus.Occupied;
                            newRoom.PatientID = existingPatient.ID;
                        }
                    }
                }

                // Update patient properties
                existingPatient.Name = patient.Name.Trim();
                existingPatient.Age = patient.Age;
                existingPatient.Gender = patient.Gender;
                existingPatient.RoomId = patient.RoomId;
                existingPatient.Condition = patient.Condition.Trim();
                existingPatient.Complaint = patient.Complaint?.Trim();
                existingPatient.MedicalHistory = patient.MedicalHistory?.Trim();
                existingPatient.Diagnosis = patient.Diagnosis?.Trim();
                existingPatient.Treatment = patient.Treatment?.Trim();
                existingPatient.EmergencyContact = patient.EmergencyContact?.Trim();
                if (patient.AdmissionDate != DateTime.MinValue)
                {
                    existingPatient.AdmissionDate = patient.AdmissionDate;
                }

                await _context.SaveChangesAsync();

                TempData["Success"] = "Patient updated successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating patient: {ex.Message}");
                TempData["Error"] = $"Error updating patient: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpGet]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var patient = await _context.Patients.FindAsync(id);
                if (patient == null)
                {
                    TempData["Error"] = "Patient not found";
                    return RedirectToAction(nameof(Index));
                }

                if (patient.RoomId.HasValue)
                {
                    var room = await _context.Rooms.FindAsync(patient.RoomId.Value);
                    if (room != null)
                    {
                        room.Status = RoomStatus.Available;
                        room.PatientID = null;
                    }
                }

                _context.Patients.Remove(patient);
                await _context.SaveChangesAsync();

                TempData["Success"] = "Patient deleted successfully";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting patient: {ex.Message}");
                TempData["Error"] = $"Error deleting patient: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateVitals(Vitals vitals)
        {
            if (!ModelState.IsValid)
            {
                TempData["Error"] = "Invalid vitals data";
                return RedirectToAction(nameof(Details), new { id = vitals.PatientID });
            }

            vitals.RecordedAt = DateTime.Now;
            _context.Vitals.Add(vitals);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Vitals updated successfully";
            return RedirectToAction(nameof(Details), new { id = vitals.PatientID });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddNote(ClinicalNotes note)
        {
            if (!ModelState.IsValid)
            {
                TempData["Error"] = "Invalid note data";
                return RedirectToAction(nameof(Details), new { id = note.PatientID });
            }

            var staffIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(staffIdClaim, out int staffId))
            {
                note.AuthorId = staffId;
            }
            note.Timestamp = DateTime.Now;
            _context.ClinicalNotes.Add(note);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Note added successfully";
            return RedirectToAction(nameof(Details), new { id = note.PatientID });
        }
    }
}
