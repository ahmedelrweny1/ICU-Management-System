using Microsoft.AspNetCore.Mvc;

namespace Shefaa_ICU.Controllers
{
    public class ProfileController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

