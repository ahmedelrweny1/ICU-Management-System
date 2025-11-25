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

            var patients = await _context.Patients
                .OrderBy(p => p.Name)
                .Select(p => new SimpleLookupItem
                {
                    Id = p.ID,
                    Name = p.Name
                })
                .ToListAsync();

            var staffMembers = await _context.Staff
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
            if (!ModelState.IsValid)
            {
                TempData["Error"] = "Please fill in the required fields.";
                return RedirectToAction(nameof(Index));
            }

            var medication = new Medication
            {
                PatientID = model.PatientId,
                Name = model.Name,
                Dose = model.Dose,
                Frequency = model.Frequency,
                ScheduledTime = model.ScheduledTime,
                Status = MedicationStatus.Scheduled,
                AdministeredBy = model.AdministeredBy
            };

            _context.Medications.Add(medication);
            await _context.SaveChangesAsync();

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

            await _context.SaveChangesAsync();
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
            TempData["Success"] = "Medication cancelled.";
            return RedirectToAction(nameof(Index));
        }
    }
}

