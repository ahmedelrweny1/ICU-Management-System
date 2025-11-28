using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shefaa_ICU.Models;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class RoomsController : Controller
    {
        public IActionResult Index()
        {
            ViewBag.Rooms = Array.Empty<object>();
            ViewBag.UnassignedPatients = Array.Empty<object>();
            return View();
        }

        [HttpGet]
        public IActionResult GetRooms() => Placeholder(nameof(GetRooms));

        [HttpGet]
        public IActionResult GetRoom(int id) => Placeholder(nameof(GetRoom));

        [HttpPost]
        public IActionResult AddRoom([FromBody] Room room) => Placeholder(nameof(AddRoom));

        [HttpPost]
        public IActionResult UpdateRoom([FromBody] Room room) => Placeholder(nameof(UpdateRoom));

        [HttpPost]
        public IActionResult DeleteRoom(int id) => Placeholder(nameof(DeleteRoom));

        [HttpPost]
        public IActionResult AssignPatient([FromBody] AssignPatientRequest request) => Placeholder(nameof(AssignPatient));


        [HttpPost]
        public IActionResult EvacuateRoom(int roomId) => Placeholder(nameof(EvacuateRoom));

        [HttpPost]
        public IActionResult MarkRoomAvailable(int roomId) => Placeholder(nameof(MarkRoomAvailable));

        private JsonResult Placeholder(string actionName)
        {
            return Json(new
            {
                success = false,
                message = $"{actionName} is not implemented yet."
            });
        }

        public sealed class AssignPatientRequest
        {
            public int RoomId { get; set; }
            public int PatientId { get; set; }
        }
    }
}

