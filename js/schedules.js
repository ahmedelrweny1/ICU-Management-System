// ===================================
// Schedules Page JavaScript
// ===================================

let currentWeekStart = getWeekStart(new Date());

document.addEventListener('DOMContentLoaded', function() {
    loadSchedules();
    loadStaffForScheduling();
});

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function loadSchedules() {
    const schedules = DataManager.getSchedules();
    const staff = DataManager.getStaff();
    
    updateShiftCounts(schedules);
    displayWeeklySchedule(schedules, staff);
    updateWeekDisplay();
}

function updateShiftCounts(schedules) {
    const morning = schedules.filter(s => s.shift === 'Morning')
        .reduce((sum, s) => sum + s.staff.length, 0);
    const evening = schedules.filter(s => s.shift === 'Evening')
        .reduce((sum, s) => sum + s.staff.length, 0);
    const night = schedules.filter(s => s.shift === 'Night')
        .reduce((sum, s) => sum + s.staff.length, 0);
    
    document.getElementById('morningCount').textContent = morning;
    document.getElementById('eveningCount').textContent = evening;
    document.getElementById('nightCount').textContent = night;
}

function displayWeeklySchedule(schedules, staff) {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    tbody.innerHTML = days.map((day, index) => {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + index);
        const dateString = date.toISOString().split('T')[0];
        
        const morningShift = schedules.find(s => s.date === dateString && s.shift === 'Morning');
        const eveningShift = schedules.find(s => s.date === dateString && s.shift === 'Evening');
        const nightShift = schedules.find(s => s.date === dateString && s.shift === 'Night');
        
        return `
            <tr>
                <td><strong>${day}</strong><br><small>${formatDate(dateString)}</small></td>
                <td>${renderShiftStaff(morningShift, staff)}</td>
                <td>${renderShiftStaff(eveningShift, staff)}</td>
                <td>${renderShiftStaff(nightShift, staff)}</td>
            </tr>
        `;
    }).join('');
}

function renderShiftStaff(shift, staff) {
    if (!shift || !shift.staff || shift.staff.length === 0) {
        return `
            <div class="shift-empty">
                <span class="text-muted"><i class="fas fa-users-slash"></i> No staff assigned</span>
            </div>
        `;
    }
    
    const staffHTML = shift.staff.map(staffId => {
        const member = staff.find(s => s.id === staffId);
        if (!member) return '';
        
        const badgeClass = member.role === 'Doctor' ? 'doctor' : 
                          member.role === 'Nurse' ? 'nurse' : 'technician';
        
        return `<span class="staff-badge ${badgeClass}" title="${member.role}">${member.name}</span>`;
    }).join(' ');
    
    return `
        <div class="shift-assigned">
            ${staffHTML}
            <div class="shift-actions mt-2">
                <button class="btn btn-sm btn-outline-primary" onclick="editShift('${shift.date}', '${shift.shift}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteShift('${shift.date}', '${shift.shift}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

function updateWeekDisplay() {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    
    const weekText = `Week of ${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    document.getElementById('currentWeek').textContent = weekText;
}

function previousWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    currentWeekStart = newDate;
    loadSchedules();
}

function nextWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    currentWeekStart = newDate;
    loadSchedules();
}

// Make week navigation functions globally accessible
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;

function loadStaffForScheduling() {
    const staff = DataManager.getStaff();
    const container = document.getElementById('staffCheckboxes');
    if (!container) return;
    
    container.innerHTML = staff.map(member => `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="${member.id}" id="staff_${member.id}">
            <label class="form-check-label" for="staff_${member.id}">
                ${member.name} - ${member.role}
            </label>
        </div>
    `).join('');
}

function saveShift() {
    const date = document.getElementById('shiftDate').value;
    const shiftType = document.getElementById('shiftType').value;
    const notes = document.getElementById('shiftNotes').value.trim();
    
    // Get selected staff
    const selectedStaff = [];
    document.querySelectorAll('#staffCheckboxes input:checked').forEach(checkbox => {
        selectedStaff.push(checkbox.value);
    });
    
    // Validation
    if (!date || !shiftType) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (selectedStaff.length === 0) {
        showToast('Please select at least one staff member', 'error');
        return;
    }
    
    // Check for conflicts
    const conflicts = checkSchedulingConflicts(date, selectedStaff);
    if (conflicts.length > 0) {
        if (!confirm(`Warning: The following staff members are already scheduled on this date:\n${conflicts.join(', ')}\n\nDo you want to continue?`)) {
            return;
        }
    }
    
    const schedule = {
        date,
        shift: shiftType,
        staff: selectedStaff,
        notes
    };
    
    DataManager.addSchedule(schedule);
    
    DataManager.addActivity({
        time: 'Just now',
        text: `${shiftType} shift scheduled for ${formatDate(date)} with ${selectedStaff.length} staff members`
    });
    
    showToast('Shift scheduled successfully!');
    
    closeModal('addShiftModal');
    resetForm('addShiftForm');
    loadSchedules();
}

