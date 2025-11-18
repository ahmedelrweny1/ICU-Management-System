namespace Shefaa_ICU.Models
{
    public enum MedicationStatus
    {
        Scheduled,
        Given,
        Cancelled
    }

    public class Medication
    {
        public int Id { get; set; }
        public int PatientID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Dose { get; set; }
        public string? Frequency { get; set; }
        public DateTime? ScheduledTime { get; set; }
        public MedicationStatus Status { get; set; }
        public int? AdministeredBy { get; set; }
        public DateTime? AdministeredAt { get; set; }

        public virtual Patient? Patient { get; set; }
        public virtual Staff? Staff { get; set; }
    }
}