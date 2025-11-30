-- ============================================
-- Shefaa ICU Management System
-- DDL Script - Database Schema Creation
-- Execute this script first to create all tables
-- ============================================

USE [ShefaaICU];
GO

-- ============================================
-- STEP 1: Drop existing tables (if any)
-- Execute in reverse dependency order
-- ============================================
IF OBJECT_ID('ClinicalNotes', 'U') IS NOT NULL DROP TABLE ClinicalNotes;
IF OBJECT_ID('Medications', 'U') IS NOT NULL DROP TABLE Medications;
IF OBJECT_ID('Vitals', 'U') IS NOT NULL DROP TABLE Vitals;
IF OBJECT_ID('Schedules', 'U') IS NOT NULL DROP TABLE Schedules;
IF OBJECT_ID('AttendanceLogs', 'U') IS NOT NULL DROP TABLE AttendanceLogs;
IF OBJECT_ID('Patients', 'U') IS NOT NULL DROP TABLE Patients;
IF OBJECT_ID('Rooms', 'U') IS NOT NULL DROP TABLE Rooms;
IF OBJECT_ID('Staff', 'U') IS NOT NULL DROP TABLE Staff;
GO

-- ============================================
-- STEP 2: Create Tables (No Dependencies First)
-- ============================================

-- Staff Table (No dependencies)
CREATE TABLE Staff (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Role NVARCHAR(50) NOT NULL,
    Specialty NVARCHAR(200) NULL,
    PhoneNumber NVARCHAR(50) NULL,
    Email NVARCHAR(200) NULL,
    ProfilePhotoPath NVARCHAR(500) NULL,
    Status INT NULL, -- 0=Active, 1=Inactive, 2=OnLeave
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT UQ_Staff_Username UNIQUE (Username),
    CONSTRAINT UQ_Staff_Email UNIQUE (Email)
);
GO

-- Rooms Table (No dependencies)
CREATE TABLE Rooms (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Number NVARCHAR(50) NOT NULL,
    Status INT NOT NULL DEFAULT 0, -- 0=Available, 1=Occupied, 2=Cleaning
    Notes NVARCHAR(MAX) NULL,
    PatientID INT NULL,
    
    CONSTRAINT UQ_Rooms_Number UNIQUE (Number)
);
GO

-- ============================================
-- STEP 3: Create Tables with Dependencies
-- ============================================

-- Patients Table (Depends on Rooms - but RoomId is nullable)
-- Note: Foreign key will be added after both tables exist
CREATE TABLE Patients (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL DEFAULT 'Unknown',
    Age INT NULL,
    Gender INT NULL, -- 0=Male, 1=Female, 2=Other
    RoomId INT NULL,
    AdmissionDate DATETIME NOT NULL,
    DischargeDate DATETIME NULL,
    Condition NVARCHAR(100) NULL,
    Complaint NVARCHAR(MAX) NULL,
    MedicalHistory NVARCHAR(MAX) NULL,
    Diagnosis NVARCHAR(MAX) NULL,
    Treatment NVARCHAR(MAX) NULL,
    EmergencyContact NVARCHAR(500) NULL,
    
    CONSTRAINT UQ_Patients_Code UNIQUE (Code)
);
GO

-- Add foreign keys for circular dependency (Rooms <-> Patients)
-- Patients -> Rooms
ALTER TABLE Patients
ADD CONSTRAINT FK_Patients_Rooms FOREIGN KEY (RoomId) 
    REFERENCES Rooms(ID) ON DELETE SET NULL;
GO

-- Rooms -> Patients (one-to-one relationship)
ALTER TABLE Rooms
ADD CONSTRAINT FK_Rooms_Patients FOREIGN KEY (PatientID) 
    REFERENCES Patients(ID) ON DELETE SET NULL;
GO

