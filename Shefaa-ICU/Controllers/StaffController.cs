using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Data;
using Shefaa_ICU.Models;

namespace Shefaa_ICU.Controllers
{
    [Authorize]
    public class StaffController : Controller
    {
        private readonly AppDbContext _context;

        public StaffController(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var staff = await _context.Staff
                .OrderBy(s => s.Name)
                .Select(s => new
                {
                    s.ID,
                    s.Name,
                    s.Role,
                    s.Specialty,
                    s.Email,
                    s.PhoneNumber,
                    s.Status,
                    s.ProfilePhotoPath,
                    s.CreatedAt
                })
                .ToListAsync();

            ViewBag.Staff = staff;
            ViewData["Title"] = "Staff Management";
            ViewData["PageTitle"] = "Staff Management";
            ViewData["ActivePage"] = "Staff";

            return View();
        }
    }
}
