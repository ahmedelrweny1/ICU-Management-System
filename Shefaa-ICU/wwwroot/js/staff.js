// ===================================
// Staff Page JavaScript
// ===================================

let currentStaffFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    loadStaff();
    initializeStaffSearch();
});

function loadStaff() {
    const staff = DataManager.getStaff();
    displayStaff(staff);
    updateStaffStatistics(staff);
}

function displayStaff(staff) {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;
    
    // Apply filter
    let filtered = staff;
    if (currentStaffFilter !== 'all') {
        filtered = staff.filter(s => s.role === currentStaffFilter);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No staff found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(member => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random" 
                         style="width: 40px; height: 40px; border-radius: 50%;" alt="${member.name}">
                    <div>
                        <div><strong>${member.name}</strong></div>
                        <small class="text-muted">${member.id}</small>
                    </div>
                </div>
            </td>
            <td>
                <div>${member.role}</div>
                <small class="text-muted">${member.specialty || '-'}</small>
            </td>
            <td>
                <div><i class="fas fa-envelope"></i> ${member.email}</div>
                <div><i class="fas fa-phone"></i> ${member.phone}</div>
            </td>
            <td>
                <span class="badge ${getStatusBadgeClass(member.status)}">${member.status}</span>
                ${member.checkInTime ? `<div><small>Checked in: ${member.checkInTime}</small></div>` : ''}
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editStaff('${member.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="registerAttendance('${member.id}')">
                    <i class="fas fa-clock"></i> Attendance
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStaffStatistics(staff) {
    const total = staff.length;
    const doctors = staff.filter(s => s.role === 'Doctor').length;
    const nurses = staff.filter(s => s.role === 'Nurse').length;
    const onDuty = staff.filter(s => s.status === 'On Duty').length;
    
    const totalEl = document.getElementById('totalStaffCount');
    const doctorsEl = document.getElementById('doctorsCount');
    const nursesEl = document.getElementById('nursesCount');
    const onDutyEl = document.getElementById('onDutyCount');
    
    if (totalEl) animateNumber(totalEl, 0, total, 1000);
    if (doctorsEl) animateNumber(doctorsEl, 0, doctors, 1000);
    if (nursesEl) animateNumber(nursesEl, 0, nurses, 1000);
    if (onDutyEl) animateNumber(onDutyEl, 0, onDuty, 1000);
}

function filterStaff(filter) {
    currentStaffFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.filter-btn').classList.add('active');
    
    loadStaff();
}

function saveStaff() {
    const name = document.getElementById('staffName').value.trim();
    const role = document.getElementById('staffRole').value;
    const specialty = document.getElementById('staffSpecialty').value.trim();
    const phone = document.getElementById('staffPhone').value.trim();
    const email = document.getElementById('staffEmail').value.trim();
    
    // Validation
    if (!name || !role || !phone || !email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    const staffMember = {
        name,
        role,
        specialty,
        phone,
        email,
        status: 'Off Duty',
        checkInTime: null,
        checkOutTime: null
    };
    
    DataManager.addStaff(staffMember);
    
    DataManager.addActivity({
        time: 'Just now',
        text: `New staff member ${name} (${role}) added`
    });
    
    showToast('Staff member added successfully!');
    
    closeModal('addStaffModal');
    resetForm('addStaffForm');
    loadStaff();
}

function editStaff(staffId) {
    const member = DataManager.getStaffMember(staffId);
    if (!member) return;
    
    // Populate form
    document.getElementById('editStaffId').value = member.id;
    document.getElementById('editStaffName').value = member.name;
    document.getElementById('editStaffRole').value = member.role;
    document.getElementById('editStaffSpecialty').value = member.specialty || '';
    document.getElementById('editStaffPhone').value = member.phone;
    document.getElementById('editStaffEmail').value = member.email;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editStaffModal'));
    modal.show();
}

function updateStaff() {
    const id = document.getElementById('editStaffId').value;
    const name = document.getElementById('editStaffName').value.trim();
    const role = document.getElementById('editStaffRole').value;
    const specialty = document.getElementById('editStaffSpecialty').value.trim();
    const phone = document.getElementById('editStaffPhone').value.trim();
    const email = document.getElementById('editStaffEmail').value.trim();
    
    // Validation
    if (!name || !role || !phone || !email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    DataManager.updateStaff(id, {
        name,
        role,
        specialty,
        phone,
        email
    });
    
    showToast('Staff member updated successfully!');
    
    closeModal('editStaffModal');
    loadStaff();
}

function registerAttendance(staffId) {
    const member = DataManager.getStaffMember(staffId);
    if (!member) return;
    
    // Set current time
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    document.getElementById('attendanceTime').value = timeString;
    
    // Set staff ID
    document.getElementById('attendanceStaffId').value = staffId;
    
    // Set default action based on current status
    const action = member.status === 'On Duty' ? 'check-out' : 'check-in';
    document.getElementById('attendanceAction').value = action;
    
    // Update modal title
    document.getElementById('attendanceModalTitle').textContent = 
        `Register Attendance - ${member.name}`;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('attendanceModal'));
    modal.show();
}

function saveAttendance() {
    const staffId = document.getElementById('attendanceStaffId').value;
    const time = document.getElementById('attendanceTime').value;
    const action = document.getElementById('attendanceAction').value;
    
    if (!time) {
        showToast('Please enter a time', 'error');
        return;
    }
    
    const updates = {};
    
    if (action === 'check-in') {
        updates.status = 'On Duty';
        updates.checkInTime = time;
        updates.checkOutTime = null;
    } else {
        updates.status = 'Off Duty';
        updates.checkOutTime = time;
    }
    
    DataManager.updateStaff(staffId, updates);
    
    const member = DataManager.getStaffMember(staffId);
    DataManager.addActivity({
        time: 'Just now',
        text: `${member.name} ${action === 'check-in' ? 'checked in' : 'checked out'} at ${time}`
    });
    
    showToast(`Attendance registered successfully!`);
    
    closeModal('attendanceModal');
    loadStaff();
}

function initializeStaffSearch() {
    const searchInput = document.getElementById('staffSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const staff = DataManager.getStaff();
        
        const filtered = staff.filter(s =>
            s.name.toLowerCase().includes(searchTerm) ||
            s.id.toLowerCase().includes(searchTerm) ||
            s.role.toLowerCase().includes(searchTerm) ||
            s.email.toLowerCase().includes(searchTerm)
        );
        
        displayStaff(filtered);
    });
}

