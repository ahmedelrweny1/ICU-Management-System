using System.ComponentModel.DataAnnotations;

namespace Shefaa_ICU.ViewModels
{
    public class MedicationListViewModel
    {
        public List<MedicationItemViewModel> Medications { get; set; } = new();
        public List<SimpleLookupItem> Patients { get; set; } = new();
        public List<SimpleLookupItem> Staff { get; set; } = new();
        public MedicationFormViewModel Form { get; set; } = new();
    }

    public class MedicationItemViewModel
    {
        public int Id { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string MedicationName { get; set; } = string.Empty;
        public string? Dose { get; set; }
        public string? Frequency { get; set; }
        public DateTime? ScheduledTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public string RequestedAt { get; set; } = string.Empty;
        public string? AdministeredBy { get; set; }
        public DateTime? AdministeredAt { get; set; }
    }

    public class SimpleLookupItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class MedicationFormViewModel
    {
        [Required]
        [Display(Name = "Patient")]
        public int PatientId { get; set; }

        [Required]
        [MaxLength(200)]
        [Display(Name = "Medication Name")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Dose { get; set; }

        [MaxLength(100)]
        public string? Frequency { get; set; }

        [Display(Name = "Schedule Time")]
        public DateTime? ScheduledTime { get; set; }

        [Display(Name = "Assigned Staff")]
        public int? AdministeredBy { get; set; }
    }
}

