namespace Shefaa_ICU.Models
{
    public class ClinicalNotes
    {
        public int ID { get; set; }
        public int PatientID { get; set; }
        public int AuthorId { get; set; }
        public DateTime Timestamp { get; set; }
        public string Text { get; set; } = string.Empty;

        public virtual Patient? Patient { get; set; }
        public virtual Staff? Staff { get; set; }
    }
}