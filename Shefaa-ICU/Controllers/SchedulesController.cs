using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class SchedulesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

