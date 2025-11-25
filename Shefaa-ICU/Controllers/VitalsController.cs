using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;
using Shefaa_ICU.ViewModels;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class VitalsController : Controller
    {
        private readonly AppDbContext _context;

        public VitalsController(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var vitals = await _context.Vitals
                .Include(v => v.Patient)
                .OrderByDescending(v => v.RecordedAt)
                .Take(30)
                .ToListAsync();

            var patients = await _context.Patients
                .OrderBy(p => p.Name)
                .Select(p => new SimpleLookupItem
                {
                    Id = p.ID,
                    Name = p.Name
                })
                .ToListAsync();

            var viewModel = new VitalsListViewModel
            {
                Entries = vitals.Select(v => new VitalsItemViewModel
                {
                    Id = v.ID,
                    PatientName = v.Patient?.Name ?? "Unknown",
                    RecordedAt = v.RecordedAt,
                    BpDisplay = !string.IsNullOrWhiteSpace(v.BP) ? v.BP! : $"{v.BloodPressureSystolic}/{v.BloodPressureDiastolic}",
                    Temperature = v.Temperature,
                    Pulse = v.Pulse,
                    SpO2 = v.SpO2,
                    RespiratoryRate = v.RespiratoryRate
                }).ToList(),
                Patients = patients
            };

            ViewData["Title"] = "Vitals";
            ViewData["PageTitle"] = "Vitals Monitoring";
            ViewData["ActivePage"] = "Vitals";

            return View(viewModel);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(VitalsFormViewModel model)
        {
            if (!ModelState.IsValid)
            {
                TempData["Error"] = "Please correct the highlighted fields.";
                return RedirectToAction(nameof(Index));
            }

            var entry = new Vitals
            {
                PatientID = model.PatientId,
                RecordedAt = DateTime.UtcNow,
                BP = model.BP,
                Temperature = model.Temperature,
                Pulse = model.Pulse,
                SpO2 = model.SpO2,
                RespiratoryRate = model.RespiratoryRate,
            };

            _context.Vitals.Add(entry);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Vitals recorded.";
            return RedirectToAction(nameof(Index));
        }
    }
}

