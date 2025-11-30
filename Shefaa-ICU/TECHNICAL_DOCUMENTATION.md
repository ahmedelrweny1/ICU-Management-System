# Shefaa ICU Management System - Technical Documentation

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [Controllers & Functions](#controllers--functions)
3. [Database Schema](#database-schema)
4. [Role-Based Access Control](#role-based-access-control)
5. [Key Technical Details](#key-technical-details)

---

## Authentication & Authorization

### Authentication Flow

**Cookie-based authentication** using ASP.NET Core Identity Password Hasher (PBKDF2).

**Login Process**:
1. Query `Staff` table by username/email
2. Verify password hash using `IPasswordHasher<Staff>`
3. Create claims: `NameIdentifier`, `Name`, `Email`, `Role`
4. Set authentication cookie
5. Redirect to Dashboard

**Registration**:
- Email OTP verification (6-digit code, 10-min cache expiry)
- Password hashed with `PasswordHasher.HashPassword()`
- Auto-sign-in after registration

**Password Reset**:
- OTP sent to email → verify → set new password

### Authorization

**Policies** (Program.cs):
```csharp
"AdminOnly" → RequireRole("Admin")
"DoctorOrAdmin" → RequireRole("Doctor", "Admin")
"NurseOrAbove" → RequireRole("Nurse", "Doctor", "Admin")
```

**Attributes**:
- `[Authorize]` - Any authenticated user
- `[Authorize(Roles = "Admin")]` - Admin only
- `[Authorize(Roles = "Doctor,Admin")]` - Doctor or Admin
- `[AllowAnonymous]` - No auth required

**UI Authorization**: `@if (User.IsInRole("RoleName"))` for conditional rendering (UX only, not security)

---

## Controllers & Functions

### AccountController
- `Login()` - Verify credentials, create auth cookie
- `Register()` - Email OTP → create staff → sign in
- `Logout()` - Clear auth cookie
- `SendRegisterOtp()` - Generate 6-digit OTP, send email, cache 10 min
- `VerifyRegisterOtp()` - Validate OTP, set verified flag (15 min cache)
- `SendResetOtp()` / `ResetPassword()` - Password reset flow

### DashboardController
- `Index()` - Real-time statistics:
  - Room/Patient/Staff counts
  - Critical cases, room status breakdown
  - Staff on duty (from AttendanceLogs or current shift)
  - Weekly occupancy (last 7 days)
  - Recent activities (notes, medications, check-ins)
  - Vital alerts (SpO2 < 92%, Pulse < 50 or > 110, Temp > 38.5°C)
  - Current shift info (Morning/Evening/Night based on time)

### PatientsController
- `Index()` - List all patients with room assignments
- `Details(id)` - Patient details with notes, medications, vitals
- `Edit(id)` - Edit form (GET)
- `Add(patient)` - **[Admin]** Create patient, generate code `P{yyyyMMddHHmmss}`, assign room
- `Update(id, patient)` - **[Doctor,Admin]** Update patient, handle room reassignment
- `Delete(id)` - **[Admin]** Delete patient, free room
- `UpdateVitals(vitals)` - Record vital signs
- `AddNote(note)` - Add clinical note (auto-assigns current user as author)

### RoomsController
- `Index()` - Display rooms by status, show assigned patients
- `Add(room)` - **[Admin]** Create room, default status `Available`
- `Edit(id)` - **[Admin]** Edit form (GET)
- `Update(id, room)` - **[Admin]** Update room, handle status changes:
  - Occupied → Available/Cleaning: Remove patient assignment
  - Available → Occupied without patient: Warning
- `Delete(id)` - **[Admin]** Delete room (only if no patient)
- `AssignPatient(roomId, patientId)` - **[Admin]** Assign patient, set room `Occupied`
- `EvacuateRoom(id)` - **[Admin,Nurse]** Remove patient, set `Available`
- `MarkAvailable(id)` - **[Admin,Nurse]** Mark cleaning room as available

**Room Status Flow**: `Available ↔ Occupied ↔ Cleaning`

### StaffController
- `Index()` - **[Admin]** List all staff
- `Create(staff)` - **[Admin]** Create staff, auto-generate username if empty
- `Update(id, staff)` - **[Admin]** Update staff info, validate unique username
- `Delete(id)` - **[Admin]** Delete staff, cascade:
  - Remove AttendanceLogs, ClinicalNotes, Schedules
  - Medications: Set `AdministeredBy` to NULL
- `CheckIn(staffId)` - **[Admin]** Create AttendanceLog `OnDuty`, set staff `Active`
- `CheckOut(staffId)` - **[Admin]** Set AttendanceLog `OffDuty`, set staff `Inactive`, calculate duration
- `AttendanceReport(id?)` - **[Admin]** View attendance logs (all or by staff)

### SchedulesController
- `Index(weekStart?)` - Weekly schedule view (Monday-Sunday), shift counts, active staff list
- `SaveSchedule(date, shiftType, notes, staffIds[])` - **[Admin,Doctor]** Create schedules for multiple staff, prevent duplicates
- `DeleteSchedule(date, shiftType)` - **[Admin,Doctor]** Delete all schedules for date/shift

**Shift Types**: Morning (08:00-16:00), Evening (16:00-00:00), Night (00:00-08:00)

### VitalsController
- `Index()` - List last 30 vital entries
- `Create(model)` - Record vitals (BP, Temperature, Pulse, SpO2, Respiratory Rate), UTC timestamp

**Critical Thresholds**: SpO2 < 92%, Pulse < 50 or > 110, Temp > 38.5°C

### MedicationsController
- `Index()` - List all medication orders with patient/staff info
- `Create(model)` - **[Doctor,Admin]** Create medication order, status `Scheduled`
- `MarkGiven(id)` - Mark as `Given`, record `AdministeredAt`, auto-assign current user if not set
- `Cancel(id)` - Set status `Cancelled`, clear admin details

**Statuses**: `Scheduled` → `Given` / `Cancelled`

### ReportsController
- `Index()` - **[Admin]** Statistics:
  - Patient: Total admissions, age range, avg stay
  - Room: Total beds, occupancy rate
  - Staff: Active count, shifts, utilization

### ProfileController
- `Index()` - Display current user profile, days active, last login
- `UpdatePersonalInfo(model)` - Update name, phone, email, specialty
- `ChangePassword(model)` - Verify current password, set new (min 8 chars)
- `UploadProfilePhoto(photo)` - Upload photo (JPG/PNG/GIF/WEBP, max 5MB), store in `wwwroot/uploads/profiles/`

---

## Database Schema

### Entities

**Staff**
- PK: `ID`, Unique: `Username`, `Email`
- Relationships: `AttendanceLogs`, `ClinicalNotes`, `Schedules`, `Medications` (AdministeredBy, nullable)
- Status: `Active`, `Inactive`, `OnLeave`

**Patient**
- PK: `ID`, Unique: `Code`
- Relationships: `Room` (1:1, nullable), `Vitals`, `Medications`, `ClinicalNotes`
- Gender: `Male`, `Female`, `Other`

**Room**
- PK: `ID`, Unique: `Number`
- Relationships: `Patient` (1:1, nullable, circular reference)
- Status: `Available`, `Occupied`, `Cleaning`

**Vitals**
- PK: `ID`, FK: `PatientID` (Restrict delete)
- Index: `(PatientID, RecordedAt)`

**Medication**
- PK: `Id`, FK: `PatientID` (Restrict), `AdministeredBy` (SetNull)
- Status: `Scheduled`, `Given`, `Cancelled`

**ClinicalNotes**
- PK: `ID`, FK: `PatientID` (Restrict), `AuthorId` (Restrict)

**AttendanceLog**
- PK: `ID`, FK: `StaffID` (Restrict)
- Index: `(StaffID, CheckInTime)`
- Status: `OnDuty`, `OffDuty`

**Schedule**
- PK: `Id`, FK: `StaffID` (Restrict)
- Index: `(Date, ShiftType, StaffID)`
- ShiftType: `Morning`, `Evening`, `Night`

### Circular Dependency

`Patient.RoomId` ↔ `Room.PatientID` - Resolved by creating both tables first, then adding FK constraints via `ALTER TABLE`.

### Delete Behaviors
- **Restrict**: Prevents deletion if related records exist (Vitals, Medications, ClinicalNotes, AttendanceLogs, Schedules)
- **SetNull**: Sets FK to NULL on deletion (Medications.AdministeredBy)
- **Cascade**: Manual deletion in code (Staff deletion removes related records)

---

## Role-Based Access Control

### Roles

**Admin**: Full access to all features

**Doctor**: 
- ✅ View/Edit patients, add notes, record vitals
- ✅ Create medication orders, manage schedules
- ❌ Cannot add/delete patients, manage rooms/staff, view reports

**Nurse**:
- ✅ View patients, add notes, record vitals
- ✅ Mark medications as given, evacuate rooms, mark rooms available
- ✅ View schedules (read-only)
- ❌ Cannot edit patients, create medication orders, manage schedules/rooms/staff

### Access Matrix

| Feature | Admin | Doctor | Nurse |
|---------|-------|--------|-------|
| Add Patient | ✅ | ❌ | ❌ |
| Edit Patient | ✅ | ✅ | ❌ |
| Delete Patient | ✅ | ❌ | ❌ |
| Add Room | ✅ | ❌ | ❌ |
| Assign Patient | ✅ | ❌ | ❌ |
| Evacuate Room | ✅ | ❌ | ✅ |
| Manage Staff | ✅ | ❌ | ❌ |
| Create Schedule | ✅ | ✅ | ❌ |
| Create Medication | ✅ | ✅ | ❌ |
| View Reports | ✅ | ❌ | ❌ |

---

## Key Technical Details

### Password Security
- **Algorithm**: PBKDF2 with HMAC-SHA256 (via ASP.NET Core Identity Password Hasher)
- **Storage**: Only hashed passwords, never plain text
- **Verification**: `VerifyHashedPassword()` compares securely

### OTP System
- **Generation**: 6-digit random (100000-999999)
- **Storage**: Memory cache (10-min expiry)
- **Keys**: `register-otp:{email}`, `register-verified:{email}` (15-min expiry)
- **Email**: SMTP via configured service

### Room-Patient Assignment
Circular relationship maintained:
- Assign: Set `Patient.RoomId` and `Room.PatientID`, set room `Occupied`
- Evacuate: Set both to NULL, set room `Available`

### Attendance Tracking
- Check-in: Create `AttendanceLog` with `OnDuty`, set staff `Active`
- Check-out: Set `CheckOutTime`, status `OffDuty`, staff `Inactive`
- Dashboard: Shows staff with active logs (no checkout time)

### File Upload
- **Location**: `wwwroot/uploads/profiles/`
- **Naming**: `profile_{staffId}_{timestamp}.{ext}`
- **Validation**: JPG/PNG/GIF/WEBP, max 5MB
- **Cleanup**: Old photo deleted on new upload

### Configuration

**Connection String** (`appsettings.json`):
```json
"DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ShefaaICU;Trusted_Connection=True;"
```

**SMTP** (`appsettings.json`):
```json
"Smtp": {
  "Host": "smtp.gmail.com",
  "Port": 587,
  "User": "email@gmail.com",
  "Password": "app-password",
  "From": "email@gmail.com"
}
```

### Database Setup
- **Migrations**: EF Core Migrations for schema updates
- **Scripts**: DDL and DML scripts in `Data/` folder
- **Execution**: DDL first (tables), then DML (data), handles circular dependencies

---

## Common Questions

**Q: How are roles checked?**
A: Roles stored in `Staff.Role` field, added to auth cookie as `ClaimTypes.Role`. Server-side: `[Authorize(Roles = "...")]`. UI: `User.IsInRole("RoleName")`.

**Q: How does room assignment work?**
A: Both `Patient.RoomId` and `Room.PatientID` are set/cleared together to maintain circular relationship integrity.

**Q: What happens when patient is deleted?**
A: Room is freed (set to Available), but deletion fails if patient has Vitals/Medications/Notes due to Restrict delete behavior. Consider soft delete (set DischargeDate) instead.

**Q: How are dashboard stats calculated?**
A: Real-time queries: `Count()`, `Where()` filters, date calculations. Falls back to default values if DB fails.

**Q: How does medication tracking work?**
A: Order created with status `Scheduled` → Staff marks `Given` (records timestamp/staff) or `Cancelled`.

**Q: What's the difference between Staff Status and Attendance Status?**
A: Staff Status (`Active`/`Inactive`/`OnLeave`) is overall status. Attendance Status (`OnDuty`/`OffDuty`) is current shift status.
