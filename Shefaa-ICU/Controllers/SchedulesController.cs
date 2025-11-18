using Microsoft.AspNetCore.Mvc;

namespace Shefaa_ICU.Controllers
{
    public class SchedulesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

