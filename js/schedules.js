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
        return '<span class="text-muted">No staff assigned</span>';
    }
    
    return shift.staff.map(staffId => {
        const member = staff.find(s => s.id === staffId);
        if (!member) return '';
        
        const badgeClass = member.role === 'Doctor' ? 'doctor' : 
                          member.role === 'Nurse' ? 'nurse' : '';
        
        return `<span class="staff-badge ${badgeClass}">${member.name}</span>`;
    }).join(' ');
}

function updateWeekDisplay() {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    
    const weekText = `Week of ${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    document.getElementById('currentWeek').textContent = weekText;
}

function previousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    loadSchedules();
}

function nextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    loadSchedules();
}

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

// Set default date to today when modal opens
document.getElementById('addShiftModal')?.addEventListener('shown.bs.modal', function() {
    const dateInput = document.getElementById('shiftDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
});

