namespace Shefaa_ICU.Models
{
    public class Vitals
    {
        public int ID { get; set; }
        public int PatientID { get; set; }
        public DateTime RecordedAt { get; set; }
        public string? BP { get; set; }
        public int? BloodPressureSystolic { get; set; }
        public int? BloodPressureDiastolic { get; set; }
        public double? Temperature { get; set; }
        public int? Pulse { get; set; }
        public int? SpO2 { get; set; }
        public int? RespiratoryRate { get; set; }

        public virtual Patient? Patient { get; set; }
    }
}