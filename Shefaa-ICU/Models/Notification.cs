namespace Shefaa_ICU.Models
{
    public enum NotificationType
    {
        Info,
        Success,
        Warning,
        Danger
    }

    public class Notification
    {
        public int ID { get; set; }
        public int StaffID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public NotificationType Type { get; set; } = NotificationType.Info;
        public string Icon { get; set; } = "fa-info-circle";
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? RelatedEntityType { get; set; } // e.g., "Patient", "Room", "Schedule"
        public int? RelatedEntityId { get; set; } // ID of the related entity

        public virtual Staff Staff { get; set; } = null!;
    }
}

