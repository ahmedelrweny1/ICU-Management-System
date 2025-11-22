namespace Shefaa_ICU.ViewModels
{
    public class DashboardViewModel
    {
        public int TotalRooms { get; set; }
        public int TotalPatients { get; set; }
        public int TotalStaff { get; set; }
        public int CriticalCases { get; set; }
        public int AvailableRooms { get; set; }
        public int StaffOnDuty { get; set; }
        public int OccupiedRooms { get; set; }
        public int CleaningRooms { get; set; }
        public List<WeeklyOccupancyData> WeeklyOccupancy { get; set; } = new();
        public List<ActivityItem> RecentActivities { get; set; } = new();
        public List<StaffOnDutyItem> StaffOnDutyList { get; set; } = new();
        public ShiftInfo CurrentShift { get; set; } = new();
    }

    public class WeeklyOccupancyData
    {
        public string Day { get; set; } = string.Empty;
        public double OccupancyRate { get; set; }
    }

    public class ActivityItem
    {
        public string Time { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }

    public class StaffOnDutyItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Specialty { get; set; }
    }

    public class ShiftInfo
    {
        public string ShiftName { get; set; } = string.Empty;
        public string ShiftTime { get; set; } = string.Empty;
        public int StaffCount { get; set; }
    }
}

