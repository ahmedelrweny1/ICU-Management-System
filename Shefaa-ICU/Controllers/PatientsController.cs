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

            ViewBag.Patients = patients;
            ViewBag.PatientRooms = availableRooms;

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
        public async Task<IActionResult> GetPatients()
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
                RoomNumber = p.Room != null ? p.Room.Number : "N/A",
                DaysInICU = (DateTime.Now - p.AdmissionDate).Days
            }).ToListAsync();

            if (patients == null) return Json(new { success = false, message = "No Patients Found" });

            return Json(new { success = true, data = patients });
        }

        [HttpGet]
        public async Task<IActionResult> GetPatient(int id)
        {
            var patient = await _context.Patients
                .Include(p => p.Room)
                .Include(p => p.ClinicalNotes)
                .Include(p => p.Medications)
                .Include(p => p.Vitals)
                .FirstOrDefaultAsync(p => p.ID == id);

            if (patient == null)
                return Json(new { success = false, message = "Patient not found" });

            return Json(new { success = true, data = patient });
        }

        [HttpPost]
        public async Task<IActionResult> AddPatient([FromBody] Patient patient)
        {
                if (!ModelState.IsValid)
                    return Json(new { success = false, message = "Invalid patient data" });
            
                patient.Code = $"P{DateTime.Now:yyyyMMddHHmmss}";
                patient.AdmissionDate = patient.AdmissionDate == DateTime.MinValue ? DateTime.Now : patient.AdmissionDate;

                _context.Patients.Add(patient);

                if (patient.RoomId.HasValue)
                {
                    var room = await _context.Rooms.FindAsync(patient.RoomId.Value);
                    if (room != null)
                    {
                        room.Status = RoomStatus.Occupied;
                        room.PatientID = patient.ID;
                    }
                }

                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Patient added successfully", data = patient });
        }

        [HttpPost]
        public async Task<IActionResult> UpdatePatient([FromBody] Patient patient)
        {
                if (!ModelState.IsValid)
                    return Json(new { success = false, message = "Invalid patient data" });
                
                var existingPatient = await _context.Patients.FindAsync(patient.ID);
                if (existingPatient == null)
                    return Json(new { success = false, message = "Patient not found" });

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
                            newRoom.PatientID = patient.ID;
                        }
                    }
                }

                existingPatient.Name = patient.Name;
                existingPatient.Age = patient.Age;
                existingPatient.Gender = patient.Gender;
                existingPatient.RoomId = patient.RoomId;
                existingPatient.Condition = patient.Condition;
                existingPatient.Complaint = patient.Complaint;
                existingPatient.MedicalHistory = patient.MedicalHistory;
                existingPatient.Diagnosis = patient.Diagnosis;
                existingPatient.Treatment = patient.Treatment;
                existingPatient.EmergencyContact = patient.EmergencyContact;

                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Patient updated successfully" });
        }

        [HttpPost]
        public async Task<IActionResult> DeletePatient(int id)
        {
                var patient = await _context.Patients.FindAsync(id);
                if (patient == null)
                    return Json(new { success = false, message = "Patient not found" });

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

                return Json(new { success = true, message = "Patient deleted successfully" });
        }

        [HttpPost]
        public async Task<IActionResult> UpdateVitals([FromBody] Vitals vitals)
        {
           
                if (!ModelState.IsValid)
                    return Json(new { success = false, message = "Invalid vitals data" });
                

                vitals.RecordedAt = DateTime.Now;
                _context.Vitals.Add(vitals);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Vitals updated successfully" });
           
        }

        [HttpPost]
        public async Task<IActionResult> AddNote([FromBody] ClinicalNotes note)
        {
                if (!ModelState.IsValid)
                    return Json(new { success = false, message = "Invalid note data" });

                note.AuthorId = 1; //replace with author id
                note.Timestamp = DateTime.Now;
                _context.ClinicalNotes.Add(note);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Note added successfully" });
            
        }

    }
}


