# Shefaa ICU Management System

A comprehensive web-based Intensive Care Unit (ICU) management system designed to streamline patient care, room management, medication tracking, and staff scheduling in critical care environments.

## Overview

Shefaa is a full-featured ICU management platform that enables healthcare facilities to efficiently manage patient records, monitor vital signs, track medications, assign rooms, and coordinate staff schedules. The system implements role-based access control to ensure appropriate permissions for different staff members.

## Features

### Patient Management
- Complete patient records with admission/discharge tracking
- Real-time condition monitoring (Critical, Moderate, Stable)
- Medical history, diagnosis, and treatment plan documentation
- Room assignment and tracking

### Room Management
- Room status tracking (Available, Occupied, Cleaning)
- Patient-room assignment system
- Room availability monitoring
- Occupancy reports

### Clinical Operations
- **Vitals Monitoring**: Track patient vital signs (Pulse, SpO2, Temperature, Blood Pressure)
- **Medication Management**: Prescription and administration tracking
- **Clinical Notes**: Timestamped notes with staff attribution

### Staff & Scheduling
- Staff management with role assignments
- Attendance logging (Check-in/Check-out)
- Weekly shift scheduling (Morning, Evening, Night)
- Staff on-duty tracking

### Analytics & Reporting
- Real-time dashboard with key metrics
- Weekly occupancy trends
- Patient statistics and demographics
- Staff utilization reports

## Tech Stack

- **Framework**: ASP.NET Core MVC 8.0
- **Database**: SQL Server with Entity Framework Core 9.0
- **Authentication**: Cookie-based authentication with role-based authorization
- **Frontend**: Bootstrap 5.3, Font Awesome 6.4
- **Architecture**: MVC pattern with Repository pattern

## Prerequisites

- .NET 8.0 SDK or later
- SQL Server 2019 or later (or SQL Server Express)
- Visual Studio 2022 or VS Code (recommended)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Shefaa-ICU
   ```

2. **Configure the database connection**
   - Update `appsettings.json` with your SQL Server connection string:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=YOUR_SERVER;Database=ShefaaICU;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```

3. **Run database migrations**
   ```bash
   dotnet ef database update
   ```

4. **Build and run the application**
   ```bash
   dotnet build
   dotnet run
   ```

5. **Access the application**
   - Navigate to `https://localhost:5001` or `http://localhost:5000`
   - Register a new account (first user should be Admin role)

## Role-Based Access Control

The system implements three user roles with distinct permissions:

### Admin
- Full system access
- Staff management (CRUD)
- Patient management (CRUD)
- Room management (CRUD)
- Schedule management (CRUD)
- Reports and analytics

### Doctor
- View and edit patient records
- Prescribe medications
- Add/edit clinical notes
- View schedules (read-only)
- View rooms (read-only)

### Nurse
- View patient records
- Record vitals
- Administer medications
- Add clinical notes
- Mark rooms as cleaning/available
- View schedules (read-only)

## Project Structure

```
Shefaa-ICU/
├── Controllers/          # MVC Controllers
├── Models/              # Data models and entities
├── Views/               # Razor views
├── Data/                # DbContext and data access
├── Services/            # Business logic services
├── ViewModels/          # View models
├── wwwroot/             # Static files (CSS, JS, images)
└── Program.cs           # Application entry point
```

## Configuration

### Email Settings (Optional)
Configure SMTP settings in `appsettings.json` for email notifications:
```json
"EmailSettings": {
  "SmtpServer": "smtp.example.com",
  "Port": 587,
  "Username": "your-email@example.com",
  "Password": "your-password"
}
```

## Security

- Cookie-based authentication
- CSRF protection with anti-forgery tokens
- Password hashing using ASP.NET Core Identity
- Role-based authorization policies
- Secure session management

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or contributions, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2025

