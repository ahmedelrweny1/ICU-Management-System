using System.ComponentModel.DataAnnotations;

namespace Shefaa.ICU.Web.Models
{
    public class Patient
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [Range(0, 120)]
        public int Age { get; set; }
        
        [Required]
        public string Gender { get; set; } = string.Empty;
        
        [Required]
        public string Room { get; set; } = string.Empty;
        
        [Required]
        [DataType(DataType.Date)]
        public DateTime AdmissionDate { get; set; }
        
        [Required]
        public string Condition { get; set; } = string.Empty;
        
        public string? Complaint { get; set; }
        public string? History { get; set; }
        public string? Diagnosis { get; set; }
        public string? Treatment { get; set; }
        public string? EmergencyContact { get; set; }
        
        public VitalSigns? Vitals { get; set; }
        public List<Medication> Drugs { get; set; } = new List<Medication>();
        public List<ClinicalNote> Notes { get; set; } = new List<ClinicalNote>();
    }
    
    public class VitalSigns
    {
        public string Bp { get; set; } = "-/-";
        public string Temp { get; set; } = "-";
        public string Pulse { get; set; } = "-";
        public string Spo2 { get; set; } = "-";
    }
    
    public class Medication
    {
        public string Name { get; set; } = string.Empty;
        public string Dose { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
    }
    
    public class ClinicalNote
    {
        public DateTime Date { get; set; }
        public string Author { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
    }
}

