// ===================================
// Patients Page JavaScript
// ===================================

let currentFilter = 'all';

const getPatientsData = () => Array.isArray(window.patientsData) ? window.patientsData : [];
const getPatientRooms = () => Array.isArray(window.patientRoomsData) ? window.patientRoomsData : [];

document.addEventListener('DOMContentLoaded', function () {
    loadPatients();
    loadAvailableRooms();
    initializePatientSearch();

    const saveButton = document.getElementById('savePatientBtn');
    if (saveButton) {
        saveButton.addEventListener('click', savePatient);
    }
});

function loadPatients() {
    const patients = getPatientsData();
    displayPatients(patients);
    updateFilterCounts(patients);
}

function displayPatients(patients) {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;

    let filtered = patients;
    if (currentFilter !== 'all') {
        filtered = patients.filter(p => (p.condition ?? p.Condition) === currentFilter);
    }

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No patients found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(patient => {
        const id = patient.id ?? patient.Id ?? '';
        const name = patient.name ?? patient.Name ?? 'Unnamed';
        const condition = patient.condition ?? patient.Condition ?? 'Unknown';
        const room = patient.room ?? patient.Room ?? patient.roomLabel ?? patient.RoomLabel ?? 'N/A';
        const admissionDate = patient.admissionDate ?? patient.AdmissionDate ?? '';

        return `
            <tr onclick="viewPatientDetail('${id}')">
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random"
                             style="width: 40px; height: 40px; border-radius: 50%;" alt="${name}">
                        <span>${name}</span>
                    </div>
                </td>
                <td>${id}</td>
                <td><span class="badge ${getConditionBadgeClass(condition)}">${condition}</span></td>
                <td>${room}</td>
                <td>${formatDate(admissionDate)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); editPatient('${id}')" data-tooltip="Edit Patient">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="event.stopPropagation(); viewPatientDetail('${id}')" data-tooltip="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deletePatient('${id}')" data-tooltip="Delete Patient">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateFilterCounts(patients) {
    const all = patients.length;
    const critical = patients.filter(p => (p.condition ?? p.Condition) === 'Critical').length;
    const stable = patients.filter(p => (p.condition ?? p.Condition) === 'Stable').length;
    const moderate = patients.filter(p => (p.condition ?? p.Condition) === 'Moderate').length;

    const allCount = document.getElementById('allCount');
    const criticalCount = document.getElementById('criticalCount');
    const stableCount = document.getElementById('stableCount');
    const moderateCount = document.getElementById('moderateCount');

    if (allCount) allCount.textContent = all;
    if (criticalCount) criticalCount.textContent = critical;
    if (stableCount) stableCount.textContent = stable;
    if (moderateCount) moderateCount.textContent = moderate;
}

function filterPatients(filter, evt) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const button = evt?.target?.closest('.filter-btn');
    if (button) {
        button.classList.add('active');
    }
    loadPatients();
}

function viewPatientDetail(patientId) {
    const target = window.AppRoutes?.patientDetails
        ? window.AppRoutes.patientDetails(patientId)
        : `/Patients/Details?id=${encodeURIComponent(patientId)}`;
    window.location.href = target;
}

async function deletePatient(patientId) {
    if (!confirm('Are you sure you want to delete this patient?')) {
        return;
    }

    await postPatientAction('/Patients/DeletePatient', { id: patientId });
}

function loadAvailableRooms() {
    const rooms = getPatientRooms();
    const roomSelect = document.getElementById('patientRoom');
    if (!roomSelect) return;

    if (!rooms.length) {
        roomSelect.innerHTML = '<option value="">No rooms available</option>';
        return;
    }

    roomSelect.innerHTML = '<option value="">Select Room</option>' +
        rooms.map(room => {
            const code = room.code ?? room.roomCode ?? room.label ?? room.RoomCode ?? room.RoomLabel ?? room.name ?? room.Name ?? '';
            const id = room.id ?? room.roomId ?? room.RoomId ?? code;
            const display = room.displayName ?? room.label ?? room.name ?? `Room ${id}`;
            return `<option value="${code || display}">${display}</option>`;
        }).join('');
}

async function savePatient() {
    const editPatientId = document.getElementById('editPatientId').value;
    const isEditing = !!editPatientId;

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

    if (!name || !age || !gender || !room || !condition) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const payload = {
        id: editPatientId || null,
        name,
        age: parseInt(age, 10),
        gender,
        room,
        condition,
        complaint,
        history,
        diagnosis,
        treatment,
        emergencyContact,
        admissionDate
    };

    if (isEditing) {
        payload.oldRoom = document.getElementById('editPatientOldRoom').value;
    }

    await postPatientAction(isEditing ? '/Patients/UpdatePatient' : '/Patients/AddPatient', payload);
}

function editPatient(patientId) {
    const patient = getPatientsData().find(p => (p.id ?? p.Id) === patientId);
    if (!patient) {
        showToast('Patient not found', 'error');
        return;
    }

    document.getElementById('patientModalTitle').textContent = 'Edit Patient Information';
    document.getElementById('savePatientBtn').innerHTML = '<i class="fas fa-save"></i> Update Patient';

    document.getElementById('editPatientId').value = patient.id ?? patient.Id ?? '';
    document.getElementById('editPatientOldRoom').value = patient.room ?? patient.Room ?? '';
    document.getElementById('patientName').value = patient.name ?? patient.Name ?? '';
    document.getElementById('patientAge').value = patient.age ?? patient.Age ?? '';
    document.getElementById('patientGender').value = patient.gender ?? patient.Gender ?? '';
    document.getElementById('patientCondition').value = patient.condition ?? patient.Condition ?? '';
    document.getElementById('patientComplaint').value = patient.complaint ?? patient.Complaint ?? '';
    document.getElementById('patientHistory').value = patient.history ?? patient.History ?? '';
    document.getElementById('patientDiagnosis').value = patient.diagnosis ?? patient.Diagnosis ?? '';
    document.getElementById('patientTreatment').value = patient.treatment ?? patient.Treatment ?? '';
    document.getElementById('emergencyContact').value = patient.emergencyContact ?? patient.EmergencyContact ?? '';
    document.getElementById('patientAdmissionDate').value = patient.admissionDate ?? patient.AdmissionDate ?? '';

    loadRoomsForEdit(patient.room ?? patient.Room ?? '');

    const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    modal.show();
}

function loadRoomsForEdit(currentRoom) {
    const rooms = getPatientRooms();
    const roomSelect = document.getElementById('patientRoom');
    if (!roomSelect) return;

    roomSelect.innerHTML = '<option value="">Select Room</option>' +
        rooms.map(room => {
            const code = room.code ?? room.roomCode ?? room.label ?? room.RoomCode ?? room.RoomLabel ?? room.name ?? '';
            const id = room.id ?? room.roomId ?? room.RoomId ?? code;
            const display = room.displayName ?? room.label ?? room.name ?? `Room ${id}`;
            const value = code || display;
            const isSelected = currentRoom && currentRoom.toString() === value;
            return `<option value="${value}" ${isSelected ? 'selected' : ''}>${display}</option>`;
        }).join('');
}

function openAddPatientModal() {
    resetForm('addPatientForm');
    document.getElementById('editPatientId').value = '';
    document.getElementById('editPatientOldRoom').value = '';
    document.getElementById('patientModalTitle').textContent = 'Add New Patient';
    document.getElementById('savePatientBtn').innerHTML = '<i class="fas fa-save"></i> Save Patient';
    loadAvailableRooms();

    const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    modal.show();
}

window.editPatient = editPatient;

function initializePatientSearch() {
    const searchInput = document.getElementById('patientSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = (e.target.value || '').toLowerCase();
        const patients = getPatientsData();

        const filtered = patients.filter(p => {
            const name = (p.name ?? p.Name ?? '').toLowerCase();
            const id = (p.id ?? p.Id ?? '').toLowerCase();
            const room = (p.room ?? p.Room ?? '').toLowerCase();
            return name.includes(searchTerm) || id.includes(searchTerm) || room.includes(searchTerm);
        });

        displayPatients(filtered);
    });
}

async function postPatientAction(url, payload) {
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
        console.error('Patient action failed', error);
        showToast('Unable to reach the server right now.', 'error');
    }
}

