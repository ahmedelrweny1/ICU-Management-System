namespace Shefaa_ICU.Models
{
    public enum AttendanceStatus
    {
        OnDuty,
        OffDuty
    }

    public class AttendanceLog
    {
        public int ID { get; set; }
        public int StaffID { get; set; }
        public DateTime CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public AttendanceStatus Status { get; set; }

        public virtual Staff? Staff { get; set; }
    }
}