using System.ComponentModel.DataAnnotations;

namespace Shefaa.ICU.Web.Models
{
    public class Room
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Status { get; set; } = "Available";
        
        public string? PatientId { get; set; }
        
        // Navigation property
        public Patient? Patient { get; set; }
    }
}

