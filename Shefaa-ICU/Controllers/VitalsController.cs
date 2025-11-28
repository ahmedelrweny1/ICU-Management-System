using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;
using Shefaa_ICU.Services;
using Shefaa_ICU.ViewModels;
using System.Security.Claims;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class VitalsController : Controller
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;

        public VitalsController(AppDbContext context, NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<IActionResult> Index()
        {
            var vitals = await _context.Vitals
                .Include(v => v.Patient)
                .OrderByDescending(v => v.RecordedAt)
                .Take(30)
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

            var entry = new Vitals
            {
                PatientID = model.PatientId,
                RecordedAt = DateTime.UtcNow,
                BP = string.IsNullOrWhiteSpace(model.BP) ? null : model.BP.Trim(),
                Temperature = model.Temperature,
                Pulse = model.Pulse,
                SpO2 = model.SpO2,
                RespiratoryRate = model.RespiratoryRate,
            };

            _context.Vitals.Add(entry);
            await _context.SaveChangesAsync();

            // Send notification - all actions to admins, main actions to everyone
            await _notificationService.NotifyAdminsAsync(
                "Vitals Recorded",
                $"Vitals recorded for patient {patient.Name} (Room {patient.Room?.Number ?? "N/A"})",
                NotificationType.Info,
                "fa-heartbeat",
                "Patient",
                patient.ID
            );

            // Main action: Critical vitals - notify everyone
            if (IsCriticalVitals(entry))
            {
                await _notificationService.NotifyMainActionAsync(
                    "Critical Patient Alert",
                    $"Patient {patient.Name} (Room {patient.Room?.Number ?? "N/A"}) has critical vitals",
                    NotificationType.Danger,
                    "fa-exclamation-circle",
                    "Patient",
                    patient.ID
                );
            }

            TempData["Success"] = "Vitals recorded successfully.";
            return RedirectToAction(nameof(Index));
        }

        private static bool IsCriticalVitals(Vitals v)
        {
            if (v.Temperature.HasValue && (v.Temperature < 35 || v.Temperature > 39)) return true;
            if (v.SpO2.HasValue && v.SpO2 < 90) return true;
            if (v.Pulse.HasValue && (v.Pulse < 50 || v.Pulse > 120)) return true;
            if (v.RespiratoryRate.HasValue && (v.RespiratoryRate < 10 || v.RespiratoryRate > 30)) return true;
            return false;
        }
    }
}

