namespace Shefaa_ICU.Models
{
    public enum ShiftType
    {
        Morning,
        Evening,
        Night
    }

    public class Schedule
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public ShiftType ShiftType { get; set; }
        public int StaffID { get; set; }
        public string? Notes { get; set; }

        public virtual Staff? Staff { get; set; }
    }
}