function checkSchedulingConflicts(date, staffIds) {
    const schedules = DataManager.getSchedules();
    const staff = DataManager.getStaff();
    const conflicts = [];
    
    // Find schedules for the same date
    const dateSchedules = schedules.filter(s => s.date === date);
    
    staffIds.forEach(staffId => {
        const isScheduled = dateSchedules.some(schedule => 
            schedule.staff.includes(staffId)
        );
        
        if (isScheduled) {
            const member = staff.find(s => s.id === staffId);
            if (member) {
                conflicts.push(member.name);
            }
        }
    });
    
    return conflicts;
}

// Edit shift functionality
function editShift(date, shiftType) {
    const schedules = DataManager.getSchedules();
    const shift = schedules.find(s => s.date === date && s.shift === shiftType);
    
    if (!shift) {
        showToast('Shift not found', 'error');
        return;
    }
    
    // Update modal title
    const modalTitle = document.querySelector('#addShiftModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Shift Assignment';
    }
    
    // Populate modal with existing data
    document.getElementById('shiftDate').value = date;
    document.getElementById('shiftType').value = shiftType;
    document.getElementById('shiftNotes').value = shift.notes || '';
    
    // Check the staff checkboxes
    document.querySelectorAll('#staffCheckboxes input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = shift.staff.includes(checkbox.value);
    });
    
    // Store original shift for deletion before saving
    window.editingShift = { date, shift: shiftType };
    
    // Open modal
    const modal = new bootstrap.Modal(document.getElementById('addShiftModal'));
    modal.show();
}

// Delete shift functionality
function deleteShift(date, shiftType) {
    if (!confirm(`Are you sure you want to delete this ${shiftType} shift for ${formatDate(date)}?`)) {
        return;
    }
    
    const schedules = DataManager.getSchedules();
    const filtered = schedules.filter(s => !(s.date === date && s.shift === shiftType));
    
    localStorage.setItem('schedules', JSON.stringify(filtered));
    
    DataManager.addActivity({
        time: 'Just now',
        text: `${shiftType} shift for ${formatDate(date)} deleted`
    });
    
    showToast('Shift deleted successfully!');
    loadSchedules();
}

// Make functions globally accessible
window.editShift = editShift;
window.deleteShift = deleteShift;

// Update saveShift to handle editing
function saveShiftUpdated() {
    const date = document.getElementById('shiftDate').value;
    const shiftType = document.getElementById('shiftType').value;
    const notes = document.getElementById('shiftNotes').value.trim();
    
    // Get selected staff
    const selectedStaff = [];
    document.querySelectorAll('#staffCheckboxes input:checked').forEach(checkbox => {
        selectedStaff.push(checkbox.value);
    });
    
    // Validation
    if (!date || !shiftType) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (selectedStaff.length === 0) {
        showToast('Please select at least one staff member', 'error');
        return;
    }
    
    // If editing, delete the old shift first
    if (window.editingShift) {
        const schedules = DataManager.getSchedules();
        const filtered = schedules.filter(s => 
            !(s.date === window.editingShift.date && s.shift === window.editingShift.shift)
        );
        localStorage.setItem('schedules', JSON.stringify(filtered));
        window.editingShift = null;
    }
    
    // Check for conflicts (excluding the current shift being edited)
    const conflicts = checkSchedulingConflicts(date, selectedStaff, shiftType);
    if (conflicts.length > 0) {
        if (!confirm(`Warning: The following staff members are already scheduled on this date:\n${conflicts.join(', ')}\n\nDo you want to continue?`)) {
            return;
        }
    }
    
    const schedule = {
        date,
        shift: shiftType,
        staff: selectedStaff,
        notes
    };
    
    DataManager.addSchedule(schedule);
    
    DataManager.addActivity({
        time: 'Just now',
        text: `${shiftType} shift scheduled for ${formatDate(date)} with ${selectedStaff.length} staff members`
    });
    
    showToast('Shift scheduled successfully!');
    
    closeModal('addShiftModal');
    resetForm('addShiftForm');
    
    // Clear editing state
    window.editingShift = null;
    
    loadSchedules();
}

// Update conflict checker to exclude current shift
function checkSchedulingConflictsUpdated(date, staffIds, currentShift) {
    const schedules = DataManager.getSchedules();
    const staff = DataManager.getStaff();
    const conflicts = [];
    
    // Find schedules for the same date, excluding current shift type if editing
    const dateSchedules = schedules.filter(s => {
        if (s.date === date && window.editingShift && s.shift === currentShift) {
            return false; // Exclude current shift being edited
        }
        return s.date === date;
    });
    
    staffIds.forEach(staffId => {
        const isScheduled = dateSchedules.some(schedule => 
            schedule.staff.includes(staffId)
        );
        
        if (isScheduled) {
            const member = staff.find(s => s.id === staffId);
            if (member) {
                conflicts.push(member.name);
            }
        }
    });
    
    return conflicts;
}

// Replace saveShift and checkSchedulingConflicts
window.saveShift = saveShiftUpdated;
window.checkSchedulingConflicts = checkSchedulingConflictsUpdated;

// Set default date to today when modal opens
document.getElementById('addShiftModal')?.addEventListener('shown.bs.modal', function() {
    const dateInput = document.getElementById('shiftDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
});

// Reset editing state when modal closes
document.getElementById('addShiftModal')?.addEventListener('hidden.bs.modal', function() {
    window.editingShift = null;
    resetForm('addShiftForm');
    
    // Reset modal title
    const modalTitle = document.querySelector('#addShiftModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Add Shift Assignment';
    }
});

