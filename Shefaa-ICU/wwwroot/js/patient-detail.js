// Pure MVC - only client-side UI interactions and validations, no data fetching

document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeFormValidations();
});

function initializeTabs() {
    const tabTriggerList = [].slice.call(document.querySelectorAll('#patientTabs button[data-bs-toggle="tab"], #patientTabs a[data-bs-toggle="tab"]'));
    tabTriggerList.map(function (tabTriggerEl) {
        return new bootstrap.Tab(tabTriggerEl);
    });
}

function initializeFormValidations() {
    const updateVitalsForm = document.querySelector('form[action*="UpdateVitals"]');
    if (updateVitalsForm) {
        updateVitalsForm.addEventListener('submit', function(e) {
            const temperature = document.getElementById('Temperature')?.value;
            const pulse = document.getElementById('Pulse')?.value;
            const spO2 = document.getElementById('SpO2')?.value;
            
            // Basic validation
            if (temperature && (parseFloat(temperature) < 90 || parseFloat(temperature) > 110)) {
                e.preventDefault();
                alert('Temperature should be between 90 and 110°F');
                return false;
            }
            
            if (pulse && (parseInt(pulse) < 30 || parseInt(pulse) > 200)) {
                e.preventDefault();
                alert('Pulse rate should be between 30 and 200 bpm');
                return false;
            }
            
            if (spO2 && (parseInt(spO2) < 70 || parseInt(spO2) > 100)) {
                e.preventDefault();
                alert('SpO2 should be between 70 and 100%');
                return false;
            }
        });
    }
    
    const addNoteForm = document.querySelector('form[action*="AddNote"]');
    if (addNoteForm) {
        addNoteForm.addEventListener('submit', function(e) {
            const noteText = document.getElementById('Text')?.value;
            if (!noteText || noteText.trim() === '') {
                e.preventDefault();
                alert('Please enter a note');
                return false;
            }
        });
    }
    
    const addMedicationForm = document.querySelector('form[action*="Medications"]');
    if (addMedicationForm) {
        addMedicationForm.addEventListener('submit', function(e) {
            const medName = document.getElementById('Name')?.value;
            if (!medName || medName.trim() === '') {
                e.preventDefault();
                alert('Medication name is required');
                return false;
            }
        });
    }
}
