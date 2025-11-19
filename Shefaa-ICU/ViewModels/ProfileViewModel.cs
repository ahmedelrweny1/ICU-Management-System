namespace Shefaa_ICU.ViewModels
{
    public class ProfileViewModel
    {
        public int ID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Specialty { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public DateTime CreatedAt { get; set; }
        public int DaysActive { get; set; }
        public DateTime? LastLogin { get; set; }
    }

    public class UpdatePersonalInfoViewModel
    {
        public string Name { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? Specialty { get; set; }
    }

    public class ChangePasswordViewModel
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class AccountSettingsViewModel
    {
        public string Language { get; set; } = "en";
        public string Timezone { get; set; } = "utc";
        public bool ProfileVisible { get; set; } = true;
        public bool ShowOnlineStatus { get; set; } = true;
    }

    public class NotificationSettingsViewModel
    {
        public bool PatientUpdates { get; set; } = true;
        public bool RoomAssignments { get; set; } = true;
        public bool ScheduleChanges { get; set; } = true;
        public bool EmailNotifications { get; set; } = false;
    }
}

