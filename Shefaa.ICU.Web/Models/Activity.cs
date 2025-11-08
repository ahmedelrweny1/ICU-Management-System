using System.ComponentModel.DataAnnotations;

namespace Shefaa.ICU.Web.Models
{
    public class Activity
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Time { get; set; } = string.Empty;
        
        [Required]
        public string Text { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}

