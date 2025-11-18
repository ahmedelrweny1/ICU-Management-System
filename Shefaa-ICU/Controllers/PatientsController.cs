using Microsoft.AspNetCore.Mvc;

namespace Shefaa_ICU.Controllers
{
    public class PatientsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Details(string? id)
        {
            ViewData["PatientId"] = id;
            return View();
        }
    }
}

