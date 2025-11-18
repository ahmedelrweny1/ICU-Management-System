// ===================================
// Rooms Page JavaScript
// ===================================

let currentRoomFilter = 'all';
let selectedRoomForAssignment = null;

document.addEventListener('DOMContentLoaded', function() {
    loadRooms();
    loadPatientsForAssignment();
    initializeRoomSearch();
});

function loadRooms() {
    const rooms = DataManager.getRooms();
    displayRooms(rooms);
    updateRoomFilterCounts(rooms);
}

function displayRooms(rooms) {
    const roomsGrid = document.getElementById('roomsGrid');
    if (!roomsGrid) return;
    
    // Apply filter
    let filtered = rooms;
    if (currentRoomFilter !== 'all') {
        filtered = rooms.filter(r => r.status === currentRoomFilter);
    }
    
    if (filtered.length === 0) {
        roomsGrid.innerHTML = '<p class="text-center text-muted">No rooms found</p>';
        return;
    }
    
    roomsGrid.innerHTML = filtered.map(room => {
        const patient = room.patientId ? DataManager.getPatient(room.patientId) : null;
        
        return `
            <div class="room-card ${room.status.toLowerCase()}">
                <div class="room-header">
                    <div class="room-number">Room ${room.id}</div>
                    <span class="room-status ${room.status.toLowerCase()}">${room.status}</span>
                </div>
                
                ${patient ? `
                    <div class="room-patient">
                        <p><strong>Patient:</strong> ${patient.name} - ${patient.id}</p>
                        <p><strong>Admitted:</strong> ${formatDate(patient.admissionDate)}</p>
                        <p><strong>Condition:</strong> <span class="badge ${getConditionBadgeClass(patient.condition)}">${patient.condition}</span></p>
                    </div>
                ` : `
                    <div class="room-patient">
                        <p class="text-muted">N/A</p>
                    </div>
                `}
                
                <div class="room-actions">
                    ${room.status === 'Available' ? `
                        <button class="btn btn-sm btn-primary" onclick="openAssignPatientModal(${room.id})">
                            <i class="fas fa-user-plus"></i> Assign
                        </button>
                    ` : ''}
                    ${room.status === 'Occupied' ? `
                        <button class="btn btn-sm btn-outline-primary" onclick="viewPatientDetail('${room.patientId}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="evacuateRoom(${room.id})">
                            <i class="fas fa-door-open"></i> Evacuate
                        </button>
                    ` : ''}
                    ${room.status === 'Cleaning' ? `
                        <button class="btn btn-sm btn-success" onclick="markRoomAvailable(${room.id})">
                            <i class="fas fa-check"></i> Mark Available
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function updateRoomFilterCounts(rooms) {
    const all = rooms.length;
    const available = rooms.filter(r => r.status === 'Available').length;
    const occupied = rooms.filter(r => r.status === 'Occupied').length;
    const cleaning = rooms.filter(r => r.status === 'Cleaning').length;
    
    const allCount = document.getElementById('allRoomsCount');
    const availableCount = document.getElementById('availableCount');
    const occupiedCount = document.getElementById('occupiedCount');
    const cleaningCount = document.getElementById('cleaningCount');
    
    if (allCount) allCount.textContent = all;
    if (availableCount) availableCount.textContent = available;
    if (occupiedCount) occupiedCount.textContent = occupied;
    if (cleaningCount) cleaningCount.textContent = cleaning;
}

function filterRooms(filter) {
    currentRoomFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.filter-btn').classList.add('active');
    
    loadRooms();
}

function openAssignPatientModal(roomId) {
    selectedRoomForAssignment = roomId;
    document.getElementById('assignRoomNumber').textContent = roomId;
    
    const modal = new bootstrap.Modal(document.getElementById('assignPatientModal'));
    modal.show();
}

function loadPatientsForAssignment() {
    const patients = DataManager.getPatients();
    const rooms = DataManager.getRooms();
    
    // Get patients not assigned to any room
    const assignedPatientIds = rooms.filter(r => r.patientId).map(r => r.patientId);
    const unassignedPatients = patients.filter(p => !assignedPatientIds.includes(p.id));
    
    const selectElement = document.getElementById('selectPatient');
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="">Choose a patient...</option>' +
        unassignedPatients.map(p => `
            <option value="${p.id}">${p.name} (${p.id}) - ${p.condition}</option>
        `).join('');
}

function confirmAssignPatient() {
    const patientId = document.getElementById('selectPatient').value;
    
    if (!patientId) {
        showToast('Please select a patient', 'error');
        return;
    }
    
    // Update room
    DataManager.updateRoom(selectedRoomForAssignment, {
        status: 'Occupied',
        patientId: patientId
    });
    
    // Update patient room
    const patient = DataManager.getPatient(patientId);
    if (patient) {
        DataManager.updatePatient(patientId, {
            room: `ICU-${selectedRoomForAssignment}`
        });
    }
    
    // Add activity
    DataManager.addActivity({
        time: 'Just now',
        text: `Patient ${patient.name} assigned to Room ${selectedRoomForAssignment}`
    });
    
    showToast('Patient assigned successfully!');
    
    closeModal('assignPatientModal');
    loadRooms();
    loadPatientsForAssignment();
}

function evacuateRoom(roomId) {
    if (!confirm('Are you sure you want to evacuate this room? The patient will be discharged.')) {
        return;
    }
    
    const room = DataManager.getRoom(roomId);
    if (room && room.patientId) {
        const patient = DataManager.getPatient(room.patientId);
        
        // Update room status
        DataManager.updateRoom(roomId, {
            status: 'Cleaning',
            patientId: null
        });
        
        // Add activity
        if (patient) {
            DataManager.addActivity({
                time: 'Just now',
                text: `Room ${roomId} evacuated - Patient ${patient.name} discharged`
            });
        }
        
        showToast('Room evacuated successfully. Room marked for cleaning.');
        loadRooms();
    }
}

function markRoomAvailable(roomId) {
    DataManager.updateRoom(roomId, {
        status: 'Available',
        patientId: null
    });
    
    DataManager.addActivity({
        time: 'Just now',
        text: `Room ${roomId} cleaned and marked available`
    });
    
    showToast('Room marked as available!');
    loadRooms();
}

function viewPatientDetail(patientId) {
    const target = window.AppRoutes?.patientDetails
        ? window.AppRoutes.patientDetails(patientId)
        : `/Patients/Details?id=${encodeURIComponent(patientId)}`;
    window.location.href = target;
}

function addRoom() {
    const rooms = DataManager.getRooms();
    const maxId = Math.max(...rooms.map(r => r.id), 100);
    const newRoomId = maxId + 1;
    
    const newRoom = {
        id: newRoomId,
        status: 'Available',
        patientId: null
    };
    
    DataManager.addRoom(newRoom);
    showToast(`Room ${newRoomId} added successfully!`);
    loadRooms();
}

function initializeRoomSearch() {
    const searchInput = document.getElementById('roomSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rooms = DataManager.getRooms();
        
        const filtered = rooms.filter(r => {
            const roomMatch = `room ${r.id}`.includes(searchTerm) || `${r.id}`.includes(searchTerm);
            if (roomMatch) return true;
            
            if (r.patientId) {
                const patient = DataManager.getPatient(r.patientId);
                if (patient) {
                    return patient.name.toLowerCase().includes(searchTerm) ||
                           patient.id.toLowerCase().includes(searchTerm);
                }
            }
            return false;
        });
        
        displayRooms(filtered);
    });
}

