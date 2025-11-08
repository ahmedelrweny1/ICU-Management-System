using System.ComponentModel.DataAnnotations;

namespace Shefaa.ICU.Web.Models
{
    public class Schedule
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [DataType(DataType.Date)]
        public DateTime Date { get; set; }
        
        [Required]
        public string Shift { get; set; } = string.Empty;
        
        public List<string> StaffIds { get; set; } = new List<string>();
        
        public string? Notes { get; set; }
    }
}

