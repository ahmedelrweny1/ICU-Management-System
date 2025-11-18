-- ============================================
-- ICU Management System - Dummy Data Script
-- 10 records per table, ordered by dependencies
-- ============================================

-- STEP 1: Staff (no dependencies)
-- ============================================
SET IDENTITY_INSERT Staff ON;

INSERT INTO Staff (ID, Username, PasswordHash, Name, Role, Specialty, PhoneNumber, Email, Status, CreatedAt)
VALUES
(1, 'admin', '$2a$11$K7L1OJ45/4Y2nIvhRVxCe.swSmGIdZlDx29Lano4hcB8f19AhUJ8S', 'Dr. Sarah Johnson', 'Admin', 'Administration', '+1-555-0101', 'sarah.johnson@shefaa.com', 0, '2024-01-15 08:00:00'),
(2, 'doc001', '$2a$11$K7L1OJ45/4Y2nIvhRVxCe.swSmGIdZlDx29Lano4hcB8f19AhUJ8S', 'Dr. Michael Chen', 'Doctor', 'Cardiologist', '+1-555-0102', 'michael.chen@shefaa.com', 0, '2024-01-15 08:00:00'),
(3, 'doc002', '$2a$11$K7L1OJ45/4Y2nIvhRVxCe.swSmGIdZlDx29Lano4hcB8f19AhUJ8S', 'Dr. Emily Rodriguez', 'Doctor', 'Pulmonologist', '+1-555-0103', 'emily.rodriguez@shefaa.com', 0, '2024-01-15 08:00:00'),
(4, 'doc003', '$2a$11$K7L1OJ45/4Y2nIvhRVxCe.swSmGIdZlDx29Lano4hcB8f19AhUJ8S', 'Dr. James Wilson', 'Doctor', 'Intensivist', '+1-555-0104', 'james.wilson@shefaa.com', 0, '2024-01-15 08:00:00'),
(5, 'nurse001', '$2a$11$K7L1OJ45/4Y2nIvhRVxCe.swSmGIdZlDx29Lano4hcB8f19AhUJ8S', 'Nurse Patricia Brown', 'Nurse', 'ICU Specialist', '+1-555-0105', 'patricia.brown@shefaa.com', 0, '2024-01-15 08:00:00'),
(6, 'nurse002', '$2a$11$K7L1OJ45/4Y2nIvhRVxCe.swSmGIdZlDx29Lano4hcB8f19AhUJ8S', 'Nurse Robert Taylor', 'Nurse', 'Critical Care', '+1-555-0106', 'robert.taylor@shefaa.com', 0, '2024-01-15 08:00:00'),
(7, 'nurse003', '$2a$11$K7L1OJ45/4Y2nIvhRVxCe.swSmGIdZlDx29Lano4hcB8f19AhUJ8S', 'Nurse Lisa Anderson', 'Nurse', 'Emergency Care', '+1-555-0107', 'lisa.anderson@shefaa.com', 0, '2024-01-15 08:00:00'),
(8, 'tech001', '$2a$11$K7L1OJ45/4Y2nIvhRVxCe.swSmGIdZlDx29Lano4hcB8f19AhUJ8S', 'David Martinez', 'Technician', 'Medical Equipment', '+1-555-0108', 'david.martinez@shefaa.com', 0, '2024-01-15 08:00:00'),
(9, 'doc004', '$2a$11$K7L1OJ45/4Y2nIvhRVxCe.swSmGIdZlDx29Lano4hcB8f19AhUJ8S', 'Dr. Jennifer Lee', 'Doctor', 'Neurologist', '+1-555-0109', 'jennifer.lee@shefaa.com', 0, '2024-01-15 08:00:00'),
(10, 'nurse004', '$2a$11$K7L1OJ45/4Y2nIvhRVxCe.swSmGIdZlDx29Lano4hcB8f19AhUJ8S', 'Nurse Thomas White', 'Nurse', 'Trauma Care', '+1-555-0110', 'thomas.white@shefaa.com', 0, '2024-01-15 08:00:00');

SET IDENTITY_INSERT Staff OFF;

-- STEP 2: Rooms (no dependencies)
-- ============================================
SET IDENTITY_INSERT Rooms ON;

