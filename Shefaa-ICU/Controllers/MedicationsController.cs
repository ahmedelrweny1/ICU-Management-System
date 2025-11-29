using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;
using Shefaa_ICU.ViewModels;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class MedicationsController : Controller
    {
        private readonly AppDbContext _context;

        public MedicationsController(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var medications = await _context.Medications
                .Include(m => m.Patient)
                .Include(m => m.Staff)
                .OrderByDescending(m => m.ScheduledTime ?? DateTime.MaxValue)
                .ToListAsync();

            // Get only active patients (not discharged)
            var patients = await _context.Patients
                .Where(p => p.DischargeDate == null)
                .OrderBy(p => p.Name)
                .Select(p => new SimpleLookupItem
                {
                    Id = p.ID,
                    Name = p.Name
                })
                .ToListAsync();

            // Get only active staff
            var staffMembers = await _context.Staff
                .Where(s => s.Status == StaffStatus.Active)
                .OrderBy(s => s.Name)
                .Select(s => new SimpleLookupItem
                {
                    Id = s.ID,
                    Name = s.Name
                })
                .ToListAsync();

            var viewModel = new MedicationListViewModel
            {
                Medications = medications.Select(m => new MedicationItemViewModel
                {
                    Id = m.Id,
                    PatientName = m.Patient?.Name ?? "Unknown",
                    MedicationName = m.Name,
                    Dose = m.Dose,
                    Frequency = m.Frequency,
                    ScheduledTime = m.ScheduledTime,
                    Status = m.Status.ToString(),
                    RequestedAt = m.ScheduledTime?.ToString("MMM dd, HH:mm") ?? "Not set",
                    AdministeredBy = m.Staff?.Name,
                    AdministeredAt = m.AdministeredAt
                }).ToList(),
                Patients = patients,
                Staff = staffMembers,
                Form = new MedicationFormViewModel()
            };

            ViewData["Title"] = "Medications";
            ViewData["PageTitle"] = "Medication Orders";
            ViewData["ActivePage"] = "Medications";

            return View(viewModel);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(MedicationFormViewModel model)
        {
            // Verify patient exists and is active
            var patient = await _context.Patients
                .FirstOrDefaultAsync(p => p.ID == model.PatientId && p.DischargeDate == null);
            
            if (patient == null)
            {
                TempData["Error"] = "Please select a valid active patient.";
                return RedirectToAction(nameof(Index));
            }

            // Simple validation
            if (model.PatientId <= 0)
            {
                TempData["Error"] = "Please select a patient.";
                return RedirectToAction(nameof(Index));
            }

            if (string.IsNullOrWhiteSpace(model.Name))
            {
                TempData["Error"] = "Please enter medication name.";
                return RedirectToAction(nameof(Index));
            }

            // Verify staff exists if provided
            if (model.AdministeredBy.HasValue)
            {
                var staff = await _context.Staff
                    .FirstOrDefaultAsync(s => s.ID == model.AdministeredBy.Value && s.Status == StaffStatus.Active);
                
                if (staff == null)
                {
                    TempData["Error"] = "Selected staff member is not active.";
                    return RedirectToAction(nameof(Index));
                }
            }

            var medication = new Medication
            {
                PatientID = model.PatientId,
                Name = model.Name.Trim(),
                Dose = string.IsNullOrWhiteSpace(model.Dose) ? null : model.Dose.Trim(),
                Frequency = string.IsNullOrWhiteSpace(model.Frequency) ? null : model.Frequency.Trim(),
                ScheduledTime = model.ScheduledTime,
                Status = MedicationStatus.Scheduled,
                AdministeredBy = model.AdministeredBy
            };

            _context.Medications.Add(medication);
            await _context.SaveChangesAsync();

            // Medication created successfully

            TempData["Success"] = "Medication order created successfully.";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarkGiven(int id)
        {
            var medication = await _context.Medications.FindAsync(id);
            if (medication == null)
            {
                TempData["Error"] = "Medication not found.";
                return RedirectToAction(nameof(Index));
            }

            medication.Status = MedicationStatus.Given;
            medication.AdministeredAt = DateTime.UtcNow;
            
            // Set AdministeredBy if not already set
            if (medication.AdministeredBy == null)
            {
                // Get current user's staff ID
                var staffIdClaim = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(staffIdClaim) && int.TryParse(staffIdClaim, out int staffId))
                {
                    medication.AdministeredBy = staffId;
                }
            }

            await _context.SaveChangesAsync();

            var patient = await _context.Patients.FindAsync(medication.PatientID);
            
            // Medication administered successfully

            TempData["Success"] = "Medication marked as given.";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Cancel(int id)
        {
            var medication = await _context.Medications.FindAsync(id);
            if (medication == null)
            {
                TempData["Error"] = "Medication not found.";
                return RedirectToAction(nameof(Index));
            }

            medication.Status = MedicationStatus.Cancelled;
            medication.AdministeredAt = null;
            medication.AdministeredBy = null;

            await _context.SaveChangesAsync();

            var patient = await _context.Patients.FindAsync(medication.PatientID);
            
            // Medication cancelled successfully

            TempData["Success"] = "Medication cancelled.";
            return RedirectToAction(nameof(Index));
        }
    }
}

