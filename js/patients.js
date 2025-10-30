// ===================================
// Patients Page JavaScript
// ===================================

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    loadPatients();
    loadAvailableRooms();
    initializePatientSearch();
});

function loadPatients() {
    const patients = DataManager.getPatients();
    displayPatients(patients);
    updateFilterCounts(patients);
}

function displayPatients(patients) {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;
    
    // Apply filter
    let filtered = patients;
    if (currentFilter !== 'all') {
        filtered = patients.filter(p => p.condition === currentFilter);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No patients found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(patient => `
        <tr onclick="viewPatientDetail('${patient.id}')">
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random" 
                         style="width: 40px; height: 40px; border-radius: 50%;" alt="${patient.name}">
                    <span>${patient.name}</span>
                </div>
            </td>
            <td>${patient.id}</td>
            <td><span class="badge ${getConditionBadgeClass(patient.condition)}">${patient.condition}</span></td>
            <td>${patient.room}</td>
            <td>${formatDate(patient.admissionDate)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); viewPatientDetail('${patient.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deletePatient('${patient.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateFilterCounts(patients) {
    const all = patients.length;
    const critical = patients.filter(p => p.condition === 'Critical').length;
    const stable = patients.filter(p => p.condition === 'Stable').length;
    const moderate = patients.filter(p => p.condition === 'Moderate').length;
    
    const allCount = document.getElementById('allCount');
    const criticalCount = document.getElementById('criticalCount');
    const stableCount = document.getElementById('stableCount');
    const moderateCount = document.getElementById('moderateCount');
    
    if (allCount) allCount.textContent = all;
    if (criticalCount) criticalCount.textContent = critical;
    if (stableCount) stableCount.textContent = stable;
    if (moderateCount) moderateCount.textContent = moderate;
}

function filterPatients(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.filter-btn').classList.add('active');
    
    loadPatients();
}

function viewPatientDetail(patientId) {
    window.location.href = `patient-detail.html?id=${patientId}`;
}

function deletePatient(patientId) {
    if (confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
        // Also update room status
        const patient = DataManager.getPatient(patientId);
        if (patient) {
            const roomId = parseInt(patient.room.split('-')[1]);
            DataManager.updateRoom(roomId, { status: 'Available', patientId: null });
        }
        
        DataManager.deletePatient(patientId);
        showToast('Patient deleted successfully');
        loadPatients();
    }
}

function loadAvailableRooms() {
    const rooms = DataManager.getRooms();
    const availableRooms = rooms.filter(r => r.status === 'Available');
    
    const roomSelect = document.getElementById('patientRoom');
    if (!roomSelect) return;
    
    roomSelect.innerHTML = '<option value="">Select Room</option>' + 
        availableRooms.map(room => `
            <option value="ICU-${room.id}">ICU-${room.id}</option>
        `).join('');
}

function savePatient() {
    const name = document.getElementById('patientName').value.trim();
    const age = document.getElementById('patientAge').value;
    const gender = document.getElementById('patientGender').value;
    const room = document.getElementById('patientRoom').value;
    const condition = document.getElementById('patientCondition').value;
    const complaint = document.getElementById('patientComplaint').value.trim();
    const history = document.getElementById('patientHistory').value.trim();
    const emergencyContact = document.getElementById('emergencyContact').value.trim();
    
    // Validation
    if (!name || !age || !gender || !room || !condition) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const patient = {
        name,
        age: parseInt(age),
        gender,
        room,
        admissionDate: new Date().toISOString().split('T')[0],
        condition,
        complaint,
        history,
        diagnosis: '',
        treatment: '',
        emergencyContact,
        vitals: { bp: '-/-', temp: '-', pulse: '-', spo2: '-' },
        drugs: [],
        notes: []
    };
    
    const patientId = DataManager.addPatient(patient);
    
    // Update room status
    const roomId = parseInt(room.split('-')[1]);
    DataManager.updateRoom(roomId, { status: 'Occupied', patientId: patientId });
    
    // Add activity
    DataManager.addActivity({
        time: 'Just now',
        text: `New patient ${name} admitted to ${room}`
    });
    
    showToast('Patient added successfully!');
    
    // Close modal and reload
    closeModal('addPatientModal');
    resetForm('addPatientForm');
    loadPatients();
    loadAvailableRooms();
}

function initializePatientSearch() {
    const searchInput = document.getElementById('patientSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const patients = DataManager.getPatients();
        
        const filtered = patients.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.id.toLowerCase().includes(searchTerm) ||
            p.room.toLowerCase().includes(searchTerm)
        );
        
        displayPatients(filtered);
    });
}

