using System.ComponentModel.DataAnnotations;

namespace Shefaa_ICU.ViewModels
{
    public class VitalsListViewModel
    {
        public List<VitalsItemViewModel> Entries { get; set; } = new();
        public List<SimpleLookupItem> Patients { get; set; } = new();
        public VitalsFormViewModel Form { get; set; } = new();
    }

    public class VitalsItemViewModel
    {
        public int Id { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public DateTime RecordedAt { get; set; }
        public string BpDisplay { get; set; } = "-/-";
        public double? Temperature { get; set; }
        public int? Pulse { get; set; }
        public int? SpO2 { get; set; }
        public int? RespiratoryRate { get; set; }
    }

    public class VitalsFormViewModel
    {
        [Required]
        [Display(Name = "Patient")]
        public int PatientId { get; set; }

        [Display(Name = "Blood Pressure")]
        public string? BP { get; set; }

        [Range(30, 45)]
        public double? Temperature { get; set; }

        [Range(20, 200)]
        public int? Pulse { get; set; }

        [Range(50, 100)]
        public int? SpO2 { get; set; }

        [Range(5, 60)]
        [Display(Name = "Respiratory Rate")]
        public int? RespiratoryRate { get; set; }
    }

    public class VitalsTrendPoint
    {
        public string Label { get; set; } = string.Empty;
        public int Pulse { get; set; }
        public int SpO2 { get; set; }
    }

    public class VitalAlertItem
    {
        public string PatientName { get; set; } = string.Empty;
        public string Metric { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string Severity { get; set; } = "warning";
        public string RecordedAt { get; set; } = string.Empty;
    }
}

