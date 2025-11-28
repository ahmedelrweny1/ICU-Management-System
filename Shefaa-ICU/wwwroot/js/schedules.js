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
    const schedules = window.schedulesData?.schedules || [];
    const staff = window.schedulesData?.staffList || [];

    if (window.schedulesData?.startOfWeek) {
        currentWeekStart = new Date(window.schedulesData.startOfWeek);
    }

    updateShiftCounts(schedules);
    displayWeeklySchedule(schedules, staff);
    updateWeekDisplay();
}

function updateShiftCounts(schedules) {
    // Count schedules by shift type
    const today = new Date().toISOString().split('T')[0];
    const morning = schedules.filter(s => s.date === today && s.shiftType === 'Morning').length;
    const evening = schedules.filter(s => s.date === today && s.shiftType === 'Evening').length;
    const night = schedules.filter(s => s.date === today && s.shiftType === 'Night').length;
    
    const morningEl = document.getElementById('morningCount');
    const eveningEl = document.getElementById('eveningCount');
    const nightEl = document.getElementById('nightCount');
    
    if (morningEl) morningEl.textContent = morning;
    if (eveningEl) eveningEl.textContent = evening;
    if (nightEl) nightEl.textContent = night;
}

function displayWeeklySchedule(schedules, staff) {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    tbody.innerHTML = days.map((day, index) => {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + index);
        const dateString = date.toISOString().split('T')[0];
        
        // Get all schedules for this date and shift type
        const morningSchedules = schedules.filter(s => s.date === dateString && s.shiftType === 'Morning');
        const eveningSchedules = schedules.filter(s => s.date === dateString && s.shiftType === 'Evening');
        const nightSchedules = schedules.filter(s => s.date === dateString && s.shiftType === 'Night');
        
        return `
            <tr>
                <td><strong>${day}</strong><br><small>${formatDate(dateString)}</small></td>
                <td>${renderShiftStaffList(morningSchedules, staff, dateString, 'Morning')}</td>
                <td>${renderShiftStaffList(eveningSchedules, staff, dateString, 'Evening')}</td>
                <td>${renderShiftStaffList(nightSchedules, staff, dateString, 'Night')}</td>
            </tr>
        `;
    }).join('');
}

