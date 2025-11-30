# SQL Scripts Documentation

This directory contains SQL scripts to set up the Shefaa ICU Management System database.

## Scripts Overview

### 1. `Complete_Database_Setup.sql`
Creates the database. Run this first.

### 2. `DDL_Script.sql` (Data Definition Language)
Creates all tables, indexes, constraints, and foreign keys. Run this second.

### 3. `DML_Script.sql` (Data Manipulation Language)
Inserts sample data for testing. Run this third.

## Execution Order

**IMPORTANT:** Execute scripts in this exact order:

1. **Complete_Database_Setup.sql** - Creates the database
2. **DDL_Script.sql** - Creates schema (tables, constraints, indexes)
3. **DML_Script.sql** - Inserts sample data

## Quick Start

### Option 1: Using SQL Server Management Studio (SSMS)

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Open `Complete_Database_Setup.sql` and execute
4. Open `DDL_Script.sql` and execute
5. Open `DML_Script.sql` and execute

### Option 2: Using sqlcmd

```bash
sqlcmd -S YourServer -i Complete_Database_Setup.sql
sqlcmd -S YourServer -i DDL_Script.sql
sqlcmd -S YourServer -i DML_Script.sql
```

### Option 3: Using Azure Data Studio

1. Connect to your SQL Server
2. Open each script file
3. Execute in order: Complete_Database_Setup → DDL → DML

## Database Schema

### Tables Created (in dependency order):

1. **Staff** - Staff members (no dependencies)
2. **Rooms** - ICU rooms (no dependencies)
3. **Patients** - Patient records (depends on Rooms)
4. **Vitals** - Patient vital signs (depends on Patients)
5. **Medications** - Medication records (depends on Patients, Staff)
6. **ClinicalNotes** - Clinical notes (depends on Patients, Staff)
7. **AttendanceLogs** - Staff attendance (depends on Staff)
8. **Schedules** - Staff schedules (depends on Staff)

## Sample Data

The DML script includes:
- 9 Staff members (1 Admin, 4 Doctors, 4 Nurses)
- 10 Rooms
- 10 Patients
- 10 Attendance logs
- 10 Schedules
- 10 Vitals records
- 10 Medications
- 10 Clinical notes

## Default Login Credentials

After running the scripts, you can login with:
- **Username:** `admin`
- **Password:** `Password123!`

## Notes

- All foreign key constraints are properly configured
- Identity columns are reset in DML script
- Circular dependency between Rooms and Patients is handled correctly
- All indexes are created for optimal performance