INSERT INTO Rooms (ID, Number, Status, Notes, PatientID)
VALUES
(1, 'ICU-101', 1, 'Main ICU room, fully equipped', NULL),
(2, 'ICU-102', 1, 'Standard ICU room', NULL),
(3, 'ICU-103', 1, 'Isolation capable', NULL),
(4, 'ICU-104', 1, 'Standard ICU room', NULL),
(5, 'ICU-105', 0, 'Available for admission', NULL),
(6, 'ICU-106', 0, 'Available for admission', NULL),
(7, 'ICU-107', 1, 'Standard ICU room', NULL),
(8, 'ICU-108', 1, 'Standard ICU room', NULL),
(9, 'ICU-109', 2, 'Under cleaning', NULL),
(10, 'ICU-110', 0, 'Available for admission', NULL);

SET IDENTITY_INSERT Rooms OFF;

-- STEP 3: Patients (depends on Rooms)
-- ============================================
SET IDENTITY_INSERT Patients ON;

INSERT INTO Patients (ID, Code, Name, Age, Gender, RoomId, AdmissionDate, DischargeDate, Condition, Complaint, MedicalHistory, Diagnosis, Treatment, EmergencyContact)
VALUES
(1, 'P00001', 'John Smith', 65, 0, 1, '2024-01-20 14:30:00', NULL, 'Critical', 'Severe chest pain and shortness of breath', 'Hypertension, Type 2 Diabetes, Previous MI in 2020', 'Acute Myocardial Infarction (STEMI)', 'Dual antiplatelet therapy, Beta-blockers, Statins, Cardiac monitoring', 'Mary Smith - +1-555-1001'),
(2, 'P00002', 'Maria Garcia', 58, 1, 2, '2024-01-21 09:15:00', NULL, 'Moderate', 'Respiratory distress, productive cough', 'COPD for 12 years, Ex-smoker', 'Acute exacerbation of COPD with pneumonia', 'Oxygen therapy, Bronchodilators, Antibiotics (Levofloxacin)', 'Carlos Garcia - +1-555-1002'),
(3, 'P00003', 'Robert Johnson', 72, 0, 3, '2024-01-22 16:45:00', NULL, 'Stable', 'Post-operative monitoring after emergency surgery', 'No significant medical history', 'Post-operative care - Appendectomy', 'IV antibiotics, Pain management, Wound care', 'Linda Johnson - +1-555-1003'),
(4, 'P00004', 'Sarah Williams', 45, 1, 4, '2024-01-23 11:20:00', NULL, 'Moderate', 'Severe headache, photophobia, nausea', 'History of migraines since age 20', 'Status Migrainosus', 'IV hydration, Antiemetics, Pain management, Magnesium sulfate', 'David Williams - +1-555-1004'),
(5, 'P00005', 'Michael Brown', 80, 0, 7, '2024-01-24 08:00:00', NULL, 'Critical', 'Altered mental status, fever', 'Dementia, Hypertension', 'Severe Sepsis with Septic Shock', 'Broad-spectrum antibiotics, Vasopressors, Fluid resuscitation', 'Elizabeth Brown - +1-555-1005'),
(6, 'P00006', 'Jennifer Davis', 35, 1, 8, '2024-01-25 13:30:00', NULL, 'Stable', 'Post-operative monitoring', 'Asthma, Allergic rhinitis', 'Post-operative care - Cholecystectomy', 'IV antibiotics, Pain management, Respiratory support', 'Mark Davis - +1-555-1006'),
(7, 'P00007', 'David Miller', 55, 0, NULL, '2024-01-26 10:15:00', NULL, 'Moderate', 'Acute kidney injury, decreased urine output', 'Type 2 Diabetes, Hypertension', 'Acute Kidney Injury (AKI) Stage 3', 'Fluid management, Electrolyte correction, Renal replacement therapy if needed', 'Susan Miller - +1-555-1007'),
(8, 'P00008', 'Lisa Wilson', 42, 1, NULL, '2024-01-27 15:45:00', NULL, 'Stable', 'Post-operative monitoring', 'No significant medical history', 'Post-operative care - Hysterectomy', 'IV antibiotics, Pain management, Wound care', 'James Wilson - +1-555-1008'),
(9, 'P00009', 'Christopher Moore', 68, 0, NULL, '2024-01-28 07:20:00', NULL, 'Critical', 'Acute stroke symptoms, left hemiparesis', 'Atrial Fibrillation, Hypertension, Hyperlipidemia', 'Acute Ischemic Stroke', 'Thrombolytic therapy, Antiplatelet agents, Blood pressure management', 'Patricia Moore - +1-555-1009'),
(10, 'P00010', 'Amanda Taylor', 29, 1, NULL, '2024-01-29 12:00:00', NULL, 'Moderate', 'Severe asthma exacerbation', 'Asthma since childhood, Allergic to pollen', 'Status Asthmaticus', 'High-dose bronchodilators, Systemic corticosteroids, Oxygen therapy', 'Robert Taylor - +1-555-1010');