function renderShiftStaffList(scheduleList, staff, date, shiftType) {
    if (!scheduleList || scheduleList.length === 0) {
        return `
            <div class="shift-empty">
                <span class="text-muted mb-2"><i class="fas fa-users-slash"></i> No staff assigned</span>
                <button class="btn btn-sm btn-primary w-100" onclick="quickAddShift('${date}', '${shiftType}')">
                    <i class="fas fa-plus"></i> Add Staff
                </button>
            </div>
        `;
    }
    
    // Render each staff member assigned to this shift
    const staffHTML = scheduleList.map(schedule => {
        const member = staff.find(s => s.id === schedule.staffId);
        if (!member) return '';
        
        const badgeClass = member.role === 'Doctor' ? 'doctor' : 
                          member.role === 'Nurse' ? 'nurse' : 'technician';
        
        return `<span class="staff-badge ${badgeClass}" title="${member.role}">${member.name}</span>`;
    }).join(' ');
    
    return `
        <div class="shift-assigned">
            ${staffHTML}
            <div class="shift-actions mt-2">
                <button class="btn btn-sm btn-outline-primary" onclick="editShift('${date}', '${shiftType}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteShift('${date}', '${shiftType}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

// Old function replaced by renderShiftStaffList above

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
    // Reload page to get new week's data from server
    window.location.href = `/Schedules?weekStart=${newDate.toISOString().split('T')[0]}`;
}

function nextWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    currentWeekStart = newDate;
    // Reload page to get new week's data from server
    window.location.href = `/Schedules?weekStart=${newDate.toISOString().split('T')[0]}`;
}

// Make week navigation functions globally accessible
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;

function loadStaffForScheduling() {
    // Use data from server if available
    const staff = window.schedulesData?.staffList || [];
    const container = document.getElementById('staffCheckboxes');
    if (!container) {
        console.error('Staff checkboxes container not found');
        return;
    }
    
    if (!staff || staff.length === 0) {
        container.innerHTML = '<p class="text-muted">No active staff available</p>';
        console.warn('No staff data available');
        return;
    }
    
    console.log('Loading staff checkboxes:', staff.length, 'staff members');
    
    container.innerHTML = staff.map(member => `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="${member.id}" id="staff_${member.id}" name="staffIds">
            <label class="form-check-label" for="staff_${member.id}">
                ${member.name} - ${member.role || 'Staff'}
            </label>
        </div>
    `).join('');
    
    console.log('Staff checkboxes loaded:', container.querySelectorAll('input[type="checkbox"]').length);
}


function checkSchedulingConflicts(date, staffIds, shiftType) {
    // Use server data if available
    const schedules = window.schedulesData?.schedules || [];
    const staff = window.schedulesData?.staffList || [];
    const conflicts = [];
    
    // Find schedules for the same date and shift type
    const dateSchedules = schedules.filter(s => s.date === date && s.shiftType === shiftType);
    
    staffIds.forEach(staffId => {
        const isScheduled = dateSchedules.some(schedule => 
            schedule.staffId === staffId
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
    // Use server data if available
    const schedules = window.schedulesData?.schedules || [];
    const shiftsForDateAndType = schedules.filter(s => s.date === date && s.shiftType === shiftType);
    
    if (shiftsForDateAndType.length === 0) {
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
    
    // Get notes from first schedule (they should all have same notes)
    const notes = shiftsForDateAndType[0].notes || '';
    document.getElementById('shiftNotes').value = notes || '';
    
    // Get all staff IDs for this shift
    const staffIds = shiftsForDateAndType.map(s => s.staffId);
    
    // Store original shift for deletion before saving
    window.editingShift = { date, shiftType, staffIds: staffIds };
    
    // Open modal first, then check boxes after a short delay to ensure they're rendered
    const modal = new bootstrap.Modal(document.getElementById('addShiftModal'));
    modal.show();
    
    // Wait for modal to be shown, then check the staff checkboxes
    setTimeout(() => {
        document.querySelectorAll('#staffCheckboxes input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = staffIds.includes(parseInt(checkbox.value));
        });
    }, 300);
}

// Delete shift functionality
async function deleteShift(date, shiftType) {
    if (!confirm(`Are you sure you want to delete this ${shiftType} shift for ${formatDate(date)}?`)) {
        return;
    }
    
    // Get CSRF token
    const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
    
    try {
        const response = await fetch('/Schedules/DeleteSchedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                date: date,
                shiftType: shiftType,
                __RequestVerificationToken: token
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Shift deleted successfully!');
            window.location.reload();
        } else {
            showToast(result.message || 'Error deleting schedule', 'error');
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
        showToast('Error deleting schedule', 'error');
    }
}

// Quick add shift (opens modal with pre-filled date and shift type)
function quickAddShift(date, shiftType) {
    // Reset form first
    resetForm('addShiftForm');
    window.editingShift = null;
    
    // Pre-fill the modal
    document.getElementById('shiftDate').value = date;
    document.getElementById('shiftType').value = shiftType;
    
    // Update modal title
    const modalTitle = document.querySelector('#addShiftModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Add Shift Assignment';
    }
    
    // Ensure staff is loaded before opening modal
    loadStaffForScheduling();
    
    // Open modal
    const modal = new bootstrap.Modal(document.getElementById('addShiftModal'));
    modal.show();
    
    // Ensure staff is loaded after modal is shown
    setTimeout(() => {
        loadStaffForScheduling();
    }, 100);
}

// Make functions globally accessible
window.editShift = editShift;
window.deleteShift = deleteShift;
window.quickAddShift = quickAddShift;

// Make saveShift handle editing - accessible globally
async function saveShift(event) {
    // Prevent any form submission
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const date = document.getElementById('shiftDate')?.value;
    const shiftType = document.getElementById('shiftType')?.value;
    const notes = document.getElementById('shiftNotes')?.value?.trim() || '';
    
    // Validation
    if (!date || !shiftType) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Get selected staff - find all checkboxes and check which are checked
    const selectedStaff = [];
    const container = document.getElementById('staffCheckboxes');
    
    if (!container) {
        showToast('Staff list container not found. Please refresh the page.', 'error');
        return;
    }
    
    // Find all checkboxes - use the most direct method
    const allCheckboxes = container.querySelectorAll('input[type="checkbox"]');
    
    // Convert to array and check each one
    for (let i = 0; i < allCheckboxes.length; i++) {
        const checkbox = allCheckboxes[i];
        // Direct check of checked property - this is the most reliable
        if (checkbox.checked === true) {
            const value = parseInt(checkbox.value);
            if (!isNaN(value) && value > 0) {
                selectedStaff.push(value);
            }
        }
    }
    
    // Debug logging
    console.log('=== Save Shift Debug ===');
    console.log('Container found:', !!container);
    console.log('Container HTML length:', container.innerHTML.length);
    console.log('Total checkboxes found:', allCheckboxes.length);
    console.log('Checked checkboxes:', Array.from(allCheckboxes).filter(cb => cb.checked).length);
    console.log('Selected staff IDs:', selectedStaff);
    
    // Log each checkbox state for debugging
    if (allCheckboxes.length > 0) {
        Array.from(allCheckboxes).forEach((cb, index) => {
            console.log(`Checkbox ${index}: value="${cb.value}", checked=${cb.checked}, id="${cb.id}"`);
        });
    } else {
        console.log('WARNING: No checkboxes found in container!');
        console.log('Container innerHTML:', container.innerHTML.substring(0, 500));
    }
    
    if (selectedStaff.length === 0) {
        showToast('Please select at least one staff member', 'error');
        return;
    }
    
    // If editing, delete the old shift first
    if (window.editingShift) {
        const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
        try {
            await fetch('/Schedules/DeleteSchedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    date: window.editingShift.date,
                    shiftType: window.editingShift.shiftType,
                    __RequestVerificationToken: token
                })
            });
        } catch (error) {
            console.error('Error deleting old shift:', error);
        }
    }
    
    // Check for conflicts (excluding current shift being edited)
    const conflicts = checkSchedulingConflicts(date, selectedStaff, shiftType);
    if (conflicts.length > 0 && !window.editingShift) {
        if (!confirm(`Warning: The following staff members are already scheduled for ${shiftType} shift on ${formatDate(date)}:\n${conflicts.join(', ')}\n\nDo you want to continue?`)) {
            return;
        }
    }
    
    // Get CSRF token
    const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
    
    // Build form data - arrays need to be sent as multiple parameters with same name
    const formData = new URLSearchParams();
    formData.append('date', date);
    formData.append('shiftType', shiftType);
    formData.append('notes', notes);
    formData.append('__RequestVerificationToken', token);
    
    // Append each staff ID separately (ASP.NET expects array as multiple parameters)
    selectedStaff.forEach(staffId => {
        formData.append('staffIds', staffId.toString());
    });
    
    console.log('Sending to backend:', {
        date: date,
        shiftType: shiftType,
        notes: notes,
        staffIds: selectedStaff,
        formDataString: formData.toString()
    });
    
    // Save to server
    try {
        const response = await fetch('/Schedules/SaveSchedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Shift scheduled successfully!');
            closeModal('addShiftModal');
            resetForm('addShiftForm');
            window.editingShift = null;
            // Reload page to refresh data
            window.location.reload();
        } else {
            showToast(result.message || 'Error saving schedule', 'error');
        }
    } catch (error) {
        console.error('Error saving schedule:', error);
        showToast('Error saving schedule', 'error');
    }
}

// Make it globally accessible
window.saveShift = saveShift;

// Set default date to today when modal opens and ensure staff is loaded
document.getElementById('addShiftModal')?.addEventListener('shown.bs.modal', function() {
    const dateInput = document.getElementById('shiftDate');
    if (dateInput && !dateInput.value && !window.editingShift) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Always ensure staff checkboxes are loaded when modal opens
    // Use setTimeout to ensure modal is fully rendered
    setTimeout(() => {
        loadStaffForScheduling();
        
        // If editing, check the boxes after they're loaded
        if (window.editingShift) {
            setTimeout(() => {
                const staffIds = window.editingShift.staffIds || [];
                const container = document.getElementById('staffCheckboxes');
                if (container) {
                    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                        const value = parseInt(checkbox.value);
                        checkbox.checked = staffIds.includes(value);
                    });
                }
            }, 100);
        }
    }, 100);
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

// HTML Export Function
function exportScheduleHTML() {
    try {
        // Get schedule data
        const scheduleData = window.schedulesData || {};
        const schedules = scheduleData.schedules || [];
        const staff = scheduleData.staffList || [];
        const startOfWeek = scheduleData.startOfWeek || new Date().toISOString().split('T')[0];
        const endOfWeek = scheduleData.endOfWeek || new Date().toISOString().split('T')[0];
        
        // Get shift counts
        const morningCount = scheduleData.morningCount || 0;
        const eveningCount = scheduleData.eveningCount || 0;
        const nightCount = scheduleData.nightCount || 0;
        
        // Get current week display
        const weekText = document.getElementById('currentWeek')?.textContent || 'Current Week';
        
        // Create HTML content
        const htmlContent = generateScheduleHTML(schedules, staff, startOfWeek, endOfWeek, weekText, morningCount, eveningCount, nightCount);
        
        // Create download link
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Schedule-Week-${startOfWeek}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('HTML schedule exported successfully!', 'success');
    } catch (error) {
        console.error('Schedule HTML export error:', error);
        showToast('Error generating HTML schedule: ' + error.message, 'error');
    }
}

function generateScheduleHTML(schedules, staff, startOfWeek, endOfWeek, weekText, morningCount, eveningCount, nightCount) {
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Parse start of week date
    let weekStart;
    try {
        if (startOfWeek.includes('T')) {
            weekStart = new Date(startOfWeek);
        } else {
            weekStart = new Date(startOfWeek + 'T00:00:00');
        }
        if (isNaN(weekStart.getTime())) {
            weekStart = new Date();
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
        }
    } catch (e) {
        weekStart = new Date();
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
    }
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Build schedule rows for all 7 days
    let scheduleRows = '';
    for (let index = 0; index < 7; index++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + index);
        const dateString = date.toISOString().split('T')[0];
        const dateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayName = days[index];
        
        // Get schedules for each shift
        const morningSchedules = schedules.filter(s => s.date === dateString && s.shiftType === 'Morning');
        const eveningSchedules = schedules.filter(s => s.date === dateString && s.shiftType === 'Evening');
        const nightSchedules = schedules.filter(s => s.date === dateString && s.shiftType === 'Night');
        
        // Build staff names for each shift
        const morningStaff = morningSchedules.length > 0 ? morningSchedules.map(s => {
            const member = staff.find(st => st.id === s.staffId);
            return member ? member.name : (s.staffName || 'Unknown');
        }).join(', ') : 'No staff assigned';
        
        const eveningStaff = eveningSchedules.length > 0 ? eveningSchedules.map(s => {
            const member = staff.find(st => st.id === s.staffId);
            return member ? member.name : (s.staffName || 'Unknown');
        }).join(', ') : 'No staff assigned';
        
        const nightStaff = nightSchedules.length > 0 ? nightSchedules.map(s => {
            const member = staff.find(st => st.id === s.staffId);
            return member ? member.name : (s.staffName || 'Unknown');
        }).join(', ') : 'No staff assigned';
        
        scheduleRows += '<tr>' +
            '<td><strong>' + dayName + '</strong><br><small style="color: #666;">' + dateDisplay + '</small></td>' +
            '<td>' + morningStaff + '</td>' +
            '<td>' + eveningStaff + '</td>' +
            '<td>' + nightStaff + '</td>' +
            '</tr>';
    }
    
    // Build complete HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Schedule - ${weekText}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            color: #333;
            background: #FFFFFF;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: #FFFFFF;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #6366F1;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #6366F1;
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header h2 {
            color: #666;
            font-size: 24px;
            font-weight: normal;
            margin-bottom: 10px;
        }
        .header p {
            color: #999;
            font-size: 14px;
            margin: 5px 0;
        }
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            color: #6366F1;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #E5E7EB;
        }
        .stat-morning {
            background: #FEF3C7;
        }
        .stat-evening {
            background: #DBEAFE;
        }
        .stat-night {
            background: #E9D5FF;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        .stat-morning .stat-value { color: #F59E0B; }
        .stat-evening .stat-value { color: #3B82F6; }
        .stat-night .stat-value { color: #8B5CF6; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 13px;
        }
        table thead {
            background: #6366F1;
            color: white;
        }
        table th {
            padding: 15px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
        }
        table td {
            padding: 12px;
            border: 1px solid #ddd;
            vertical-align: top;
        }
        table tbody tr:nth-child(even) {
            background: #F9FAFB;
        }
        table tbody tr:hover {
            background: #F3F4F6;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
        @media print {
            body {
                padding: 10px;
            }
            .section {
                page-break-inside: avoid;
            }
            table {
                page-break-inside: auto;
            }
            table tr {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Shefaa ICU Management System</h1>
            <h2>Staff Schedule</h2>
            <p>Generated on ${currentDate}</p>
            <p>${weekText}</p>
        </div>
        
        <div class="section">
            <h3 class="section-title">Today's Shift Summary</h3>
            <div class="stats-grid">
                <div class="stat-card stat-morning">
                    <div class="stat-value">${morningCount}</div>
                    <div class="stat-label">Morning Shift<br><small>08:00 AM - 04:00 PM</small></div>
                </div>
                <div class="stat-card stat-evening">
                    <div class="stat-value">${eveningCount}</div>
                    <div class="stat-label">Evening Shift<br><small>04:00 PM - 12:00 AM</small></div>
                </div>
                <div class="stat-card stat-night">
                    <div class="stat-value">${nightCount}</div>
                    <div class="stat-label">Night Shift<br><small>12:00 AM - 08:00 AM</small></div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3 class="section-title">Weekly Schedule</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">Day</th>
                        <th style="width: 28%;">Morning Shift<br><small style="font-weight: normal;">08:00 AM - 04:00 PM</small></th>
                        <th style="width: 28%;">Evening Shift<br><small style="font-weight: normal;">04:00 PM - 12:00 AM</small></th>
                        <th style="width: 28%;">Night Shift<br><small style="font-weight: normal;">12:00 AM - 08:00 AM</small></th>
                    </tr>
                </thead>
                <tbody>
                    ${scheduleRows}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>This schedule was generated automatically by Shefaa ICU Management System</p>
            <p>For questions or concerns, please contact the system administrator</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
}

// Make HTML export globally accessible
window.exportScheduleHTML = exportScheduleHTML;

// PDF Export Function (kept for backward compatibility)
async function exportSchedulePDF() {
    try {
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            showToast('PDF library not loaded. Please refresh the page.', 'error');
            console.error('html2pdf library not found');
            return;
        }
        
        showToast('Generating PDF...', 'info');
        
        // Get schedule data
        const scheduleData = window.schedulesData || {};
        const schedules = scheduleData.schedules || [];
        const staff = scheduleData.staffList || [];
        const startOfWeek = scheduleData.startOfWeek || new Date().toISOString().split('T')[0];
        const endOfWeek = scheduleData.endOfWeek || new Date().toISOString().split('T')[0];
        
        // Get shift counts
        const morningCount = scheduleData.morningCount || 0;
        const eveningCount = scheduleData.eveningCount || 0;
        const nightCount = scheduleData.nightCount || 0;
        
        // Get current week display
        const weekText = document.getElementById('currentWeek')?.textContent || 'Current Week';
        
        // Create PDF content
        const pdfContent = generateSchedulePDFTemplate(schedules, staff, startOfWeek, endOfWeek, weekText, morningCount, eveningCount, nightCount);
        
        // Remove any existing temp div
        const existingDiv = document.getElementById('schedule-pdf-content-temp');
        if (existingDiv) {
            existingDiv.remove();
        }
        
        // Create temporary element for PDF generation
        const tempDiv = document.createElement('div');
        tempDiv.id = 'schedule-pdf-content-temp';
        tempDiv.innerHTML = pdfContent;
        
        // Style the container for PDF
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '0px';
        tempDiv.style.left = '0px';
        tempDiv.style.width = '210mm';
        tempDiv.style.minHeight = 'auto';
        tempDiv.style.padding = '15px';
        tempDiv.style.backgroundColor = '#FFFFFF';
        tempDiv.style.zIndex = '99999';
        tempDiv.style.visibility = 'visible';
        tempDiv.style.opacity = '1';
        tempDiv.style.color = '#000000';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.fontSize = '12px';
        tempDiv.style.lineHeight = '1.4';
        tempDiv.style.overflow = 'visible';
        tempDiv.style.display = 'block';
        
        // Append to body
        document.body.appendChild(tempDiv);
        
        // Force a reflow
        const scrollHeight = tempDiv.scrollHeight;
        const scrollWidth = tempDiv.scrollWidth;
        console.log('Schedule PDF temp div dimensions:', scrollWidth, 'x', scrollHeight);
        console.log('Table rows in HTML:', (tempDiv.innerHTML.match(/<tr>/g) || []).length);
        
        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify content
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        console.log('Schedule PDF text content length:', textContent.length);
        console.log('Days found in content:', (textContent.match(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/g) || []).length);
        
        if (textContent.length < 10) {
            throw new Error('PDF content appears to be empty');
        }
        
        // Generate PDF - use landscape for better table display
        const opt = {
            margin: [5, 5, 5, 5],
            filename: `Schedule-Week-${startOfWeek}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { 
                scale: 1.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#FFFFFF',
                width: scrollWidth || 1123,
                height: scrollHeight || 794,
                windowWidth: scrollWidth || 1123,
                windowHeight: scrollHeight || 794,
                x: 0,
                y: 0,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
                removeContainer: false
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'landscape',
                compress: true
            },
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy']
            }
        };
        
        // Generate PDF
        const pdf = await html2pdf().set(opt).from(tempDiv).outputPdf('blob');
        
        // Create download link
        const url = URL.createObjectURL(pdf);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Schedule-Week-${startOfWeek}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Remove temporary element
        setTimeout(() => {
            const element = document.getElementById('schedule-pdf-content-temp');
            if (element && element.parentNode) {
                element.remove();
            }
        }, 3000);
        
        showToast('PDF exported successfully!', 'success');
    } catch (error) {
        console.error('Schedule PDF export error:', error);
        showToast('Error generating PDF: ' + error.message, 'error');
        
        // Clean up on error
        const tempDiv = document.getElementById('schedule-pdf-content-temp');
        if (tempDiv && tempDiv.parentNode) {
            tempDiv.remove();
        }
    }
}

