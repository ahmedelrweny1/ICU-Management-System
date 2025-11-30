# Shefaa ICU Management System

A comprehensive web-based Intensive Care Unit (ICU) management system built with ASP.NET Core MVC. Shefaa streamlines patient care, room management, medication tracking, staff scheduling, and vital signs monitoring in critical care environments.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Role-Based Access Control](#role-based-access-control)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Security](#security)
- [Contributing](#contributing)

## 🎯 Overview

Shefaa is a full-featured ICU management platform that enables healthcare facilities to efficiently manage patient records, monitor vital signs, track medications, assign rooms, and coordinate staff schedules. The system implements role-based access control to ensure appropriate permissions for different staff members (Admin, Doctor, Nurse).

## ✨ Features

### Patient Management
- Complete patient lifecycle management (admission to discharge)
- Patient records with medical history, diagnosis, and treatment plans
- Real-time condition monitoring (Critical, Moderate, Stable)
- Room assignment and tracking
- Clinical notes with staff attribution
- Emergency contact information

### Room Management
- Real-time room status tracking (Available, Occupied, Cleaning)
- Patient-room assignment system
- Room availability monitoring
- Occupancy reports and analytics

### Clinical Operations
- **Vital Signs Monitoring**: Track patient vital signs (Pulse, SpO2, Temperature, Blood Pressure, Respiratory Rate)
- **Medication Management**: Prescription orders and administration tracking with status (Scheduled, Given, Cancelled)
- **Clinical Notes**: Timestamped medical notes with author tracking

### Staff & Scheduling
- Staff management with role assignments (Admin, Doctor, Nurse)
- Attendance logging (Check-in/Check-out) with duration tracking
- Weekly shift scheduling (Morning, Evening, Night shifts)
- Staff on-duty tracking and status management

### Analytics & Reporting
- Real-time dashboard with key metrics:
  - Total rooms, patients, and staff counts
  - Critical cases monitoring
  - Room occupancy rates
  - Weekly occupancy trends
  - Staff on-duty status
  - Vital signs alerts for critical values
- Administrative reports and statistics
- Patient demographics and admission analytics

### Authentication & Security
- Cookie-based authentication
- Email OTP verification for registration and password reset
- Role-based authorization (RBAC)
- Secure password hashing (PBKDF2)
- CSRF protection

## 🛠 Technology Stack

- **Framework**: ASP.NET Core MVC 8.0
- **Database**: SQL Server (LocalDB/Express/Full SQL Server)
- **ORM**: Entity Framework Core 9.0
- **Authentication**: Cookie-based authentication with ASP.NET Core Identity Password Hasher
- **Frontend**: 
  - Bootstrap 5.3
  - Font Awesome 6.4
  - jQuery
  - Razor Views
- **Email**: SMTP email service for OTP delivery
- **Architecture**: MVC pattern with Repository pattern

## 📦 Prerequisites

- .NET 8.0 SDK or later
- SQL Server 2019 or later (or SQL Server Express / LocalDB)
- Visual Studio 2022, VS Code, or Rider (recommended)
- Git

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "ICU Management"
   ```

2. **Navigate to the project directory**
   ```bash
   cd Shefaa-ICU
   ```

3. **Restore NuGet packages**
   ```bash
   dotnet restore
   ```

4. **Configure the database connection** (see [Configuration](#configuration) section)

5. **Run database migrations**
   ```bash
   dotnet ef database update
   ```

6. **Build and run the application**
   ```bash
   dotnet build
   dotnet run
   ```

7. **Access the application**
   - Navigate to `https://localhost:7045` or `http://localhost:5152`
   - Register a new account (first user should be assigned Admin role)

## ⚙️ Configuration

### Database Connection

Update the connection string in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=ShefaaICU;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

For LocalDB (default):
```json
"DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ShefaaICU;Trusted_Connection=True;"
```

### SMTP Configuration (Email Functionality)

1. **Copy the example configuration file:**
   ```bash
   cp appsettings.example.json appsettings.Development.json
   ```

2. **Edit `appsettings.Development.json`** and add your SMTP credentials:
   ```json
   {
     "Smtp": {
       "Host": "smtp.gmail.com",
       "Port": 587,
       "User": "your-email@gmail.com",
       "Password": "your-app-password",
       "From": "your-email@gmail.com"
     }
   }
   ```

3. **For Gmail users:**
   - Enable 2-Step Verification in your Google Account
   - Generate an [App Password](https://support.google.com/accounts/answer/185833)
   - Use the App Password (not your regular password) in the configuration

**Note**: `appsettings.Development.json` is excluded from git to protect sensitive credentials.

## 👥 Role-Based Access Control

The system implements three user roles with distinct permissions:

### Admin
- ✅ Full system access
- ✅ Staff management (Create, Read, Update, Delete)
- ✅ Patient management (Create, Read, Update, Delete)
- ✅ Room management (Create, Edit, Delete, Assign patients)
- ✅ Schedule management (Create, Delete shifts)
- ✅ Reports and analytics access
- ✅ Attendance tracking (Check-in/Check-out)

### Doctor
- ✅ View and edit patient records
- ✅ Prescribe medications
- ✅ Add/edit clinical notes
- ✅ Record vital signs
- ✅ View schedules (read-only)
- ✅ Create and manage schedules
- ✅ View rooms (read-only)
- ❌ Cannot add/delete patients
- ❌ Cannot manage rooms or staff
- ❌ Cannot access reports

### Nurse
- ✅ View patient records
- ✅ Record vital signs
- ✅ Administer medications (mark as given)
- ✅ Add clinical notes
- ✅ Mark rooms as cleaning/available
- ✅ Evacuate rooms (remove patients)
- ✅ View schedules (read-only)
- ❌ Cannot edit patient information
- ❌ Cannot create medication orders
- ❌ Cannot manage schedules, rooms, or staff

## 📁 Project Structure

```
ICU Management/
├── Shefaa-ICU/              # Main ASP.NET Core MVC project
│   ├── Controllers/         # MVC Controllers
│   │   ├── AccountController.cs
│   │   ├── DashboardController.cs
│   │   ├── PatientsController.cs
│   │   ├── RoomsController.cs
│   │   ├── StaffController.cs
│   │   ├── MedicationsController.cs
│   │   ├── VitalsController.cs
│   │   ├── SchedulesController.cs
│   │   ├── ReportsController.cs
│   │   └── ProfileController.cs
│   ├── Models/              # Data models and entities
│   │   ├── Patient.cs
│   │   ├── Room.cs
│   │   ├── Staff.cs
│   │   ├── Medication.cs
│   │   ├── Vitals.cs
│   │   ├── ClinicalNotes.cs
│   │   ├── Schedule.cs
│   │   └── AttendanceLog.cs
│   ├── Views/               # Razor views
│   │   ├── Dashboard/
│   │   ├── Patients/
│   │   ├── Rooms/
│   │   ├── Staff/
│   │   ├── Medications/
│   │   ├── Vitals/
│   │   ├── Schedules/
│   │   ├── Reports/
│   │   └── Shared/
│   ├── Data/                # DbContext and data access
│   │   └── AppDbContext.cs
│   ├── Services/            # Business logic services
│   │   └── EmailSender.cs
│   ├── ViewModels/          # View models
│   ├── Migrations/           # Entity Framework migrations
│   ├── wwwroot/             # Static files (CSS, JS, images)
│   └── Program.cs           # Application entry point
├── DataBase/                 # SQL scripts (DDL and DML)
│   ├── DDL_Script.sql
│   ├── DML_Script.sql
│   └── Complete_Database_Setup.sql
└── Docs/                     # Documentation and SRS
    ├── SRS_Document.md
    └── srs.pdf
```

## 🗄️ Database Setup

### Option 1: Using Entity Framework Migrations (Recommended)

```bash
cd Shefaa-ICU
dotnet ef database update
```

### Option 2: Using SQL Scripts

1. Create the database:
   ```sql
   CREATE DATABASE ShefaaICU;
   ```

2. Run the scripts in order:
   - `DataBase/DDL_Script.sql` - Creates all tables
   - `DataBase/DML_Script.sql` - Inserts sample data

Or use the combined script:
   - `DataBase/Complete_Database_Setup.sql`

### Database Schema

The system uses the following main entities:
- **Staff**: User accounts with roles and authentication
- **Patient**: Patient records with medical information
- **Room**: ICU room management with status tracking
- **Vitals**: Patient vital signs recordings
- **Medication**: Medication orders and administration
- **ClinicalNotes**: Medical notes and documentation
- **Schedule**: Staff shift scheduling
- **AttendanceLog**: Staff check-in/check-out records

## 🔒 Security

- **Password Security**: PBKDF2 hashing algorithm (via ASP.NET Core Identity)
- **Authentication**: Cookie-based with secure session management
- **Authorization**: Role-based access control (RBAC) with server-side enforcement
- **CSRF Protection**: Anti-forgery tokens on all POST requests
- **Input Validation**: Model validation and SQL injection prevention (EF Core parameterized queries)
- **XSS Prevention**: Razor HTML encoding by default
- **Sensitive Data**: Configuration files with credentials are excluded from git

## 📝 Default Credentials

After initial setup, register the first user through the signup page. The first user should be assigned the **Admin** role manually in the database or through the Staff management interface (if another admin exists).

## 🧪 Testing

The application includes sample data in the DML script for testing purposes. You can:
- Test different user roles
- View sample patients, rooms, and schedules
- Test medication orders and vital signs recording

## 📚 Documentation

- **SRS Document**: See `Docs/SRS_Document.md` for detailed requirements
- **SQL Scripts**: See `DataBase/README_SQL_Scripts.md` for database setup instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👤 Support

For issues, questions, or contributions, please contact the development team or open an issue in the repository.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Developed with**: ASP.NET Core 8.0
