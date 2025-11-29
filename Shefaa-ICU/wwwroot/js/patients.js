// Pure MVC - only client-side filtering and UI interactions, no API calls

document.addEventListener('DOMContentLoaded', function() {
    initializePatientSearch();
    updateFilterCounts();
});

function updateFilterCounts() {
    const rows = document.querySelectorAll('#patientsTableBody tr');
    const allCount = rows.length;
    const criticalCount = Array.from(rows).filter(row => 
        row.querySelector('.badge')?.textContent?.toLowerCase() === 'critical'
    ).length;
    const stableCount = Array.from(rows).filter(row => 
        row.querySelector('.badge')?.textContent?.toLowerCase() === 'stable'
    ).length;
    const moderateCount = Array.from(rows).filter(row => 
        row.querySelector('.badge')?.textContent?.toLowerCase() === 'moderate'
    ).length;

    document.getElementById('allCount').textContent = allCount;
    document.getElementById('criticalCount').textContent = criticalCount;
    document.getElementById('stableCount').textContent = stableCount;
    document.getElementById('moderateCount').textContent = moderateCount;
}

function filterPatients(condition, event) {
    event.preventDefault();
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const rows = document.querySelectorAll('#patientsTableBody tr');
    rows.forEach(row => {
        if (condition === 'all') {
            row.style.display = '';
        } else {
            const badge = row.querySelector('.badge');
            const conditionText = badge?.textContent?.trim() || '';
            row.style.display = conditionText.toLowerCase() === condition.toLowerCase() ? '' : 'none';
        }
    });
}

function initializePatientSearch() {
    const searchInput = document.getElementById('patientSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#patientsTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

function exportCSV() {
    const rows = document.querySelectorAll('#patientsTableBody tr:not([style*="display: none"])');
    let csv = 'Name,Patient ID,Status,Room,Admission Date,Days in ICU\n';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            const name = cells[0].querySelector('strong')?.textContent || '';
            const code = cells[1].textContent.trim();
            const condition = cells[2].textContent.trim();
            const room = cells[3].textContent.trim();
            const admissionDate = cells[4].textContent.trim();
            const days = cells[5].textContent.trim();
            
            csv += `"${name}","${code}","${condition}","${room}","${admissionDate}","${days}"\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}
