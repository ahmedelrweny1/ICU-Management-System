namespace Shefaa_ICU.Models
{
    public enum Gender
    {
        Male,
        Female,
        Other
    }

    public class Patient
    {
        public int ID { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = "Unknown";
        public int? Age { get; set; }
        public Gender? Gender { get; set; }
        public int? RoomId { get; set; }
        public DateTime AdmissionDate { get; set; }
        public DateTime? DischargeDate { get; set; }
        public string? Condition { get; set; }
        public string? Complaint { get; set; }
        public string? MedicalHistory { get; set; }
        public string? Diagnosis { get; set; }
        public string? Treatment { get; set; }
        public string? EmergencyContact { get; set; }

        public virtual Room? Room { get; set; }
        public virtual List<ClinicalNotes> ClinicalNotes { get; set; } = new();
        public virtual List<Medication> Medications { get; set; } = new();
        public virtual List<Vitals> Vitals { get; set; } = new();
    }
}