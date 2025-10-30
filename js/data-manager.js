// ===================================
// Shefaa - ICU Management System
// Data Manager - Designed for easy ASP.NET MVC API integration
// ===================================

/* 
   NOTE FOR ASP.NET MVC INTEGRATION:
   Replace localStorage calls with fetch() API calls to your controllers
   Example:
   Instead of: localStorage.getItem('patients')
   Use: fetch('/api/patients/getall')
*/

const DataManager = {
    // ===================================
    // Initialize Sample Data
    // ===================================
    initializeData() {
        if (!localStorage.getItem('initialized')) {
            this.createSampleData();
            localStorage.setItem('initialized', 'true');
        }
    },

    createSampleData() {
        // Sample Rooms
        const rooms = [
            { id: 101, status: 'Occupied', patientId: 'P12345' },
            { id: 102, status: 'Occupied', patientId: 'P67890' },
            { id: 103, status: 'Occupied', patientId: 'P11223' },
            { id: 104, status: 'Occupied', patientId: 'P45678' },
            { id: 105, status: 'Available', patientId: null },
            { id: 106, status: 'Available', patientId: null }
        ];
        localStorage.setItem('rooms', JSON.stringify(rooms));

        // Sample Patients
        const patients = [
            {
                id: 'P12345',
                name: 'John Doe',
                age: 56,
                gender: 'Male',
                room: 'ICU-101',
                admissionDate: '2023-10-26',
                condition: 'Critical',
                complaint: 'Acute chest pain, shortness of breath',
                history: 'Hypertension for 10 years, Type 2 Diabetes, Previous MI in 2018',
                diagnosis: 'NSTEMI (Non-ST Elevation Myocardial Infarction), Acute Coronary Syndrome',
                treatment: 'Dual antiplatelet therapy, Beta-blockers, Statins, Close monitoring, Scheduled for cardiac catheterization',
                vitals: { bp: '145/92', temp: '98.2', pulse: '88', spo2: '94' },
                emergencyContact: 'Sarah Doe - 555-123-4567',
                drugs: [
                    { name: 'Aspirin', dose: '325mg', frequency: 'Once daily', time: '08:00', status: 'Given' },
                    { name: 'Clopidogrel', dose: '75mg', frequency: 'Once daily', time: '08:00', status: 'Given' },
                    { name: 'Atorvastatin', dose: '80mg', frequency: 'Once daily', time: '20:00', status: 'Pending' },
                    { name: 'Metoprolol', dose: '25mg', frequency: 'Twice daily', time: '08:00', status: 'Given' }
                ],
                notes: [
                    { date: '2023-10-26 08:30', author: 'Dr. James Wilson', note: 'Patient admitted with chest pain. ECG shows ST depression. Started on dual antiplatelet therapy.' },
                    { date: '2023-10-26 14:00', author: 'Nurse Emily', note: 'Vitals stable. Patient reports reduced chest pain. Oxygen saturation improving.' }
                ]
            },
            {
                id: 'P67890',
                name: 'Jane Smith',
                age: 72,
                gender: 'Female',
                room: 'ICU-102',
                admissionDate: '2023-10-25',
                condition: 'Stable',
                complaint: 'Severe respiratory distress, productive cough',
                history: 'COPD for 15 years, Ex-smoker (quit 5 years ago), Recurrent pneumonia',
                diagnosis: 'Acute exacerbation of COPD with pneumonia',
                treatment: 'Oxygen therapy, Bronchodilators, Antibiotics (Levofloxacin), Corticosteroids',
                vitals: { bp: '132/84', temp: '99.1', pulse: '76', spo2: '92' },
                emergencyContact: 'Robert Smith - 555-987-6543',
                drugs: [
                    { name: 'Albuterol', dose: '2.5mg', frequency: 'Every 4 hours', time: '08:00', status: 'Given' },
                    { name: 'Levofloxacin', dose: '750mg', frequency: 'Once daily', time: '09:00', status: 'Given' }
                ],
                notes: [
                    { date: '2023-10-25 10:00', author: 'Dr. Sarah Lee', note: 'Patient improving with treatment. Oxygen saturation stable on 4L O2.' }
                ]
            },
            {
                id: 'P11223',
                name: 'Robert Johnson',
                age: 45,
                gender: 'Male',
                room: 'ICU-103',
                admissionDate: '2023-10-24',
                condition: 'Stable',
                complaint: 'Post-operative monitoring after emergency appendectomy',
                history: 'No significant medical history',
                diagnosis: 'Acute appendicitis with perforation (Post-operative)',
                treatment: 'IV antibiotics, Pain management, Wound care, Monitoring for complications',
                vitals: { bp: '118/76', temp: '98.6', pulse: '68', spo2: '98' },
                emergencyContact: 'Mary Johnson - 555-456-7890',
                drugs: [
                    { name: 'Ceftriaxone', dose: '2g', frequency: 'Every 12 hours', time: '08:00', status: 'Given' },
                    { name: 'Morphine', dose: '4mg', frequency: 'Every 4 hours PRN', time: '10:00', status: 'Available' }
                ],
                notes: []
            },
            {
                id: 'P45678',
                name: 'Emily Williams',
                age: 34,
                gender: 'Female',
                room: 'ICU-104',
                admissionDate: '2023-10-23',
                condition: 'Moderate',
                complaint: 'Severe headache, photophobia, nausea',
                history: 'History of migraines since adolescence',
                diagnosis: 'Status Migrainosus (Prolonged migraine attack)',
                treatment: 'IV hydration, Antiemetics, Pain management, Magnesium sulfate',
                vitals: { bp: '110/70', temp: '98.4', pulse: '72', spo2: '99' },
                emergencyContact: 'David Williams - 555-234-5678',
                drugs: [
                    { name: 'Sumatriptan', dose: '6mg', frequency: 'As needed', time: '09:00', status: 'Given' },
                    { name: 'Ondansetron', dose: '4mg', frequency: 'Every 8 hours', time: '08:00', status: 'Given' }
                ],
                notes: []
            }
        ];
        localStorage.setItem('patients', JSON.stringify(patients));

        // Sample Staff
        const staff = [
            {
                id: 'S001',
                name: 'Dr. Emily Carter',
                role: 'Doctor',
                specialty: 'Cardiologist',
                phone: '+1 (123) 456-7890',
                email: 'emily.carter@icu.com',
                status: 'On Duty',
                checkInTime: '08:00',
                checkOutTime: null
            },
            {
                id: 'S002',
                name: 'John Smith',
                role: 'Nurse',
                specialty: 'ICU Specialist',
                phone: '+1 (234) 567-8901',
                email: 'john.smith@icu.com',
                status: 'Off Duty',
                checkInTime: null,
                checkOutTime: null
            },
            {
                id: 'S003',
                name: 'Maria Garcia',
                role: 'Technician',
                specialty: 'Medical Equipment',
                phone: '+1 (345) 678-9012',
                email: 'maria.garcia@icu.com',
                status: 'On Call',
                checkInTime: null,
                checkOutTime: null
            },
            {
                id: 'S004',
                name: 'David Chen',
                role: 'Nurse',
                specialty: 'Critical Care',
                phone: '+1 (456) 789-0123',
                email: 'david.chen@icu.com',
                status: 'On Duty',
                checkInTime: '08:00',
                checkOutTime: null
            },
            {
                id: 'S005',
                name: 'Dr. Sarah Wilson',
                role: 'Doctor',
                specialty: 'Pulmonologist',
                phone: '+1 (567) 890-1234',
                email: 'sarah.wilson@icu.com',
                status: 'Off Duty',
                checkInTime: null,
                checkOutTime: null
            }
        ];
        localStorage.setItem('staff', JSON.stringify(staff));

        // Sample Schedules
        const schedules = [
            {
                date: '2023-10-30',
                shift: 'Morning',
                staff: ['S001', 'S002', 'S004']
            },
            {
                date: '2023-10-30',
                shift: 'Evening',
                staff: ['S003', 'S005']
            },
            {
                date: '2023-10-30',
                shift: 'Night',
                staff: ['S002', 'S004']
            }
        ];
        localStorage.setItem('schedules', JSON.stringify(schedules));

        // Sample Activities
        const activities = [
            { time: '2 minutes ago', text: 'Patient P12345 vital signs updated' },
            { time: '15 minutes ago', text: 'Dr. Emily Carter checked in for shift' },
            { time: '1 hour ago', text: 'Room ICU-105 cleaned and marked available' },
            { time: '2 hours ago', text: 'New patient P45678 admitted to ICU-104' },
            { time: '3 hours ago', text: 'Medication administered to patient P67890' }
        ];
        localStorage.setItem('activities', JSON.stringify(activities));
    },

    // ===================================
    // Rooms CRUD Operations
    // ===================================
    getRooms() {
        // For ASP.NET MVC: return fetch('/api/rooms/getall').then(r => r.json());
        return JSON.parse(localStorage.getItem('rooms') || '[]');
    },

    getRoom(id) {
        // For ASP.NET MVC: return fetch(`/api/rooms/get/${id}`).then(r => r.json());
        const rooms = this.getRooms();
        return rooms.find(r => r.id == id);
    },

    updateRoom(id, updates) {
        // For ASP.NET MVC: return fetch('/api/rooms/update', { method: 'POST', body: JSON.stringify({id, ...updates}) });
        const rooms = this.getRooms();
        const index = rooms.findIndex(r => r.id == id);
        if (index !== -1) {
            rooms[index] = { ...rooms[index], ...updates };
            localStorage.setItem('rooms', JSON.stringify(rooms));
            return true;
        }
        return false;
    },

    addRoom(room) {
        // For ASP.NET MVC: return fetch('/api/rooms/create', { method: 'POST', body: JSON.stringify(room) });
        const rooms = this.getRooms();
        rooms.push(room);
        localStorage.setItem('rooms', JSON.stringify(rooms));
        return true;
    },

    // ===================================
    // Patients CRUD Operations
    // ===================================
    getPatients() {
        // For ASP.NET MVC: return fetch('/api/patients/getall').then(r => r.json());
        return JSON.parse(localStorage.getItem('patients') || '[]');
    },

    getPatient(id) {
        // For ASP.NET MVC: return fetch(`/api/patients/get/${id}`).then(r => r.json());
        const patients = this.getPatients();
        return patients.find(p => p.id === id);
    },

    addPatient(patient) {
        // For ASP.NET MVC: return fetch('/api/patients/create', { method: 'POST', body: JSON.stringify(patient) });
        const patients = this.getPatients();
        // Generate unique ID
        const newId = 'P' + Math.floor(10000 + Math.random() * 90000);
        patient.id = newId;
        patient.drugs = patient.drugs || [];
        patient.notes = patient.notes || [];
        patients.push(patient);
        localStorage.setItem('patients', JSON.stringify(patients));
        return newId;
    },

    updatePatient(id, updates) {
        // For ASP.NET MVC: return fetch('/api/patients/update', { method: 'POST', body: JSON.stringify({id, ...updates}) });
        const patients = this.getPatients();
        const index = patients.findIndex(p => p.id === id);
        if (index !== -1) {
            patients[index] = { ...patients[index], ...updates };
            localStorage.setItem('patients', JSON.stringify(patients));
            return true;
        }
        return false;
    },

    deletePatient(id) {
        // For ASP.NET MVC: return fetch(`/api/patients/delete/${id}`, { method: 'DELETE' });
        const patients = this.getPatients();
        const filtered = patients.filter(p => p.id !== id);
        localStorage.setItem('patients', JSON.stringify(filtered));
        return true;
    },

    // ===================================
    // Staff CRUD Operations
    // ===================================
    getStaff() {
        // For ASP.NET MVC: return fetch('/api/staff/getall').then(r => r.json());
        return JSON.parse(localStorage.getItem('staff') || '[]');
    },

    getStaffMember(id) {
        // For ASP.NET MVC: return fetch(`/api/staff/get/${id}`).then(r => r.json());
        const staff = this.getStaff();
        return staff.find(s => s.id === id);
    },

    addStaff(member) {
        // For ASP.NET MVC: return fetch('/api/staff/create', { method: 'POST', body: JSON.stringify(member) });
        const staff = this.getStaff();
        // Generate unique ID
        const newId = 'S' + String(staff.length + 1).padStart(3, '0');
        member.id = newId;
        member.status = member.status || 'Off Duty';
        staff.push(member);
        localStorage.setItem('staff', JSON.stringify(staff));
        return newId;
    },

    updateStaff(id, updates) {
        // For ASP.NET MVC: return fetch('/api/staff/update', { method: 'POST', body: JSON.stringify({id, ...updates}) });
        const staff = this.getStaff();
        const index = staff.findIndex(s => s.id === id);
        if (index !== -1) {
            staff[index] = { ...staff[index], ...updates };
            localStorage.setItem('staff', JSON.stringify(staff));
            return true;
        }
        return false;
    },

    deleteStaff(id) {
        // For ASP.NET MVC: return fetch(`/api/staff/delete/${id}`, { method: 'DELETE' });
        const staff = this.getStaff();
        const filtered = staff.filter(s => s.id !== id);
        localStorage.setItem('staff', JSON.stringify(filtered));
        return true;
    },

    // ===================================
    // Schedules Operations
    // ===================================
    getSchedules() {
        // For ASP.NET MVC: return fetch('/api/schedules/getall').then(r => r.json());
        return JSON.parse(localStorage.getItem('schedules') || '[]');
    },

    addSchedule(schedule) {
        // For ASP.NET MVC: return fetch('/api/schedules/create', { method: 'POST', body: JSON.stringify(schedule) });
        const schedules = this.getSchedules();
        schedules.push(schedule);
        localStorage.setItem('schedules', JSON.stringify(schedules));
        return true;
    },

    getScheduleByDate(date, shift) {
        const schedules = this.getSchedules();
        return schedules.find(s => s.date === date && s.shift === shift);
    },

    // ===================================
    // Activities Operations
    // ===================================
    getActivities() {
        // For ASP.NET MVC: return fetch('/api/activities/getall').then(r => r.json());
        return JSON.parse(localStorage.getItem('activities') || '[]');
    },

    addActivity(activity) {
        // For ASP.NET MVC: return fetch('/api/activities/create', { method: 'POST', body: JSON.stringify(activity) });
        const activities = this.getActivities();
        activities.unshift(activity); // Add to beginning
        if (activities.length > 50) {
            activities.pop(); // Keep only last 50
        }
        localStorage.setItem('activities', JSON.stringify(activities));
    }
};

// Initialize data on load
DataManager.initializeData();

