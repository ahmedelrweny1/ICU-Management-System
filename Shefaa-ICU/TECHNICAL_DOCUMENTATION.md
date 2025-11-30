# Shefaa ICU Management System - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Controllers & Functionality](#controllers--functionality)
4. [Database Models & Relationships](#database-models--relationships)
5. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
6. [Security Features](#security-features)
7. [Architecture & Design Decisions](#architecture--design-decisions)
8. [Common Questions & Answers](#common-questions--answers)
9. [Deployment & Configuration](#deployment--configuration)

---

## System Overview

**Shefaa ICU Management System** is a comprehensive web application built with ASP.NET Core MVC for managing Intensive Care Unit operations. The system provides functionality for patient management, room allocation, staff scheduling, medication orders, vital signs monitoring, and administrative reporting.

### Key Features
- **Patient Management**: Complete patient lifecycle from admission to discharge
- **Room Management**: Real-time room status tracking and patient assignment
- **Staff Management**: Staff profiles, attendance tracking, and scheduling
- **Medication Orders**: Prescription management and administration tracking
- **Vital Signs Monitoring**: Real-time vital signs recording and tracking
- **Clinical Notes**: Medical notes and documentation
- **Reports & Analytics**: Administrative reports and statistics
- **Role-Based Access Control**: Three-tier access (Admin, Doctor, Nurse)

### Technology Stack
- **Framework**: ASP.NET Core 8.0 MVC
- **Database**: SQL Server (LocalDB/Express)
- **ORM**: Entity Framework Core
- **Authentication**: Cookie-based authentication
- **Frontend**: Bootstrap 5, jQuery, Razor Views
- **Password Hashing**: ASP.NET Core Identity Password Hasher

---

## Authentication & Authorization

### Authentication System

The system uses **Cookie-based Authentication** implemented through ASP.NET Core's authentication middleware.

#### How Authentication Works

1. **Login Process** (`AccountController.Login`):
   - User provides username/email and password
   - System queries `Staff` table for matching username or email
   - Password is verified using `IPasswordHasher<Staff>` (PBKDF2 algorithm)
   - If valid, a claims-based identity is created with:
     - `ClaimTypes.NameIdentifier`: Staff ID
     - `ClaimTypes.Name`: Staff Name
     - `ClaimTypes.Email`: Staff Email
     - `ClaimTypes.Role`: Staff Role (Admin/Doctor/Nurse)
   - Cookie is created with authentication claims
   - User is redirected to Dashboard

2. **Registration Process** (`AccountController.Register`):
   - Email verification via OTP (One-Time Password)
   - OTP is sent via SMTP email service
   - OTP is stored in memory cache (10-minute expiration)
   - After email verification, user can complete registration
   - Password is hashed using `PasswordHasher.HashPassword()`
   - New staff record is created with `StaffStatus.Active`
   - User is automatically signed in after registration

3. **Password Reset** (`AccountController.ResetPassword`):
   - User requests password reset via email
   - OTP is sent to registered email
   - After OTP verification, user can set new password
   - Password is hashed and stored

4. **Logout** (`AccountController.Logout`):
   - Cookie is invalidated via `SignOutAsync()`
   - User is redirected to home page

#### Configuration (Program.cs)

```csharp
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/";              // Redirect to login if not authenticated
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Home/AccessDenied";  // Redirect if unauthorized
    });
```

### Authorization System

Authorization is implemented using **Role-Based Access Control (RBAC)** with three roles:

1. **Admin**: Full system access
2. **Doctor**: Patient care and medication management
3. **Nurse**: View and basic patient care operations

#### Authorization Policies

Defined in `Program.cs`:

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("DoctorOrAdmin", policy => policy.RequireRole("Doctor", "Admin"));
    options.AddPolicy("NurseOrAbove", policy => policy.RequireRole("Nurse", "Doctor", "Admin"));
});
```

#### Authorization Attributes

- `[Authorize]`: Requires authentication (any role)
- `[Authorize(Roles = "Admin")]`: Admin only
- `[Authorize(Roles = "Doctor,Admin")]`: Doctor or Admin
- `[Authorize(Roles = "Admin,Nurse")]`: Admin or Nurse
- `[AllowAnonymous]`: No authentication required

#### UI-Level Authorization

Views use `@if (User.IsInRole("RoleName"))` to conditionally render buttons and navigation items based on user role.

---

## Controllers & Functionality

### 1. AccountController

**Purpose**: Handles authentication, registration, and password management.

#### Key Actions:

- **`Login(LoginViewModel model)`** [POST]
  - Validates credentials
  - Creates authentication cookie
  - Redirects to Dashboard

- **`Register(RegisterViewModel model)`** [POST]
  - Validates email OTP
  - Creates new staff account
  - Auto-signs in user

- **`Logout()`** [POST, Authorize]
  - Signs out user
  - Clears authentication cookie

- **`SendRegisterOtp(OtpRequest request)`** [POST]
  - Generates 6-digit OTP
  - Sends via email
  - Stores in memory cache (10 min expiry)

- **`VerifyRegisterOtp(OtpVerifyRequest request)`** [POST]
  - Validates OTP code
  - Marks email as verified (15 min cache)

- **`SendResetOtp(OtpRequest request)`** [POST]
  - Sends password reset OTP

- **`ResetPassword(ResetPasswordRequest request)`** [POST]
  - Resets password after OTP verification

---

### 2. DashboardController

**Purpose**: Main dashboard displaying system statistics and recent activities.

#### Key Actions:

- **`Index()`** [GET, Authorize]
  - **Statistics Calculated**:
    - Total Rooms, Patients, Staff
    - Critical Cases count
    - Room status breakdown (Available/Occupied/Cleaning)
    - Staff currently on duty
  - **Weekly Occupancy**: Last 7 days occupancy rate
  - **Recent Activities**: 
    - Clinical notes (last 5)
    - Medication administrations (last 3)
    - Staff check-ins (last 2)
  - **Staff On Duty**: From attendance logs or current shift schedules
  - **Vitals Trends**: Last 10 vital sign recordings
  - **Vital Alerts**: Critical vitals (SpO2 < 92%, Pulse < 50 or > 110, Temp > 38.5°C)
  - **Current Shift Info**: Based on time of day (Morning/Evening/Night)

**Data Sources**:
- `Rooms`, `Patients`, `Staff` tables
- `AttendanceLogs` for on-duty staff
- `Schedules` for shift information
- `ClinicalNotes`, `Medications`, `Vitals` for activities

---

### 3. PatientsController

**Purpose**: Manages patient records, vitals, and clinical notes.

#### Key Actions:

- **`Index()`** [GET, Authorize]
  - Lists all patients with room assignments
  - Shows available rooms for assignment

- **`Details(int? id)`** [GET, Authorize]
  - Patient details with:
    - Clinical notes (with author info)
    - Medications (with staff info)
    - Vital signs history
    - Room information

- **`Edit(int? id)`** [GET, Authorize]
  - Edit form for patient information
  - Pre-populates with existing data

- **`Add(Patient patient)`** [POST, Authorize(Roles = "Admin")]
  - Creates new patient
  - Generates unique patient code: `P{yyyyMMddHHmmss}`
  - Optionally assigns to room (updates room status)

- **`Update(int id, Patient patient)`** [POST, Authorize(Roles = "Doctor,Admin")]
  - Updates patient information
  - Handles room reassignment
  - Updates room status accordingly

- **`Delete(int id)`** [POST, Authorize(Roles = "Admin")]
  - Deletes patient record
  - Frees assigned room

- **`UpdateVitals(Vitals vitals)`** [POST, Authorize]
  - Records new vital signs entry
  - Timestamped automatically

- **`AddNote(ClinicalNotes note)`** [POST, Authorize]
  - Adds clinical note
  - Auto-assigns current user as author

**Access Control**:
- **View**: All authenticated users
- **Add**: Admin only
- **Edit**: Doctor, Admin
- **Delete**: Admin only
- **Vitals/Notes**: All authenticated users

---

### 4. RoomsController

**Purpose**: Manages ICU rooms, status, and patient assignments.

#### Key Actions:

- **`Index()`** [GET, Authorize]
  - Displays all rooms grouped by status
  - Shows assigned patient information
  - Lists unassigned patients

- **`Edit(int? id)`** [GET, Authorize(Roles = "Admin")]
  - Edit form for room details

- **`Add(Room room)`** [POST, Authorize(Roles = "Admin")]
  - Creates new room
  - Default status: `Available`
  - Validates unique room number

- **`Update(int id, Room room)`** [POST, Authorize(Roles = "Admin")]
  - Updates room information
  - Handles status changes:
    - If changing from Occupied to Available/Cleaning: Removes patient assignment
    - If marking as Occupied without patient: Warning message

- **`Delete(int id)`** [POST, Authorize(Roles = "Admin")]
  - Deletes room (only if no patient assigned)

- **`AssignPatient(int roomId, int patientId)`** [POST, Authorize(Roles = "Admin")]
  - Assigns patient to room
  - Updates room status to `Occupied`
  - Handles patient reassignment (frees old room)

- **`EvacuateRoom(int id)`** [POST, Authorize(Roles = "Admin,Nurse")]
  - Removes patient from room
  - Sets room status to `Available`

- **`MarkAvailable(int id)`** [POST, Authorize(Roles = "Admin,Nurse")]
  - Marks cleaning room as available
  - Validates no patient is assigned

**Room Status Flow**:
```
Available → [Assign Patient] → Occupied
Occupied → [Evacuate] → Available
Available → [Mark Cleaning] → Cleaning
Cleaning → [Mark Available] → Available
```

**Access Control**:
- **View**: All authenticated users
- **Add/Edit/Delete/Assign**: Admin only
- **Evacuate/Mark Available**: Admin, Nurse

---

### 5. StaffController

**Purpose**: Manages staff members, attendance, and profiles.

#### Key Actions:

- **`Index()`** [GET, Authorize(Roles = "Admin")]
  - Lists all staff members
  - Shows role, specialty, status, contact info

- **`Details(int? id)`** [GET, Authorize(Roles = "Admin")]
  - Staff member details

- **`Create(Staff staff)`** [POST, Authorize(Roles = "Admin")]
  - Creates new staff member
  - Auto-generates username if not provided
  - Default status: `Active`

- **`Edit(int? id)`** [GET, Authorize(Roles = "Admin")]
  - Edit form for staff information

- **`Update(int id, Staff staff)`** [POST, Authorize(Roles = "Admin")]
  - Updates staff information
  - Validates unique username

- **`Delete(int id)`** [POST, Authorize(Roles = "Admin")]
  - Deletes staff member
  - Cascades deletion:
    - Removes AttendanceLogs
    - Removes ClinicalNotes
    - Removes Schedules
    - Medications: Sets `AdministeredBy` to NULL

- **`CheckIn(int staffId)`** [POST, Authorize(Roles = "Admin")]
  - Records staff check-in
  - Creates `AttendanceLog` with `OnDuty` status
  - Updates staff status to `Active`
  - Prevents duplicate check-ins

- **`CheckOut(int staffId)`** [POST, Authorize(Roles = "Admin")]
  - Records staff check-out
  - Updates `AttendanceLog` with checkout time
  - Sets status to `OffDuty`
  - Updates staff status to `Inactive`
  - Calculates duration

- **`UpdateStatus(int id, StaffStatus status)`** [POST, Authorize(Roles = "Admin")]
  - Manually updates staff status

- **`AttendanceReport(int? id)`** [GET, Authorize(Roles = "Admin")]
  - Shows attendance logs
  - Can filter by staff member

**Access Control**: Admin only for all actions

---

### 6. SchedulesController

**Purpose**: Manages staff shift schedules.

#### Key Actions:

- **`Index(string? weekStart)`** [GET, Authorize]
  - Displays weekly schedule view
  - Shows schedules for current week (Monday-Sunday)
  - Displays shift counts for today (Morning/Evening/Night)
  - Lists all active staff for assignment

- **`SaveSchedule(string date, string shiftType, string notes, int[] staffIds)`** [POST, Authorize(Roles = "Admin,Doctor")]
  - Creates schedules for multiple staff members
  - Validates staff are active
  - Prevents duplicate schedules (same date, shift, staff)
  - Supports three shift types: Morning, Evening, Night

- **`DeleteSchedule(string date, string shiftType)`** [POST, Authorize(Roles = "Admin,Doctor")]
  - Deletes all schedules for a specific date and shift type

**Shift Types**:
- **Morning**: 08:00 - 16:00
- **Evening**: 16:00 - 00:00
- **Night**: 00:00 - 08:00

**Access Control**:
- **View**: All authenticated users
- **Create/Delete**: Admin, Doctor
- **Nurses**: View-only access

---

### 7. VitalsController

**Purpose**: Records and monitors patient vital signs.

#### Key Actions:

- **`Index()`** [GET, Authorize]
  - Lists last 30 vital sign entries
  - Shows patient name, timestamp, and all vital metrics
  - Displays only active (non-discharged) patients for new entries

- **`Create(VitalsFormViewModel model)`** [POST, Authorize]
  - Records new vital signs entry
  - Validates patient is active
  - Records: BP, Temperature, Pulse, SpO2, Respiratory Rate
  - Timestamped with UTC time

**Vital Signs Tracked**:
- Blood Pressure (BP): Systolic/Diastolic or text format
- Temperature: Celsius
- Pulse: Beats per minute
- SpO2: Oxygen saturation percentage
- Respiratory Rate: Breaths per minute

**Critical Thresholds** (for alerts):
- SpO2 < 92%: Critical
- Pulse < 50 or > 110: Warning
- Temperature > 38.5°C: Warning

**Access Control**: All authenticated users can view and record vitals

---

### 8. MedicationsController

**Purpose**: Manages medication orders and administration.

#### Key Actions:

- **`Index()`** [GET, Authorize]
  - Lists all medication orders
  - Shows patient, medication name, dose, frequency, status
  - Displays scheduled time and administration details

- **`Create(MedicationFormViewModel model)`** [POST, Authorize(Roles = "Doctor,Admin")]
  - Creates new medication order
  - Validates patient is active
  - Sets initial status: `Scheduled`
  - Optionally assigns administering staff

- **`MarkGiven(int id)`** [POST, Authorize]
  - Marks medication as administered
  - Sets status to `Given`
  - Records `AdministeredAt` timestamp
  - Auto-assigns current user if not specified

- **`Cancel(int id)`** [POST, Authorize]
  - Cancels medication order
  - Sets status to `Cancelled`
  - Clears administration details

**Medication Statuses**:
- `Scheduled`: Order created, not yet given
- `Given`: Medication administered
- `Cancelled`: Order cancelled

**Access Control**:
- **View**: All authenticated users
- **Create**: Doctor, Admin
- **Mark Given/Cancel**: All authenticated users

---

### 9. ReportsController

**Purpose**: Administrative reports and statistics.

#### Key Actions:

- **`Index()`** [GET, Authorize(Roles = "Admin")]
  - **Patient Statistics**:
    - Total admissions
    - Age range (min/max)
    - Average length of stay
  - **Room Statistics**:
    - Total beds
    - Occupancy rate
    - Occupied rooms count
  - **Staff Statistics**:
    - Active staff count
    - Total shifts scheduled
    - Staff utilization rate

**Access Control**: Admin only

---

### 10. ProfileController

**Purpose**: User profile management.

#### Key Actions:

- **`Index()`** [GET, Authorize]
  - Displays current user's profile
  - Shows: Name, Role, Specialty, Contact info
  - Calculates days active since account creation
  - Shows last login from attendance logs

- **`UpdatePersonalInfo(UpdatePersonalInfoViewModel model)`** [POST, Authorize]
  - Updates name, phone, email, specialty
  - Validates email format

- **`ChangePassword(ChangePasswordViewModel model)`** [POST, Authorize]
  - Changes user password
  - Validates current password
  - Requires new password confirmation
  - Minimum 8 characters

- **`UploadProfilePhoto(IFormFile photo)`** [POST, Authorize]
  - Uploads profile photo
  - Validates file type (JPG, PNG, GIF, WEBP)
  - Maximum file size: 5MB
  - Stores in `/wwwroot/uploads/profiles/`
  - Deletes old photo if exists

**Access Control**: All authenticated users (own profile only)

---

### 11. HomeController

**Purpose**: Public pages and error handling.

#### Key Actions:

- **`Index()`** [GET, AllowAnonymous]
  - Login page
  - Redirects to Dashboard if already authenticated

- **`Signup()`** [GET, AllowAnonymous]
  - Registration page
  - Redirects to Dashboard if already authenticated

- **`AccessDenied()`** [GET, Authorize]
  - Displays access denied message
  - Shown when user lacks required role

- **`Error()`** [GET, AllowAnonymous]
  - Error page for unhandled exceptions

---

## Database Models & Relationships

### Entity Relationship Diagram

```
Staff (1) ────< (N) AttendanceLogs
Staff (1) ────< (N) ClinicalNotes
Staff (1) ────< (N) Schedules
Staff (1) ────< (N) Medications (AdministeredBy, nullable)

Patient (1) ────< (N) Vitals
Patient (1) ────< (N) Medications
Patient (1) ────< (N) ClinicalNotes
Patient (1) ────< (1) Room (RoomId, nullable)

Room (1) ────< (1) Patient (PatientID, nullable)
```

### Model Details

#### Staff
- **Primary Key**: `ID` (int, Identity)
- **Unique Constraints**: `Username`, `Email`
- **Relationships**:
  - One-to-Many: `AttendanceLogs`, `ClinicalNotes`, `Schedules`
  - One-to-Many: `Medications` (as `AdministeredBy`, nullable)
- **Status Enum**: `Active`, `Inactive`, `OnLeave`

#### Patient
- **Primary Key**: `ID` (int, Identity)
- **Unique Constraints**: `Code`
- **Relationships**:
  - One-to-One: `Room` (nullable)
  - One-to-Many: `Vitals`, `Medications`, `ClinicalNotes`
- **Gender Enum**: `Male`, `Female`, `Other`

#### Room
- **Primary Key**: `ID` (int, Identity)
- **Unique Constraints**: `Number`
- **Relationships**:
  - One-to-One: `Patient` (nullable, circular reference with Patient)
- **Status Enum**: `Available`, `Occupied`, `Cleaning`

#### Vitals
- **Primary Key**: `ID` (int, Identity)
- **Foreign Keys**: `PatientID` (required, Restrict delete)
- **Indexes**: Composite on `(PatientID, RecordedAt)`

#### Medication
- **Primary Key**: `Id` (int, Identity)
- **Foreign Keys**: 
  - `PatientID` (required, Restrict delete)
  - `AdministeredBy` (nullable, SetNull delete)
- **Status Enum**: `Scheduled`, `Given`, `Cancelled`

#### ClinicalNotes
- **Primary Key**: `ID` (int, Identity)
- **Foreign Keys**: 
  - `PatientID` (required, Restrict delete)
  - `AuthorId` (required, Restrict delete)

#### AttendanceLog
- **Primary Key**: `ID` (int, Identity)
- **Foreign Keys**: `StaffID` (required, Restrict delete)
- **Indexes**: Composite on `(StaffID, CheckInTime)`
- **Status Enum**: `OnDuty`, `OffDuty`

#### Schedule
- **Primary Key**: `Id` (int, Identity)
- **Foreign Keys**: `StaffID` (required, Restrict delete)
- **Indexes**: Composite on `(Date, ShiftType, StaffID)`
- **ShiftType Enum**: `Morning`, `Evening`, `Night`

### Circular Dependency Resolution

The `Rooms` and `Patients` tables have a circular dependency:
- `Patient.RoomId` → `Room.ID`
- `Room.PatientID` → `Patient.ID`

**Solution**: Both tables are created first without foreign keys, then `ALTER TABLE` statements add the constraints after both tables exist.

---

## Role-Based Access Control (RBAC)

### Role Definitions

#### Admin
**Full System Access**
- ✅ All patient operations (Add, Edit, Delete, View)
- ✅ All room operations (Add, Edit, Delete, Assign, Evacuate)
- ✅ All staff operations (Add, Edit, Delete, Check-in/out)
- ✅ Schedule management (Create, Delete)
- ✅ Medication orders (Create, View)
- ✅ Reports access
- ✅ Profile management

#### Doctor
**Patient Care & Medical Operations**
- ✅ View all patients
- ✅ Edit patient information
- ✅ View patient details (vitals, notes, medications)
- ✅ Add clinical notes
- ✅ Record vitals
- ✅ Create medication orders
- ✅ Mark medications as given/cancelled
- ✅ Schedule management (Create, Delete)
- ✅ View rooms
- ✅ Profile management
- ❌ Cannot add/delete patients
- ❌ Cannot manage rooms
- ❌ Cannot manage staff
- ❌ Cannot access reports

#### Nurse
**View & Basic Patient Care**
- ✅ View all patients
- ✅ View patient details
- ✅ Add clinical notes
- ✅ Record vitals
- ✅ Mark medications as given/cancelled
- ✅ View schedules (read-only)
- ✅ Evacuate rooms (remove patients)
- ✅ Mark rooms as available (after cleaning)
- ✅ Profile management
- ❌ Cannot edit patient information
- ❌ Cannot create medication orders
- ❌ Cannot manage schedules
- ❌ Cannot manage rooms (except evacuate/mark available)
- ❌ Cannot manage staff
- ❌ Cannot access reports

### Access Control Matrix

| Feature | Admin | Doctor | Nurse |
|---------|-------|--------|-------|
| **Patients** |
| View Patients | ✅ | ✅ | ✅ |
| Add Patient | ✅ | ❌ | ❌ |
| Edit Patient | ✅ | ✅ | ❌ |
| Delete Patient | ✅ | ❌ | ❌ |
| Add Note | ✅ | ✅ | ✅ |
| Record Vitals | ✅ | ✅ | ✅ |
| **Rooms** |
| View Rooms | ✅ | ✅ | ✅ |
| Add Room | ✅ | ❌ | ❌ |
| Edit Room | ✅ | ❌ | ❌ |
| Delete Room | ✅ | ❌ | ❌ |
| Assign Patient | ✅ | ❌ | ❌ |
| Evacuate Room | ✅ | ❌ | ✅ |
| Mark Available | ✅ | ❌ | ✅ |
| **Staff** |
| View Staff | ✅ | ❌ | ❌ |
| Manage Staff | ✅ | ❌ | ❌ |
| **Schedules** |
| View Schedules | ✅ | ✅ | ✅ |
| Create Schedule | ✅ | ✅ | ❌ |
| Delete Schedule | ✅ | ✅ | ❌ |
| **Medications** |
| View Medications | ✅ | ✅ | ✅ |
| Create Order | ✅ | ✅ | ❌ |
| Mark Given | ✅ | ✅ | ✅ |
| **Reports** |
| View Reports | ✅ | ❌ | ❌ |
| **Profile** |
| View/Edit Profile | ✅ | ✅ | ✅ |

---

## Security Features

### 1. Password Security
- **Hashing Algorithm**: PBKDF2 (via ASP.NET Core Identity Password Hasher)
- **Salt**: Automatically generated per password
- **Storage**: Only hashed passwords stored, never plain text
- **Verification**: `VerifyHashedPassword()` compares hashes securely

### 2. Authentication Security
- **Cookie Authentication**: Secure, HTTP-only cookies
- **CSRF Protection**: Anti-forgery tokens on all POST requests
- **Session Management**: Persistent cookies with "Remember Me" option
- **Auto-redirect**: Unauthenticated users redirected to login

### 3. Authorization Security
- **Server-Side Enforcement**: All authorization checks on server
- **Role-Based**: Claims-based role checking
- **UI Hiding**: Buttons/links hidden based on role (UX only, not security)
- **Access Denied Page**: Custom page for unauthorized access attempts

### 4. Input Validation
- **Model Validation**: Data annotations and manual validation
- **SQL Injection Prevention**: Entity Framework parameterized queries
- **XSS Prevention**: Razor HTML encoding by default
- **File Upload Validation**: File type and size restrictions

### 5. Email Security
- **OTP System**: 6-digit codes, 10-minute expiration
- **Memory Cache**: OTPs stored in-memory (not persistent)
- **Email Verification**: Required for registration

### 6. Data Integrity
- **Foreign Key Constraints**: Enforced at database level
- **Cascade Rules**: 
  - `Restrict`: Prevents deletion if related records exist
  - `SetNull`: Sets foreign key to NULL on deletion
- **Unique Constraints**: Username, Email, Patient Code, Room Number

---

## Architecture & Design Decisions

### 1. MVC Pattern
- **Separation of Concerns**: Controllers handle logic, Views handle presentation, Models represent data
- **Razor Views**: Server-side rendering for dynamic content
- **ViewBag/ViewData**: Passing data from controllers to views

### 2. Entity Framework Core
- **Code-First Approach**: Models define database schema
- **Migrations**: Database changes tracked via EF Migrations
- **Lazy Loading**: Virtual navigation properties enable lazy loading
- **Eager Loading**: `.Include()` for related data when needed

### 3. Dependency Injection
- **Service Registration**: All services registered in `Program.cs`
- **Scoped Lifetime**: DbContext, PasswordHasher, EmailSender
- **Singleton**: MemoryCache

### 4. Error Handling
- **Try-Catch Blocks**: Controllers handle exceptions gracefully
- **TempData Messages**: Success/Error messages via TempData
- **Fallback Data**: Dashboard provides default values if database fails
- **Error Page**: Global error handler for unhandled exceptions

### 5. Caching Strategy
- **Memory Cache**: Used for OTP storage (temporary, in-memory)
- **No Persistent Cache**: Database is source of truth

### 6. File Storage
- **Local Storage**: Profile photos stored in `wwwroot/uploads/profiles/`
- **File Naming**: Unique filenames with timestamp to prevent conflicts
- **Cleanup**: Old photos deleted when new one uploaded

### 7. Date/Time Handling
- **UTC Storage**: Vitals and medications use UTC timestamps
- **Local Display**: Converted to local time in views
- **Admission Dates**: Stored as local DateTime

---

## Common Questions & Answers

### Q1: How does the authentication system work?

**A**: The system uses cookie-based authentication. When a user logs in:
1. Credentials are verified against the `Staff` table
2. Password is verified using PBKDF2 hashing
3. A claims-based identity is created with user ID, name, email, and role
4. An encrypted cookie is set with these claims
5. Subsequent requests include this cookie, and the user is authenticated

The cookie persists based on the "Remember Me" option. Logout invalidates the cookie.

---

### Q2: How are roles assigned and checked?

**A**: 
- **Assignment**: Roles are stored as strings in the `Staff.Role` field ("Admin", "Doctor", "Nurse")
- **Claims**: Role is added to the authentication cookie as `ClaimTypes.Role`
- **Server-Side Check**: Controllers use `[Authorize(Roles = "...")]` attributes
- **UI Check**: Views use `@if (User.IsInRole("RoleName"))` to conditionally render elements

**Important**: UI hiding is for UX only. All security is enforced server-side via authorization attributes.

---

### Q3: How does the room-patient assignment work?

**A**: There's a circular relationship:
- `Patient.RoomId` points to `Room.ID`
- `Room.PatientID` points to `Patient.ID`

When assigning a patient to a room:
1. Patient's `RoomId` is set to the room's ID
2. Room's `PatientID` is set to the patient's ID
3. Room status changes to `Occupied`

When evacuating:
1. Patient's `RoomId` is set to NULL
2. Room's `PatientID` is set to NULL
3. Room status changes to `Available`

Both fields are kept in sync to maintain data integrity.

---

### Q4: How are passwords stored and verified?

**A**: 
- **Storage**: Passwords are hashed using ASP.NET Core Identity's `PasswordHasher<Staff>`
- **Algorithm**: PBKDF2 with HMAC-SHA256, 10,000 iterations (default)
- **Salt**: Unique salt generated per password
- **Verification**: `VerifyHashedPassword()` compares the provided password with the stored hash
- **Security**: Plain text passwords are never stored or logged

---

### Q5: How does the OTP system work for email verification?

**A**:
1. **Generation**: 6-digit random code (100000-999999)
2. **Storage**: Stored in memory cache with key `register-otp:{email}`
3. **Expiration**: 10 minutes
4. **Email**: Sent via SMTP (configured in `appsettings.json`)
5. **Verification**: Code is checked against cache, then removed
6. **Verified Flag**: After verification, a flag is set in cache (`register-verified:{email}`) for 15 minutes

**Note**: OTPs are stored in memory, so they're lost on server restart. This is intentional for security.

---

### Q6: How does the dashboard calculate statistics?

**A**: The dashboard queries the database in real-time:
- **Room Count**: `_context.Rooms.Count()`
- **Patient Count**: `_context.Patients.Count(p => p.DischargeDate == null)`
- **Staff Count**: `_context.Staff.Count(s => s.Status == StaffStatus.Active)`
- **Critical Cases**: `_context.Patients.Count(p => p.Condition == "Critical" && p.DischargeDate == null)`
- **Room Status**: Grouped by `RoomStatus` enum
- **Staff On Duty**: From `AttendanceLogs` where `Status == OnDuty && CheckOutTime == null`
- **Weekly Occupancy**: Calculated for last 7 days based on patient admission/discharge dates

If database queries fail, fallback values are used to prevent dashboard errors.

---

### Q7: How are medication orders tracked?

**A**:
1. **Creation**: Doctor/Admin creates order with patient, medication name, dose, frequency, scheduled time
2. **Status**: Initial status is `Scheduled`
3. **Administration**: Any staff can mark as `Given`, which records:
   - `AdministeredAt` timestamp
   - `AdministeredBy` staff ID (auto-assigned if not specified)
4. **Cancellation**: Order can be cancelled, setting status to `Cancelled`

Status changes are tracked via the `MedicationStatus` enum.

---

### Q8: How does staff attendance tracking work?

**A**:
1. **Check-In**: Admin clicks "Check In" for a staff member
   - Creates `AttendanceLog` with `CheckInTime = DateTime.Now`
   - Sets `Status = OnDuty`
   - Updates staff `Status = Active`
   - Prevents duplicate check-ins (checks for existing active log)

2. **Check-Out**: Admin clicks "Check Out"
   - Finds active `AttendanceLog`
   - Sets `CheckOutTime = DateTime.Now`
   - Sets `Status = OffDuty`
   - Updates staff `Status = Inactive`
   - Calculates duration

3. **Dashboard**: "Staff On Duty" shows staff with active attendance logs (no checkout time)

---

### Q9: How are schedules managed?

**A**:
- **View**: Weekly calendar view (Monday-Sunday)
- **Creation**: Admin/Doctor selects date, shift type, and multiple staff members
- **Storage**: Each staff member gets a separate `Schedule` record
- **Prevention**: Duplicate schedules (same date, shift, staff) are prevented
- **Deletion**: All schedules for a date/shift combination can be deleted at once

**Shift Types**:
- Morning: 08:00 - 16:00
- Evening: 16:00 - 00:00
- Night: 00:00 - 08:00

---

### Q10: How are vital signs alerts generated?

**A**: The dashboard checks recent vitals for critical values:
- **SpO2 < 92%**: Critical alert (red)
- **Pulse < 50 or > 110**: Warning alert (yellow)
- **Temperature > 38.5°C**: Warning alert (yellow)

Alerts are displayed on the dashboard with patient name, metric, value, and severity.

---

### Q11: What happens when a patient is deleted?

**A**:
1. System checks if patient has assigned room
2. If room assigned:
   - Room's `PatientID` is set to NULL
   - Room status changes to `Available`
3. Patient record is deleted
4. Related records:
   - **Vitals**: Protected by `Restrict` delete (cannot delete patient with vitals)
   - **Medications**: Protected by `Restrict` delete
   - **ClinicalNotes**: Protected by `Restrict` delete

**Note**: In practice, patients with related records cannot be deleted due to foreign key constraints. Consider soft delete (setting `DischargeDate`) instead.

---

### Q12: How does profile photo upload work?

**A**:
1. **Validation**: 
   - File type: JPG, PNG, GIF, WEBP
   - File size: Maximum 5MB
2. **Storage**: 
   - Directory: `wwwroot/uploads/profiles/`
   - Filename: `profile_{staffId}_{timestamp}.{extension}`
3. **Database**: Path stored as `/uploads/profiles/{filename}`
4. **Cleanup**: Old photo deleted if exists
5. **Display**: Image served from `wwwroot` via static file middleware

---

### Q13: How is the database initialized?

**A**: 
1. **Migrations**: Entity Framework Migrations create/update schema
2. **SQL Scripts**: DDL and DML scripts available in `Data/` folder
3. **DDL Script**: Creates all tables with proper foreign keys
4. **DML Script**: Inserts sample data
5. **Execution Order**: DDL first, then DML (respects foreign key dependencies)

See `Data/README_SQL_Scripts.md` for detailed instructions.

---

### Q14: How does the "Remember Me" feature work?

**A**: 
- When checked during login, `remember` parameter is `true`
- Cookie is created with `IsPersistent = true`
- Cookie expiration is extended (default: 14 days)
- When unchecked, cookie expires when browser closes

---

### Q15: What is the difference between Staff Status and Attendance Status?

**A**:
- **Staff Status** (`Staff.Status`): Overall staff member status
  - `Active`: Staff member is active in system
  - `Inactive`: Staff member is inactive
  - `OnLeave`: Staff member is on leave
- **Attendance Status** (`AttendanceLog.Status`): Current shift status
  - `OnDuty`: Currently checked in and working
  - `OffDuty`: Checked out

A staff member can be `Active` but `OffDuty` (not currently on shift), or `Inactive` and `OffDuty` (not working).

---

## Deployment & Configuration

### Connection String

Configure in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ShefaaICU;Trusted_Connection=True;"
  }
}
```

For production, use a full SQL Server connection string:
```
Server=your-server;Database=ShefaaICU;User Id=your-user;Password=your-password;
```

### SMTP Configuration

Configure in `appsettings.json`:

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

**Note**: For Gmail, use an App Password, not your regular password.

### Environment Variables

For production, move sensitive data to environment variables or Azure Key Vault:
- Connection strings
- SMTP credentials
- Any API keys

### Database Migration

1. **Development**: 
   ```bash
   dotnet ef migrations add MigrationName
   dotnet ef database update
   ```

2. **Production**: 
   - Run migrations during deployment
   - Or use SQL scripts from `Data/` folder

### Static Files

Profile photos are stored in `wwwroot/uploads/profiles/`. Ensure:
- Directory exists and is writable
- Static file middleware is configured (already in `Program.cs`)

### HTTPS

In production, ensure HTTPS is enabled:
- `app.UseHttpsRedirection()` is already configured
- Configure SSL certificate
- Update cookie settings for secure cookies if needed

---

## Conclusion

This documentation provides a comprehensive overview of the Shefaa ICU Management System. For additional support or questions, refer to the codebase or contact the development team.

**Last Updated**: January 2025
**Version**: 1.0

