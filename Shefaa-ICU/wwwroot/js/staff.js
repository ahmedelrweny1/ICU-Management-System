// ===================================
// Staff Page JavaScript
// ===================================

let currentStaffFilter = 'all';

const getStaffData = () => Array.isArray(window.staffData) ? window.staffData : [];

document.addEventListener('DOMContentLoaded', function () {
    loadStaff();
    initializeStaffSearch();
});

function loadStaff() {
    const staff = getStaffData();
    displayStaff(staff);
    updateStaffStatistics(staff);
}

function displayStaff(staff) {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;

    let filtered = staff;
    if (currentStaffFilter !== 'all') {
        filtered = staff.filter(s => (s.role ?? s.Role) === currentStaffFilter);
    }

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No staff found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(member => {
        const id = member.id ?? member.Id ?? '';
        const name = member.name ?? member.Name ?? 'Unnamed';
        const role = member.role ?? member.Role ?? '';
        const specialty = member.specialty ?? member.Specialty ?? '-';
        const email = member.email ?? member.Email ?? '';
        const phone = member.phone ?? member.Phone ?? '';
        const status = member.status ?? member.Status ?? 'Off Duty';
        const checkInTime = member.checkInTime ?? member.CheckInTime ?? '';

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random"
                             style="width: 40px; height: 40px; border-radius: 50%;" alt="${name}">
                        <div>
                            <div><strong>${name}</strong></div>
                            <small class="text-muted">${id}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div>${role}</div>
                    <small class="text-muted">${specialty}</small>
                </td>
                <td>
                    <div><i class="fas fa-envelope"></i> ${email}</div>
                    <div><i class="fas fa-phone"></i> ${phone}</div>
                </td>
                <td>
                    <span class="badge ${getStatusBadgeClass(status)}">${status}</span>
                    ${checkInTime ? `<div><small>Checked in: ${checkInTime}</small></div>` : ''}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editStaff('${id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="registerAttendance('${id}')">
                        <i class="fas fa-clock"></i> Attendance
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStaffStatistics(staff) {
    const total = staff.length;
    const doctors = staff.filter(s => (s.role ?? s.Role) === 'Doctor').length;
    const nurses = staff.filter(s => (s.role ?? s.Role) === 'Nurse').length;
    const onDuty = staff.filter(s => (s.status ?? s.Status) === 'On Duty').length;

    const totalEl = document.getElementById('totalStaffCount');
    const doctorsEl = document.getElementById('doctorsCount');
    const nursesEl = document.getElementById('nursesCount');
    const onDutyEl = document.getElementById('onDutyCount');

    if (totalEl) animateNumber(totalEl, 0, total, 1000);
    if (doctorsEl) animateNumber(doctorsEl, 0, doctors, 1000);
    if (nursesEl) animateNumber(nursesEl, 0, nurses, 1000);
    if (onDutyEl) animateNumber(onDutyEl, 0, onDuty, 1000);
}

function filterStaff(filter, evt) {
    currentStaffFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const button = evt?.target?.closest('.filter-btn');
    if (button) {
        button.classList.add('active');
    }
    loadStaff();
}

async function saveStaff() {
    const name = document.getElementById('staffName').value.trim();
    const role = document.getElementById('staffRole').value;
    const specialty = document.getElementById('staffSpecialty').value.trim();
    const phone = document.getElementById('staffPhone').value.trim();
    const email = document.getElementById('staffEmail').value.trim();

    if (!name || !role || !phone || !email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    const payload = {
        name,
        role,
        specialty,
        phone,
        email
    };

    await postStaffAction('/Staff/AddStaff', payload, () => {
        closeModal('addStaffModal');
        resetForm('addStaffForm');
    });
}

function editStaff(staffId) {
    const member = getStaffData().find(s => (s.id ?? s.Id) === staffId);
    if (!member) return;

    document.getElementById('editStaffId').value = member.id ?? member.Id ?? '';
    document.getElementById('editStaffName').value = member.name ?? member.Name ?? '';
    document.getElementById('editStaffRole').value = member.role ?? member.Role ?? '';
    document.getElementById('editStaffSpecialty').value = member.specialty ?? member.Specialty ?? '';
    document.getElementById('editStaffPhone').value = member.phone ?? member.Phone ?? '';
    document.getElementById('editStaffEmail').value = member.email ?? member.Email ?? '';

    const modal = new bootstrap.Modal(document.getElementById('editStaffModal'));
    modal.show();
}

async function updateStaff() {
    const id = document.getElementById('editStaffId').value;
    const name = document.getElementById('editStaffName').value.trim();
    const role = document.getElementById('editStaffRole').value;
    const specialty = document.getElementById('editStaffSpecialty').value.trim();
    const phone = document.getElementById('editStaffPhone').value.trim();
    const email = document.getElementById('editStaffEmail').value.trim();

    if (!name || !role || !phone || !email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    const payload = {
        id,
        name,
        role,
        specialty,
        phone,
        email
    };

    await postStaffAction('/Staff/UpdateStaff', payload, () => {
        closeModal('editStaffModal');
    });
}

function registerAttendance(staffId) {
    const member = getStaffData().find(s => (s.id ?? s.Id) === staffId);
    if (!member) return;

    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    document.getElementById('attendanceTime').value = timeString;
    document.getElementById('attendanceStaffId').value = staffId;

    const action = (member.status ?? member.Status) === 'On Duty' ? 'check-out' : 'check-in';
    document.getElementById('attendanceAction').value = action;
    document.getElementById('attendanceModalTitle').textContent = `Register Attendance - ${member.name ?? member.Name ?? ''}`;

    const modal = new bootstrap.Modal(document.getElementById('attendanceModal'));
    modal.show();
}

async function saveAttendance() {
    const staffId = document.getElementById('attendanceStaffId').value;
    const time = document.getElementById('attendanceTime').value;
    const action = document.getElementById('attendanceAction').value;

    if (!time) {
        showToast('Please enter a time', 'error');
        return;
    }

    const payload = {
        staffId,
        time,
        action
    };

    await postStaffAction('/Staff/RegisterAttendance', payload, () => {
        closeModal('attendanceModal');
    });
}

function initializeStaffSearch() {
    const searchInput = document.getElementById('staffSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = (e.target.value || '').toLowerCase();
        const staff = getStaffData();

        const filtered = staff.filter(s => {
            const name = (s.name ?? s.Name ?? '').toLowerCase();
            const id = (s.id ?? s.Id ?? '').toLowerCase();
            const role = (s.role ?? s.Role ?? '').toLowerCase();
            const email = (s.email ?? s.Email ?? '').toLowerCase();
            return name.includes(searchTerm) || id.includes(searchTerm) || role.includes(searchTerm) || email.includes(searchTerm);
        });

        displayStaff(filtered);
    });
}

async function postStaffAction(url, payload, onBeforeReload) {
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
            if (typeof onBeforeReload === 'function') {
                onBeforeReload();
            }
            window.location.reload();
        }
    } catch (error) {
        console.error('Staff action failed', error);
        showToast('Unable to reach the server right now.', 'error');
    }
}

