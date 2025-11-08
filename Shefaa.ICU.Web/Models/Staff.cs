using System.ComponentModel.DataAnnotations;

namespace Shefaa.ICU.Web.Models
{
    public class Staff
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = string.Empty;
        
        public string? Specialty { get; set; }
        
        [Required]
        [Phone]
        public string Phone { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        public string Status { get; set; } = "Off Duty";
        
        public string? CheckInTime { get; set; }
        public string? CheckOutTime { get; set; }
    }
}

