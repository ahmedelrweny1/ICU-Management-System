using Shefaa_ICU.Data;
using Shefaa_ICU.Models;

namespace Shefaa_ICU.Services
{
    public delegate void NotificationEventHandler(string title, string message, NotificationType type, int staffId, string? icon = null, string? relatedEntityType = null, int? relatedEntityId = null);

    public class NotificationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(AppDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task CreateNotificationAsync(string title, string message, NotificationType type, int staffId, string? icon = null, string? relatedEntityType = null, int? relatedEntityId = null)
        {
            try
            {
                var notification = new Notification
                {
                    StaffID = staffId,
                    Title = title,
                    Message = message,
                    Type = type,
                    Icon = icon ?? GetDefaultIcon(type),
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = relatedEntityType,
                    RelatedEntityId = relatedEntityId
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create notification for staff {StaffId}", staffId);
            }
        }

        public async Task NotifyAllStaffAsync(string title, string message, NotificationType type, string? icon = null, string? relatedEntityType = null, int? relatedEntityId = null)
        {
            var activeStaff = _context.Staff.Where(s => s.Status == StaffStatus.Active).Select(s => s.ID).ToList();
            
            foreach (var staffId in activeStaff)
            {
                await CreateNotificationAsync(title, message, type, staffId, icon, relatedEntityType, relatedEntityId);
            }
        }

        public async Task NotifyAdminsAsync(string title, string message, NotificationType type, string? icon = null, string? relatedEntityType = null, int? relatedEntityId = null)
        {
            var adminIds = _context.Staff
                .Where(s => s.Status == StaffStatus.Active && s.Role == "Admin")
                .Select(s => s.ID)
                .ToList();
            
            foreach (var staffId in adminIds)
            {
                await CreateNotificationAsync(title, message, type, staffId, icon, relatedEntityType, relatedEntityId);
            }
        }

        public async Task NotifyMainActionAsync(string title, string message, NotificationType type, string? icon = null, string? relatedEntityType = null, int? relatedEntityId = null)
        {
            var activeStaff = _context.Staff
                .Where(s => s.Status == StaffStatus.Active)
                .Select(s => new { s.ID, s.Role })
                .ToList();
            
            foreach (var staff in activeStaff)
            {
                await CreateNotificationAsync(title, message, type, staff.ID, icon, relatedEntityType, relatedEntityId);
            }
        }

        private static string GetDefaultIcon(NotificationType type)
        {
            return type switch
            {
                NotificationType.Danger => "fa-exclamation-circle",
                NotificationType.Warning => "fa-exclamation-triangle",
                NotificationType.Success => "fa-check-circle",
                _ => "fa-info-circle"
            };
        }
    }
}

