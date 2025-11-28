using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shefaa_ICU.Models;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class PatientsController : Controller
    {
        public IActionResult Index()
        {
            ViewBag.Patients = Array.Empty<object>();
            ViewBag.PatientRooms = Array.Empty<object>();
            return View();
        }

        public IActionResult Details(string? id)
        {
            ViewData["PatientId"] = id;
            ViewBag.PatientDetail = null;
            return View();
        }

        [HttpGet]
        public IActionResult GetPatients() => Placeholder(nameof(GetPatients));

        [HttpGet]
        public IActionResult GetPatient(int id) => Placeholder(nameof(GetPatient));

        [HttpPost]
        public IActionResult AddPatient([FromBody] Patient patient) => Placeholder(nameof(AddPatient));

        [HttpPost]
        public IActionResult UpdatePatient([FromBody] Patient patient) => Placeholder(nameof(UpdatePatient));

        [HttpPost]
        public IActionResult DeletePatient(int id) => Placeholder(nameof(DeletePatient));

        [HttpPost]
        public IActionResult UpdateVitals([FromBody] object request) => Placeholder(nameof(UpdateVitals));

        [HttpPost]
        public IActionResult AddNote([FromBody] object request) => Placeholder(nameof(AddNote));

        [HttpGet]
        public IActionResult ExportPatients() => Placeholder(nameof(ExportPatients));

        private JsonResult Placeholder(string actionName)
        {
            return Json(new
            {
                success = false,
                message = $"{actionName} is not implemented yet."
            });
        }
    }
}