-- Vitals Table (Depends on Patients)
CREATE TABLE Vitals (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    PatientID INT NOT NULL,
    RecordedAt DATETIME NOT NULL,
    BP NVARCHAR(50) NULL,
    BloodPressureSystolic INT NULL,
    BloodPressureDiastolic INT NULL,
    Temperature FLOAT NULL,
    Pulse INT NULL,
    SpO2 INT NULL,
    RespiratoryRate INT NULL,
    
    CONSTRAINT FK_Vitals_Patients FOREIGN KEY (PatientID) 
        REFERENCES Patients(ID) ON DELETE RESTRICT
);
GO

-- Medications Table (Depends on Patients and Staff)
CREATE TABLE Medications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PatientID INT NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Dose NVARCHAR(100) NULL,
    Frequency NVARCHAR(100) NULL,
    ScheduledTime DATETIME NULL,
    Status INT NOT NULL DEFAULT 0, -- 0=Scheduled, 1=Given, 2=Cancelled
    AdministeredBy INT NULL,
    AdministeredAt DATETIME NULL,
    
    CONSTRAINT FK_Medications_Patients FOREIGN KEY (PatientID) 
        REFERENCES Patients(ID) ON DELETE RESTRICT,
    CONSTRAINT FK_Medications_Staff FOREIGN KEY (AdministeredBy) 
        REFERENCES Staff(ID) ON DELETE SET NULL
);
GO

-- ClinicalNotes Table (Depends on Patients and Staff)
CREATE TABLE ClinicalNotes (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    PatientID INT NOT NULL,
    AuthorId INT NOT NULL,
    Timestamp DATETIME NOT NULL,
    Text NVARCHAR(MAX) NOT NULL,
    
    CONSTRAINT FK_ClinicalNotes_Patients FOREIGN KEY (PatientID) 
        REFERENCES Patients(ID) ON DELETE RESTRICT,
    CONSTRAINT FK_ClinicalNotes_Staff FOREIGN KEY (AuthorId) 
        REFERENCES Staff(ID) ON DELETE RESTRICT
);
GO

-- AttendanceLogs Table (Depends on Staff)
CREATE TABLE AttendanceLogs (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    StaffID INT NOT NULL,
    CheckInTime DATETIME NOT NULL,
    CheckOutTime DATETIME NULL,
    Status INT NOT NULL DEFAULT 0, -- 0=OnDuty, 1=OffDuty
    
    CONSTRAINT FK_AttendanceLogs_Staff FOREIGN KEY (StaffID) 
        REFERENCES Staff(ID) ON DELETE RESTRICT
);
GO

-- Schedules Table (Depends on Staff)
CREATE TABLE Schedules (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Date DATETIME NOT NULL,
    ShiftType INT NOT NULL, -- 0=Morning, 1=Evening, 2=Night
    StaffID INT NOT NULL,
    Notes NVARCHAR(MAX) NULL,
    
    CONSTRAINT FK_Schedules_Staff FOREIGN KEY (StaffID) 
        REFERENCES Staff(ID) ON DELETE RESTRICT
);
GO

-- ============================================
-- STEP 4: Create Indexes for Performance
-- ============================================

-- Vitals Indexes
CREATE NONCLUSTERED INDEX IX_Vitals_PatientID_RecordedAt 
    ON Vitals(PatientID, RecordedAt);
GO

-- Medications Indexes
CREATE NONCLUSTERED INDEX IX_Medications_PatientID 
    ON Medications(PatientID);
GO

-- AttendanceLogs Indexes
CREATE NONCLUSTERED INDEX IX_AttendanceLogs_StaffID_CheckInTime 
    ON AttendanceLogs(StaffID, CheckInTime);
GO

-- Schedules Indexes
CREATE NONCLUSTERED INDEX IX_Schedules_Date_ShiftType_StaffID 
    ON Schedules(Date, ShiftType, StaffID);
GO

-- ============================================
-- DDL Script Completed Successfully
-- ============================================
PRINT 'Database schema created successfully!';
GO

