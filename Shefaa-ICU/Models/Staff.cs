namespace Shefaa_ICU.Models
{
    public enum StaffStatus
    {
        Active,
        Inactive,
        OnLeave
    }

    public class Staff
    {
        public int ID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Specialty { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public StaffStatus? Status { get; set; }
        public DateTime CreatedAt { get; set; }

        public virtual List<AttendanceLog> AttendanceLogs { get; set; } = new();
        public virtual List<Medication> Medications { get; set; } = new();
        public virtual List<ClinicalNotes> ClinicalNotes { get; set; } = new();
        public virtual List<Schedule> Schedules { get; set; } = new();
    }
}