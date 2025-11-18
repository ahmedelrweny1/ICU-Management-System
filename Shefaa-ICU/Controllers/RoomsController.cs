using Microsoft.AspNetCore.Mvc;

namespace Shefaa_ICU.Controllers
{
    public class RoomsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

