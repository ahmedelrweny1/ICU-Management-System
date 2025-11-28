// ===================================
// Patient Detail Page JavaScript
// ===================================

let currentPatientId = null;
let currentPatient = null;

document.addEventListener('DOMContentLoaded', function() {
    // Get patient ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentPatientId = urlParams.get('id');
    
    if (!currentPatientId) {
        showToast('Patient not found', 'error');
        setTimeout(() => redirectToPatients(), 2000);
        return;
    }
    
    loadPatientDetails();
});

function loadPatientDetails() {
    // Expect server to provide current patient as JSON
    if (window.patientDetailData && window.patientDetailData.id === currentPatientId) {
        currentPatient = window.patientDetailData;
    }

    if (!currentPatient) {
        showToast('Patient not found', 'error');
        setTimeout(() => redirectToPatients(), 2000);
        return;
    }
    
    displayPatientHeader();
    displayPersonalInfo();
    displayMedicalHistory();
    displayVitals();
    displayMedications();
    displayNotes();
}

function displayPatientHeader() {
    const daysInICU = calculateDaysInICU(currentPatient.admissionDate);
    
    document.getElementById('patientName').textContent = `Patient Details - ${currentPatient.name}`;
    document.getElementById('patientHeaderName').textContent = currentPatient.name;
    document.getElementById('patientId').textContent = currentPatient.id;
    document.getElementById('patientAge').textContent = currentPatient.age;
    document.getElementById('patientGender').textContent = currentPatient.gender;
    document.getElementById('patientRoom').textContent = currentPatient.room;
    document.getElementById('daysInICU').textContent = daysInICU;
    
    const conditionBadge = document.getElementById('conditionBadge');
    conditionBadge.textContent = currentPatient.condition;
    conditionBadge.className = `badge ${getConditionBadgeClass(currentPatient.condition)}`;
    
    // Update avatar
    const avatar = document.getElementById('patientAvatar');
    if (avatar) {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentPatient.name)}&background=random&size=100`;
    }
}

function displayPersonalInfo() {
    document.getElementById('fullName').textContent = currentPatient.name;
    document.getElementById('dateOfBirth').textContent = calculateDateOfBirth(currentPatient.age);
    document.getElementById('patientIdInfo').textContent = currentPatient.id;
    document.getElementById('roomNumber').textContent = currentPatient.room;
    document.getElementById('admissionDate').textContent = formatDate(currentPatient.admissionDate);
    document.getElementById('emergencyContact').textContent = currentPatient.emergencyContact || 'Not provided';
    
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = currentPatient.condition;
    statusBadge.className = `badge ${getConditionBadgeClass(currentPatient.condition)}`;
}

function displayMedicalHistory() {
    document.getElementById('chiefComplaint').textContent = currentPatient.complaint || 'Not documented';
    document.getElementById('medicalHistoryText').textContent = currentPatient.history || 'No medical history available';
    document.getElementById('currentDiagnosis').textContent = currentPatient.diagnosis || 'Pending diagnosis';
    document.getElementById('treatmentPlan').textContent = currentPatient.treatment || 'Treatment plan to be determined';
}

function displayVitals() {
    const vitals = currentPatient.vitals || {};
    document.getElementById('bpValue').textContent = vitals.bp || '-/-';
    document.getElementById('tempValue').textContent = vitals.temp || '-';
    document.getElementById('pulseValue').textContent = vitals.pulse || '-';
    document.getElementById('spo2Value').textContent = vitals.spo2 || '-';
}

function saveVitals() {
    const bp = document.getElementById('bpInput').value.trim();
    const temp = document.getElementById('tempInput').value.trim();
    const pulse = document.getElementById('pulseInput').value.trim();
    const spo2 = document.getElementById('spo2Input').value.trim();
    
    const updatedVitals = {
        bp: bp || currentPatient.vitals?.bp,
        temp: temp || currentPatient.vitals?.temp,
        pulse: pulse || currentPatient.vitals?.pulse,
        spo2: spo2 || currentPatient.vitals?.spo2
    };

    postPatientDetailAction('/Patients/UpdateVitals', {
        id: currentPatientId,
        vitals: updatedVitals
    }, 'Vital signs updated successfully!', 'updateVitalsModal');
}

function displayMedications() {
    const medications = currentPatient.drugs || [];
    const tbody = document.getElementById('medicationsTable');
    
    if (!tbody) return;
    
    if (medications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No medications prescribed</td></tr>';
        return;
    }
    
    tbody.innerHTML = medications.map((med, index) => `
        <tr>
            <td>${med.name}</td>
            <td>${med.dose}</td>
            <td>${med.frequency}</td>
            <td>${med.time}</td>
            <td>
                <span class="badge ${med.status === 'Given' ? 'bg-success' : med.status === 'Pending' ? 'bg-warning' : 'bg-secondary'}">
                    ${med.status}
                </span>
            </td>
            <td>
                ${med.status !== 'Given' ? `
                    <button class="btn btn-sm btn-success" onclick="markMedicationGiven(${index})">
                        <i class="fas fa-check"></i> Given
                    </button>
                ` : '<span class="text-muted">Administered</span>'}
            </td>
        </tr>
    `).join('');
}

function saveMedication() {
    const name = document.getElementById('medName').value.trim();
    const dose = document.getElementById('medDose').value.trim();
    const frequency = document.getElementById('medFrequency').value.trim();
    const time = document.getElementById('medTime').value.trim();
    
    if (!name || !dose || !frequency || !time) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    const newMedication = {
        name,
        dose,
        frequency,
        time
    };

    postPatientDetailAction('/Medications/CreateFromPatientDetail', {
        patientId: currentPatientId,
        medication: newMedication
    }, 'Medication added successfully!', 'addMedicationModal', 'addMedicationForm');
}

function markMedicationGiven(index) {
    const medications = currentPatient.drugs || [];
    const med = medications[index];
    if (!med || !med.id) {
        showToast('Medication not found', 'error');
        return;
    }

    postPatientDetailAction('/Medications/MarkGiven', {
        id: med.id
    }, 'Medication marked as administered!');
}

function displayNotes() {
    const notes = currentPatient.notes || [];
    const container = document.getElementById('notesTimeline');
    
    if (!container) return;
    
    if (notes.length === 0) {
        container.innerHTML = '<p class="text-muted">No clinical notes available</p>';
        return;
    }
    
    container.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-header">
                <span class="note-author">${note.author}</span>
                <span class="note-time">${formatDateTime(note.date)}</span>
            </div>
            <div class="note-text">${note.note}</div>
        </div>
    `).join('');
}

