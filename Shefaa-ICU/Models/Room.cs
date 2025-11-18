namespace Shefaa_ICU.Models
{
    public enum RoomStatus
    {
        Available,
        Occupied,
        Cleaning
    }

    public class Room
    {
        public int ID { get; set; }
        public string Number { get; set; } = string.Empty;
        public RoomStatus Status { get; set; }
        public string? Notes { get; set; }
        public int? PatientID { get; set; }

        public virtual Patient? Patient { get; set; }
    }
}