function generateSchedulePDFTemplate(schedules, staff, startOfWeek, endOfWeek, weekText, morningCount, eveningCount, nightCount) {
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Parse start of week date properly
    let weekStart;
    try {
        if (startOfWeek.includes('T')) {
            weekStart = new Date(startOfWeek);
        } else {
            weekStart = new Date(startOfWeek + 'T00:00:00');
        }
        
        // If date is invalid, use today
        if (isNaN(weekStart.getTime())) {
            weekStart = new Date();
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
        }
    } catch (e) {
        weekStart = new Date();
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
    }
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    console.log('Building schedule for week starting:', startOfWeek, 'parsed as:', weekStart.toISOString());
    console.log('Total schedules:', schedules.length);
    console.log('Total staff:', staff.length);
    
    // Build schedule data for all 7 days
    const scheduleData = [];
    for (let index = 0; index < 7; index++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + index);
        const dateString = date.toISOString().split('T')[0];
        const dateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayName = days[index];
        
        // Get schedules for each shift
        const morningSchedules = schedules.filter(s => s.date === dateString && s.shiftType === 'Morning');
        const eveningSchedules = schedules.filter(s => s.date === dateString && s.shiftType === 'Evening');
        const nightSchedules = schedules.filter(s => s.date === dateString && s.shiftType === 'Night');
        
        // Build staff names for each shift
        const morningStaff = morningSchedules.length > 0 ? morningSchedules.map(s => {
            const member = staff.find(st => st.id === s.staffId);
            return member ? member.name : (s.staffName || 'Unknown');
        }).join(', ') : 'No staff assigned';
        
        const eveningStaff = eveningSchedules.length > 0 ? eveningSchedules.map(s => {
            const member = staff.find(st => st.id === s.staffId);
            return member ? member.name : (s.staffName || 'Unknown');
        }).join(', ') : 'No staff assigned';
        
        const nightStaff = nightSchedules.length > 0 ? nightSchedules.map(s => {
            const member = staff.find(st => st.id === s.staffId);
            return member ? member.name : (s.staffName || 'Unknown');
        }).join(', ') : 'No staff assigned';
        
        scheduleData.push({
            dayName: dayName,
            dateDisplay: dateDisplay,
            dateString: dateString,
            morningStaff: morningStaff,
            eveningStaff: eveningStaff,
            nightStaff: nightStaff
        });
        
        console.log(`Day ${index + 1}: ${dayName} (${dateString}) - Morning: ${morningSchedules.length}, Evening: ${eveningSchedules.length}, Night: ${nightSchedules.length}`);
    }
    
    console.log('Schedule data built for', scheduleData.length, 'days');
    
    // Build HTML template - create structure first, then populate
    let html = '<div style="font-family: Arial, sans-serif; color: #333; background: #FFFFFF; width: 100%; display: block; padding: 15px;">';
    
    // Header Section
    html += '<div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid #6366F1; padding-bottom: 15px;">';
    html += '<h1 style="color: #6366F1; margin: 0; font-size: 24px; font-weight: bold;">Shefaa ICU Management System</h1>';
    html += '<h2 style="color: #666; margin: 8px 0 0 0; font-size: 18px; font-weight: normal;">Staff Schedule</h2>';
    html += '<p style="color: #999; margin: 8px 0 0 0; font-size: 12px;">Generated on ' + currentDate + '</p>';
    html += '<p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">' + weekText + '</p>';
    html += '</div>';
    
    // Shift Summary Section
    html += '<div style="margin-bottom: 25px; display: block;">';
    html += '<h3 style="color: #6366F1; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 15px; font-size: 16px;">Today\'s Shift Summary</h3>';
    html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">';
    html += '<tr>';
    html += '<td style="width: 33.33%; padding: 12px; text-align: center; background: #FEF3C7; border: 1px solid #E5E7EB;">';
    html += '<div style="font-size: 20px; font-weight: bold; color: #F59E0B;">' + morningCount + '</div>';
    html += '<div style="color: #666; margin-top: 5px; font-size: 12px;">Morning Shift</div>';
    html += '</td>';
    html += '<td style="width: 33.33%; padding: 12px; text-align: center; background: #DBEAFE; border: 1px solid #E5E7EB;">';
    html += '<div style="font-size: 20px; font-weight: bold; color: #3B82F6;">' + eveningCount + '</div>';
    html += '<div style="color: #666; margin-top: 5px; font-size: 12px;">Evening Shift</div>';
    html += '</td>';
    html += '<td style="width: 33.33%; padding: 12px; text-align: center; background: #E9D5FF; border: 1px solid #E5E7EB;">';
    html += '<div style="font-size: 20px; font-weight: bold; color: #8B5CF6;">' + nightCount + '</div>';
    html += '<div style="color: #666; margin-top: 5px; font-size: 12px;">Night Shift</div>';
    html += '</td>';
    html += '</tr>';
    html += '</table>';
    html += '</div>';
    
    // Weekly Schedule Table Section
    html += '<div style="margin-bottom: 20px; display: block;">';
    html += '<h3 style="color: #6366F1; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 15px; font-size: 16px;">Weekly Schedule</h3>';
    html += '<table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #ddd; table-layout: fixed;">';
    
    // Table Header
    html += '<thead>';
    html += '<tr style="background: #6366F1; color: white;">';
    html += '<th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; font-size: 11px; width: 15%;">Day</th>';
    html += '<th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; font-size: 11px; width: 28%;">Morning Shift<br><small style="font-weight: normal; font-size: 9px;">08:00 AM - 04:00 PM</small></th>';
    html += '<th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; font-size: 11px; width: 28%;">Evening Shift<br><small style="font-weight: normal; font-size: 9px;">04:00 PM - 12:00 AM</small></th>';
    html += '<th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; font-size: 11px; width: 28%;">Night Shift<br><small style="font-weight: normal; font-size: 9px;">12:00 AM - 08:00 AM</small></th>';
    html += '</tr>';
    html += '</thead>';
    
    // Table Body - Populate with data
    html += '<tbody>';
    scheduleData.forEach((dayData, index) => {
        html += '<tr>';
        html += '<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; font-size: 11px;">' + dayData.dayName + '<br><small style="color: #666; font-size: 9px;">' + dayData.dateDisplay + '</small></td>';
        html += '<td style="padding: 8px; border: 1px solid #ddd; font-size: 10px;">' + dayData.morningStaff + '</td>';
        html += '<td style="padding: 8px; border: 1px solid #ddd; font-size: 10px;">' + dayData.eveningStaff + '</td>';
        html += '<td style="padding: 8px; border: 1px solid #ddd; font-size: 10px;">' + dayData.nightStaff + '</td>';
        html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';
    html += '</div>';
    
    // Footer Section
    html += '<div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #E5E7EB; text-align: center; color: #999; font-size: 11px;">';
    html += '<p style="margin: 5px 0;">This schedule was generated automatically by Shefaa ICU Management System</p>';
    html += '</div>';
    html += '</div>';
    
    console.log('HTML template built, length:', html.length);
    console.log('Number of table rows in HTML:', (html.match(/<tr>/g) || []).length);
    
    return html;
}

// Make function globally accessible
window.exportSchedulePDF = exportSchedulePDF;