SET IDENTITY_INSERT Patients OFF;

-- Update Rooms with PatientID (for rooms that have patients)
UPDATE Rooms SET PatientID = 1 WHERE ID = 1;
UPDATE Rooms SET Status = 1 WHERE ID = 1;
UPDATE Rooms SET PatientID = 2 WHERE ID = 2;
UPDATE Rooms SET Status = 1 WHERE ID = 2;
UPDATE Rooms SET PatientID = 3 WHERE ID = 3;
UPDATE Rooms SET Status = 1 WHERE ID = 3;
UPDATE Rooms SET PatientID = 4 WHERE ID = 4;
UPDATE Rooms SET Status = 1 WHERE ID = 4;
UPDATE Rooms SET PatientID = 5 WHERE ID = 7;
UPDATE Rooms SET Status = 1 WHERE ID = 7;
UPDATE Rooms SET PatientID = 6 WHERE ID = 8;
UPDATE Rooms SET Status = 1 WHERE ID = 8;

-- STEP 4: AttendanceLog (depends on Staff)
-- ============================================
SET IDENTITY_INSERT AttendanceLogs ON;

INSERT INTO AttendanceLogs (ID, StaffID, CheckInTime, CheckOutTime, Status)
VALUES
(1, 2, '2024-01-30 08:00:00', NULL, 0),
(2, 3, '2024-01-30 08:00:00', NULL, 0),
(3, 4, '2024-01-30 08:00:00', NULL, 0),
(4, 5, '2024-01-30 08:00:00', NULL, 0),
(5, 6, '2024-01-30 08:00:00', '2024-01-30 16:00:00', 1),
(6, 7, '2024-01-30 16:00:00', NULL, 0),
(7, 9, '2024-01-30 08:00:00', NULL, 0),
(8, 10, '2024-01-30 16:00:00', NULL, 0),
(9, 2, '2024-01-29 08:00:00', '2024-01-29 16:00:00', 1),
(10, 5, '2024-01-29 08:00:00', '2024-01-29 16:00:00', 1);

SET IDENTITY_INSERT AttendanceLogs OFF;

-- STEP 5: Schedule (depends on Staff)
-- ============================================
SET IDENTITY_INSERT Schedules ON;

INSERT INTO Schedules (Id, Date, ShiftType, StaffID, Notes)
VALUES
(1, '2024-02-01', 0, 2, 'Morning shift - Cardiology rounds'),
(2, '2024-02-01', 0, 3, 'Morning shift - Pulmonary rounds'),
(3, '2024-02-01', 0, 4, 'Morning shift - ICU coverage'),
(4, '2024-02-01', 0, 5, 'Morning shift - Primary nurse'),
(5, '2024-02-01', 0, 6, 'Morning shift - Secondary nurse'),
(6, '2024-02-01', 1, 7, 'Evening shift - Primary nurse'),
(8, '2024-02-01', 1, 9, 'Evening shift - Neurology rounds'),
(9, '2024-02-01', 2, 6, 'Night shift - On-call nurse'),
(10, '2024-02-01', 2, 10, 'Night shift - Trauma care');

SET IDENTITY_INSERT Schedules OFF;

-- STEP 6: Vitals (depends on Patients)
-- ============================================
SET IDENTITY_INSERT Vitals ON;

INSERT INTO Vitals (ID, PatientID, RecordedAt, BP, BloodPressureSystolic, BloodPressureDiastolic, Temperature, Pulse, SpO2, RespiratoryRate)
VALUES
(1, 1, '2024-01-30 08:00:00', '145/92', 145, 92, 98.2, 88, 94, 18),
(2, 1, '2024-01-30 12:00:00', '142/90', 142, 90, 98.4, 85, 95, 16),
(3, 2, '2024-01-30 08:00:00', '132/84', 132, 84, 99.1, 76, 92, 22),
(4, 2, '2024-01-30 14:00:00', '130/82', 130, 82, 98.8, 74, 93, 20),
(5, 3, '2024-01-30 08:00:00', '118/76', 118, 76, 98.6, 68, 98, 16),
(6, 4, '2024-01-30 09:00:00', '110/70', 110, 70, 98.4, 72, 99, 14),
(7, 5, '2024-01-30 08:00:00', '95/60', 95, 60, 101.2, 110, 88, 24),
(8, 5, '2024-01-30 12:00:00', '98/65', 98, 65, 100.8, 105, 90, 22),
(9, 6, '2024-01-30 08:00:00', '120/78', 120, 78, 98.5, 70, 97, 16),
(10, 7, '2024-01-30 10:00:00', '125/80', 125, 80, 98.7, 75, 96, 18);

