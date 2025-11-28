using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shefaa_ICU.Models;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class StaffController : Controller
    {
        public IActionResult Index()
        {
            ViewBag.Staff = Array.Empty<object>();
            return View();
        }

        [HttpGet]
        public IActionResult GetStaff() => Placeholder(nameof(GetStaff));

        [HttpGet]
        public IActionResult GetStaffMember(int id) => Placeholder(nameof(GetStaffMember));

        [HttpPost]
        public IActionResult AddStaff([FromBody] Staff staff) => Placeholder(nameof(AddStaff));

        [HttpPost]
        public IActionResult UpdateStaff([FromBody] Staff staff) => Placeholder(nameof(UpdateStaff));

        [HttpPost]
        public IActionResult DeleteStaff(int id) => Placeholder(nameof(DeleteStaff));

        [HttpPost]
        public IActionResult RegisterAttendance([FromBody] object request) => Placeholder(nameof(RegisterAttendance));

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

