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
                <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); editPatient('${patient.id}')" data-tooltip="Edit Patient">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="event.stopPropagation(); viewPatientDetail('${patient.id}')" data-tooltip="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deletePatient('${patient.id}')" data-tooltip="Delete Patient">
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
    const editPatientId = document.getElementById('editPatientId').value;
    const isEditing = editPatientId !== '';
    
    const name = document.getElementById('patientName').value.trim();
    const age = document.getElementById('patientAge').value;
    const gender = document.getElementById('patientGender').value;
    const room = document.getElementById('patientRoom').value;
    const condition = document.getElementById('patientCondition').value;
    const complaint = document.getElementById('patientComplaint').value.trim();
    const history = document.getElementById('patientHistory').value.trim();
    const diagnosis = document.getElementById('patientDiagnosis').value.trim();
    const treatment = document.getElementById('patientTreatment').value.trim();
    const emergencyContact = document.getElementById('emergencyContact').value.trim();
    const admissionDate = document.getElementById('patientAdmissionDate').value;
    
    // Validation
    if (!name || !age || !gender || !room || !condition) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (isEditing) {
        // UPDATE existing patient
        const oldRoom = document.getElementById('editPatientOldRoom').value;
        const currentPatient = DataManager.getPatient(editPatientId);
        
        const updatedPatient = {
            ...currentPatient,
            name,
            age: parseInt(age),
            gender,
            room,
            condition,
            complaint,
            history,
            diagnosis,
            treatment,
            emergencyContact,
            admissionDate: admissionDate || currentPatient.admissionDate
        };
        
        DataManager.updatePatient(editPatientId, updatedPatient);
        
        // Update room assignments if room changed
        if (oldRoom !== room) {
            // Free old room
            const oldRoomId = parseInt(oldRoom.split('-')[1]);
            DataManager.updateRoom(oldRoomId, { status: 'Cleaning', patientId: null });
            
            // Occupy new room
            const newRoomId = parseInt(room.split('-')[1]);
            DataManager.updateRoom(newRoomId, { status: 'Occupied', patientId: editPatientId });
        }
        
        DataManager.addActivity({
            time: 'Just now',
            text: `Patient ${name} information updated`
        });
        
        showToast('Patient updated successfully!');
    } else {
        // CREATE new patient
        const patient = {
            name,
            age: parseInt(age),
            gender,
            room,
            admissionDate: admissionDate || new Date().toISOString().split('T')[0],
            condition,
            complaint,
            history,
            diagnosis,
            treatment,
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
    }
    
    // Close modal and reload
    closeModal('addPatientModal');
    resetForm('addPatientForm');
    loadPatients();
    loadAvailableRooms();
}

function editPatient(patientId) {
    const patient = DataManager.getPatient(patientId);
    if (!patient) {
        showToast('Patient not found', 'error');
        return;
    }
    
    // Update modal title
    document.getElementById('patientModalTitle').textContent = 'Edit Patient Information';
    document.getElementById('savePatientBtn').innerHTML = '<i class="fas fa-save"></i> Update Patient';
    
    // Populate form with patient data
    document.getElementById('editPatientId').value = patient.id;
    document.getElementById('editPatientOldRoom').value = patient.room;
    document.getElementById('patientName').value = patient.name;
    document.getElementById('patientAge').value = patient.age;
    document.getElementById('patientGender').value = patient.gender;
    document.getElementById('patientCondition').value = patient.condition;
    document.getElementById('patientComplaint').value = patient.complaint || '';
    document.getElementById('patientHistory').value = patient.history || '';
    document.getElementById('patientDiagnosis').value = patient.diagnosis || '';
    document.getElementById('patientTreatment').value = patient.treatment || '';
    document.getElementById('emergencyContact').value = patient.emergencyContact || '';
    document.getElementById('patientAdmissionDate').value = patient.admissionDate || '';
    
    // Load rooms including current room
    loadRoomsForEdit(patient.room);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    modal.show();
}

function loadRoomsForEdit(currentRoom) {
    const rooms = DataManager.getRooms();
    const availableRooms = rooms.filter(r => r.status === 'Available' || r.id === parseInt(currentRoom.split('-')[1]));
    
    const roomSelect = document.getElementById('patientRoom');
    if (!roomSelect) return;
    
    roomSelect.innerHTML = '<option value="">Select Room</option>' + 
        availableRooms.map(room => `
            <option value="ICU-${room.id}" ${currentRoom === `ICU-${room.id}` ? 'selected' : ''}>
                ICU-${room.id}
            </option>
        `).join('');
}

// Reset modal when opening for new patient
function openAddPatientModal() {
    // Reset form
    resetForm('addPatientForm');
    document.getElementById('editPatientId').value = '';
    document.getElementById('editPatientOldRoom').value = '';
    
    // Update modal title
    document.getElementById('patientModalTitle').textContent = 'Add New Patient';
    document.getElementById('savePatientBtn').innerHTML = '<i class="fas fa-save"></i> Save Patient';
    
    // Load available rooms
    loadAvailableRooms();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    modal.show();
}

// Make function globally accessible
window.editPatient = editPatient;

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