SET IDENTITY_INSERT Vitals OFF;

-- STEP 7: Medication (depends on Patients and Staff)
-- ============================================
SET IDENTITY_INSERT Medications ON;

INSERT INTO Medications (Id, PatientID, Name, Dose, Frequency, ScheduledTime, Status, AdministeredBy, AdministeredAt)
VALUES
(1, 1, 'Aspirin', '325mg', 'Once daily', '2024-01-30 08:00:00', 1, 5, '2024-01-30 08:05:00'),
(2, 1, 'Clopidogrel', '75mg', 'Once daily', '2024-01-30 08:00:00', 1, 5, '2024-01-30 08:05:00'),
(3, 1, 'Atorvastatin', '80mg', 'Once daily', '2024-01-30 20:00:00', 0, NULL, NULL),
(4, 2, 'Albuterol', '2.5mg', 'Every 4 hours', '2024-01-30 08:00:00', 1, 6, '2024-01-30 08:10:00'),
(5, 2, 'Levofloxacin', '750mg', 'Once daily', '2024-01-30 09:00:00', 1, 6, '2024-01-30 09:05:00'),
(6, 3, 'Ceftriaxone', '2g', 'Every 12 hours', '2024-01-30 08:00:00', 1, 7, '2024-01-30 08:15:00'),
(7, 4, 'Sumatriptan', '6mg', 'As needed', '2024-01-30 09:00:00', 1, 5, '2024-01-30 09:20:00'),
(8, 5, 'Norepinephrine', '0.1 mcg/kg/min', 'Continuous IV', '2024-01-30 08:00:00', 1, 4, '2024-01-30 08:00:00'),
(9, 6, 'Morphine', '4mg', 'Every 4 hours PRN', '2024-01-30 10:00:00', 1, 6, '2024-01-30 10:05:00'),
(10, 7, 'Furosemide', '40mg', 'Twice daily', '2024-01-30 08:00:00', 0, NULL, NULL);

SET IDENTITY_INSERT Medications OFF;

-- STEP 8: ClinicalNotes (depends on Patients and Staff)
-- ============================================
SET IDENTITY_INSERT ClinicalNotes ON;

INSERT INTO ClinicalNotes (ID, PatientID, AuthorId, Timestamp, Text)
VALUES
(1, 1, 2, '2024-01-30 08:30:00', 'Patient admitted with chest pain. ECG shows ST elevation. Started on dual antiplatelet therapy. Vital signs stable.'),
(2, 1, 5, '2024-01-30 14:00:00', 'Vitals stable. Patient reports reduced chest pain. Oxygen saturation improving. Continue monitoring.'),
(3, 2, 3, '2024-01-30 09:00:00', 'Patient improving with treatment. Oxygen saturation stable on 4L O2. Continue bronchodilators and antibiotics.'),
(4, 3, 4, '2024-01-30 10:00:00', 'Post-operative patient stable. Wound healing well. No signs of infection. Continue IV antibiotics.'),
(5, 4, 2, '2024-01-30 09:30:00', 'Migraine symptoms improving with treatment. Patient reports decreased headache intensity. Continue current management.'),
(6, 5, 4, '2024-01-30 08:45:00', 'Critical patient with septic shock. Started on vasopressors. Blood pressure responding. Continue aggressive fluid resuscitation.'),
(7, 5, 5, '2024-01-30 12:30:00', 'Patient condition improving. Blood pressure stabilized. Reducing vasopressor support gradually.'),
(8, 6, 4, '2024-01-30 11:00:00', 'Post-operative patient stable. Pain well controlled. Continue current management plan.'),
(9, 7, 2, '2024-01-30 10:30:00', 'AKI patient. Urine output improving. Continue fluid management and monitor renal function closely.'),
(10, 9, 9, '2024-01-30 08:00:00', 'Acute stroke patient. Thrombolytic therapy administered. Monitoring for improvement in neurological status.');

SET IDENTITY_INSERT ClinicalNotes OFF;

-- ============================================
-- Script completed successfully!
-- Total: 10 records per table (80 records total)
-- ============================================