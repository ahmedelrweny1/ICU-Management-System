// ===================================
// Rooms Page JavaScript
// ===================================

let currentRoomFilter = 'all';
let selectedRoomForAssignment = null;

const getRoomsData = () => Array.isArray(window.roomsData) ? window.roomsData : [];
const getUnassignedPatients = () => Array.isArray(window.unassignedPatientsData) ? window.unassignedPatientsData : [];

document.addEventListener('DOMContentLoaded', function () {
    loadRooms();
    loadPatientsForAssignment();
    initializeRoomSearch();
});

function loadRooms() {
    const rooms = getRoomsData();
    displayRooms(rooms);
    updateRoomFilterCounts(rooms);
}

function displayRooms(rooms) {
    const roomsGrid = document.getElementById('roomsGrid');
    if (!roomsGrid) return;

    let filtered = rooms;
    if (currentRoomFilter !== 'all') {
        filtered = rooms.filter(r => normalizeStatus(r.status ?? r.Status) === currentRoomFilter);
    }

    if (!filtered.length) {
        roomsGrid.innerHTML = '<p class="text-center text-muted">No rooms found</p>';
        return;
    }

    roomsGrid.innerHTML = filtered.map(room => {
        const roomId = room.id ?? room.roomId ?? room.roomNumber ?? room.number ?? 'N/A';
        const status = normalizeStatus(room.status ?? room.Status ?? 'Available');
        const patient = getRoomPatient(room);
        const patientId = patient?.id ?? patient?.Id ?? room.patientId ?? room.PatientId ?? '';
        const condition = patient?.condition ?? patient?.Condition ?? '';
        const admissionDate = patient?.admissionDate ?? patient?.AdmissionDate ?? '';

        return `
            <div class="room-card ${status.toLowerCase()}">
                <div class="room-header">
                    <div class="room-number">Room ${roomId}</div>
                    <span class="room-status ${status.toLowerCase()}">${status}</span>
                </div>

                ${patient ? `
                    <div class="room-patient">
                        <p><strong>Patient:</strong> ${patient.name ?? patient.Name ?? 'N/A'} - ${patientId}</p>
                        <p><strong>Admitted:</strong> ${formatDate(admissionDate)}</p>
                        ${condition ? `<p><strong>Condition:</strong> <span class="badge ${getConditionBadgeClass(condition)}">${condition}</span></p>` : ''}
                    </div>
                ` : `
                    <div class="room-patient">
                        <p class="text-muted">No patient assigned</p>
                    </div>
                `}

                <div class="room-actions">
                    ${status === 'Available' ? `
                        <button class="btn btn-sm btn-primary" onclick="openAssignPatientModal(${roomId})">
                            <i class="fas fa-user-plus"></i> Assign
                        </button>
                    ` : ''}
                    ${status === 'Occupied' && patientId ? `
                        <button class="btn btn-sm btn-outline-primary" onclick="viewPatientDetail('${patientId}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="evacuateRoom(${roomId})">
                            <i class="fas fa-door-open"></i> Evacuate
                        </button>
                    ` : ''}
                    ${status === 'Cleaning' ? `
                        <button class="btn btn-sm btn-success" onclick="markRoomAvailable(${roomId})">
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
    const available = rooms.filter(r => normalizeStatus(r.status ?? r.Status) === 'Available').length;
    const occupied = rooms.filter(r => normalizeStatus(r.status ?? r.Status) === 'Occupied').length;
    const cleaning = rooms.filter(r => normalizeStatus(r.status ?? r.Status) === 'Cleaning').length;

    const allCount = document.getElementById('allRoomsCount');
    const availableCount = document.getElementById('availableCount');
    const occupiedCount = document.getElementById('occupiedCount');
    const cleaningCount = document.getElementById('cleaningCount');

    if (allCount) allCount.textContent = all;
    if (availableCount) availableCount.textContent = available;
    if (occupiedCount) occupiedCount.textContent = occupied;
    if (cleaningCount) cleaningCount.textContent = cleaning;
}

function filterRooms(filter, evt) {
    currentRoomFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const button = evt?.target?.closest('.filter-btn');
    if (button) {
        button.classList.add('active');
    }

    loadRooms();
}

function openAssignPatientModal(roomId) {
    selectedRoomForAssignment = roomId;
    const roomLabelElement = document.getElementById('assignRoomNumber');
    if (roomLabelElement) {
        roomLabelElement.textContent = roomId;
    }

    const modalEl = document.getElementById('assignPatientModal');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function loadPatientsForAssignment() {
    const selectElement = document.getElementById('selectPatient');
    if (!selectElement) return;

    const patients = getUnassignedPatients();
    if (!patients.length) {
        selectElement.innerHTML = '<option value="">No unassigned patients</option>';
        return;
    }

    selectElement.innerHTML = '<option value="">Choose a patient...</option>' +
        patients.map(p => {
            const id = p.id ?? p.Id ?? '';
            const name = p.name ?? p.Name ?? 'Unnamed';
            const condition = p.condition ?? p.Condition ?? '';
            return `<option value="${id}">${name} (${id}) ${condition ? `- ${condition}` : ''}</option>`;
        }).join('');
}

async function confirmAssignPatient() {
    const patientId = document.getElementById('selectPatient')?.value;

    if (!patientId) {
        showToast('Please select a patient', 'error');
        return;
    }

    await sendRoomPost('/Rooms/AssignPatient', {
        roomId: selectedRoomForAssignment,
        patientId: patientId
    });
}

async function evacuateRoom(roomId) {
    if (!confirm('Are you sure you want to evacuate this room?')) {
        return;
    }
    await sendRoomPost('/Rooms/EvacuateRoom', { roomId });
}

async function markRoomAvailable(roomId) {
    await sendRoomPost('/Rooms/MarkRoomAvailable', { roomId });
}

function viewPatientDetail(patientId) {
    if (!patientId) return;
    const target = window.AppRoutes?.patientDetails
        ? window.AppRoutes.patientDetails(patientId)
        : `/Patients/Details?id=${encodeURIComponent(patientId)}`;
    window.location.href = target;
}

async function addRoom() {
    await sendRoomPost('/Rooms/AddRoom', {});
}

function initializeRoomSearch() {
    const searchInput = document.getElementById('roomSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = (e.target.value || '').toLowerCase();
        const rooms = getRoomsData();

        const filtered = rooms.filter(r => {
            const roomId = `${r.id ?? r.roomId ?? r.roomNumber ?? ''}`.toLowerCase();
            const patient = getRoomPatient(r);
            const patientName = (patient?.name ?? patient?.Name ?? '').toLowerCase();
            const patientCode = (patient?.id ?? patient?.Id ?? r.patientId ?? '').toLowerCase();

            return roomId.includes(searchTerm) ||
                patientName.includes(searchTerm) ||
                patientCode.includes(searchTerm);
        });

        displayRooms(filtered);
    });
}

function getRoomPatient(room) {
    return room.patient ?? room.Patient ?? room.patientInfo ?? null;
}

function normalizeStatus(status) {
    if (!status) return 'Available';
    const normalized = status.toString().toLowerCase();
    if (normalized.includes('clean')) return 'Cleaning';
    if (normalized.includes('occup')) return 'Occupied';
    return normalized.includes('avail') ? 'Available' : status;
}

async function sendRoomPost(url, payload) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload ?? {})
        });

        const result = await response.json().catch(() => ({}));
        const success = !!result.success;
        showToast(result.message || 'Request sent. Awaiting backend implementation.', success ? 'success' : 'info');

        if (success) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Room action failed', error);
        showToast('Unable to reach the server right now.', 'error');
    }
}

