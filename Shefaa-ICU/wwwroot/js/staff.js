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