function redirectToPatients() {
    const target = window.AppRoutes?.patients || '/Patients';
    window.location.href = target;
}

function saveNote() {
    const noteText = document.getElementById('noteText').value.trim();
    
    if (!noteText) {
        showToast('Please enter a note', 'error');
        return;
    }
    
    postPatientDetailAction('/Patients/AddNote', {
        id: currentPatientId,
        noteText: noteText
    }, 'Clinical note added successfully!', 'addNoteModal', 'addNoteForm');
}

function calculateDateOfBirth(age) {
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    return `05/22/${birthYear}`;
}

// Populate vitals form when modal opens
document.getElementById('updateVitalsModal')?.addEventListener('shown.bs.modal', function() {
    if (currentPatient && currentPatient.vitals) {
        document.getElementById('bpInput').value = currentPatient.vitals.bp && currentPatient.vitals.bp !== '-/-' ? currentPatient.vitals.bp : '';
        document.getElementById('tempInput').value = currentPatient.vitals.temp && currentPatient.vitals.temp !== '-' ? currentPatient.vitals.temp : '';
        document.getElementById('pulseInput').value = currentPatient.vitals.pulse && currentPatient.vitals.pulse !== '-' ? currentPatient.vitals.pulse : '';
        document.getElementById('spo2Input').value = currentPatient.vitals.spo2 && currentPatient.vitals.spo2 !== '-' ? currentPatient.vitals.spo2 : '';
    }
});

async function postPatientDetailAction(url, payload, successMessage, modalId, formId) {
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

        showToast(result.message || successMessage || 'Request sent.', success ? 'success' : 'info');

        if (success) {
            if (modalId) {
                closeModal(modalId);
            }
            if (formId) {
                resetForm(formId);
            }
            // Reload page so server-provided patientDetailData is refreshed
            window.location.reload();
        }
    } catch (error) {
        console.error('Patient detail action failed', error);
        showToast('Unable to reach the server right now.', 'error');
    }
}

