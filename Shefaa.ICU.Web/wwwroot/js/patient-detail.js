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
        setTimeout(() => window.location.href = 'patients.html', 2000);
        return;
    }
    
    loadPatientDetails();
});

function loadPatientDetails() {
    currentPatient = DataManager.getPatient(currentPatientId);
    
    if (!currentPatient) {
        showToast('Patient not found', 'error');
        setTimeout(() => window.location.href = 'patients.html', 2000);
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
        bp: bp || currentPatient.vitals.bp,
        temp: temp || currentPatient.vitals.temp,
        pulse: pulse || currentPatient.vitals.pulse,
        spo2: spo2 || currentPatient.vitals.spo2
    };
    
    DataManager.updatePatient(currentPatientId, { vitals: updatedVitals });
    
    DataManager.addActivity({
        time: 'Just now',
        text: `Vital signs updated for patient ${currentPatient.name}`
    });
    
    showToast('Vital signs updated successfully!');
    
    closeModal('updateVitalsModal');
    loadPatientDetails();
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
        time,
        status: 'Pending'
    };
    
    const updatedDrugs = [...(currentPatient.drugs || []), newMedication];
    DataManager.updatePatient(currentPatientId, { drugs: updatedDrugs });
    
    DataManager.addActivity({
        time: 'Just now',
        text: `New medication ${name} prescribed to patient ${currentPatient.name}`
    });
    
    showToast('Medication added successfully!');
    
    closeModal('addMedicationModal');
    resetForm('addMedicationForm');
    loadPatientDetails();
}

function markMedicationGiven(index) {
    const updatedDrugs = [...currentPatient.drugs];
    updatedDrugs[index].status = 'Given';
    
    DataManager.updatePatient(currentPatientId, { drugs: updatedDrugs });
    
    DataManager.addActivity({
        time: 'Just now',
        text: `Medication ${updatedDrugs[index].name} administered to patient ${currentPatient.name}`
    });
    
    showToast('Medication marked as administered!');
    loadPatientDetails();
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

function saveNote() {
    const noteText = document.getElementById('noteText').value.trim();
    
    if (!noteText) {
        showToast('Please enter a note', 'error');
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const newNote = {
        date: new Date().toISOString(),
        author: currentUser.name || 'Unknown User',
        note: noteText
    };
    
    const updatedNotes = [...(currentPatient.notes || []), newNote];
    DataManager.updatePatient(currentPatientId, { notes: updatedNotes });
    
    DataManager.addActivity({
        time: 'Just now',
        text: `Clinical note added for patient ${currentPatient.name}`
    });
    
    showToast('Clinical note added successfully!');
    
    closeModal('addNoteModal');
    resetForm('addNoteForm');
    loadPatientDetails();
}

function calculateDateOfBirth(age) {
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    return `05/22/${birthYear}`;
}

// Populate vitals form when modal opens
document.getElementById('updateVitalsModal')?.addEventListener('shown.bs.modal', function() {
    if (currentPatient && currentPatient.vitals) {
        document.getElementById('bpInput').value = currentPatient.vitals.bp !== '-/-' ? currentPatient.vitals.bp : '';
        document.getElementById('tempInput').value = currentPatient.vitals.temp !== '-' ? currentPatient.vitals.temp : '';
        document.getElementById('pulseInput').value = currentPatient.vitals.pulse !== '-' ? currentPatient.vitals.pulse : '';
        document.getElementById('spo2Input').value = currentPatient.vitals.spo2 !== '-' ? currentPatient.vitals.spo2 : '';
    }
});

