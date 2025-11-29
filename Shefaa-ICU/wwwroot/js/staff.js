// Pure MVC - only client-side filtering and UI interactions, no data fetching

let currentStaffFilter = 'all';

document.addEventListener('DOMContentLoaded', function () {
    initializeStaffSearch();
    updateStaffStatistics();
});

function filterStaff(role, event) {
    event.preventDefault();
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    currentStaffFilter = role;
    
    const rows = document.querySelectorAll('#staffTableBody tr');
    rows.forEach(row => {
        if (role === 'all') {
            row.style.display = '';
        } else {
            const rowRole = row.getAttribute('data-role') || '';
            row.style.display = rowRole === role ? '' : 'none';
        }
    });
}

function initializeStaffSearch() {
    const searchInput = document.getElementById('staffSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#staffTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

function updateStaffStatistics() {
    const rows = document.querySelectorAll('#staffTableBody tr:not([style*="display: none"])');
    const allCount = rows.length;
    
    const doctorCount = Array.from(rows).filter(row => 
        row.getAttribute('data-role') === 'Doctor'
    ).length;
    
    const nurseCount = Array.from(rows).filter(row => 
        row.getAttribute('data-role') === 'Nurse'
    ).length;
    
    const technicianCount = Array.from(rows).filter(row => 
        row.getAttribute('data-role') === 'Technician'
    ).length;
    
    const allCountEl = document.getElementById('allStaffCount');
    const doctorCountEl = document.getElementById('doctorCount');
    const nurseCountEl = document.getElementById('nurseCount');
    const technicianCountEl = document.getElementById('technicianCount');
    
    if (allCountEl) allCountEl.textContent = allCount;
    if (doctorCountEl) doctorCountEl.textContent = doctorCount;
    if (nurseCountEl) nurseCountEl.textContent = nurseCount;
    if (technicianCountEl) technicianCountEl.textContent = technicianCount;
}

async function editStaff(staffId) {
    try {
        const response = await fetch(`/Staff/Edit?id=${staffId}`);
        if (!response.ok) {
            throw new Error('Failed to load staff data');
        }
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract staff data from the response (assuming it's in ViewBag.StaffMember)
        // Since we can't directly access server-side ViewBag, we'll need to make an API call
        // For now, let's use a simpler approach - redirect to edit page or use a different method
        
        // Alternative: Use a GET endpoint that returns JSON
        const jsonResponse = await fetch(`/Staff/GetStaffMember?id=${staffId}`);
        if (jsonResponse.ok) {
            const staffData = await jsonResponse.json();
            if (staffData.success && staffData.data) {
                const staff = staffData.data;
                
                // Populate edit form
                document.getElementById('editStaffId').value = staff.id || staff.ID;
                document.getElementById('editName').value = staff.name || staff.Name || '';
                document.getElementById('editRole').value = staff.role || staff.Role || '';
                document.getElementById('editUsername').value = staff.username || staff.Username || '';
                document.getElementById('editSpecialty').value = staff.specialty || staff.Specialty || '';
                document.getElementById('editEmail').value = staff.email || staff.Email || '';
                document.getElementById('editPhoneNumber').value = staff.phoneNumber || staff.PhoneNumber || '';
                document.getElementById('editStatus').value = staff.status || staff.Status || 'Active';
                
                // Update form action with correct ID
                const form = document.getElementById('editStaffForm');
                form.action = `/Staff/Update?id=${staff.id || staff.ID}`;
                
                // Show modal
                const editModal = new bootstrap.Modal(document.getElementById('editStaffModal'));
                editModal.show();
            } else {
                showToast('Failed to load staff data', 'error');
            }
        } else {
            // Fallback: redirect to edit page
            window.location.href = `/Staff/Edit?id=${staffId}`;
        }
    } catch (error) {
        console.error('Error loading staff data:', error);
        showToast('Error loading staff data', 'error');
        // Fallback: redirect to edit page
        window.location.href = `/Staff/Edit?id=${staffId}`;
    }
}

function registerAttendance(staffId) {
    document.getElementById('checkInStaffId').value = staffId;
    document.getElementById('checkOutStaffId').value = staffId;
    document.getElementById('attendanceMessage').textContent = 'Select Check In or Check Out for this staff member.';
    
    const attendanceModal = new bootstrap.Modal(document.getElementById('attendanceModal'));
    attendanceModal.show();
}
