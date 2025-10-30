// ===================================
// Reports Page JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    loadReports();
    initializeReportCharts();
});

function loadReports() {
    const patients = DataManager.getPatients();
    const rooms = DataManager.getRooms();
    const staff = DataManager.getStaff();
    
    updateReportStatistics(patients, rooms, staff);
    loadPatientReportTable(patients);
}

function updateReportStatistics(patients, rooms, staff) {
    // Patient Demographics
    const totalAdmissions = patients.length;
    const ages = patients.map(p => p.age);
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    
    // Calculate average length of stay
    const avgStay = patients.reduce((sum, p) => {
        return sum + calculateDaysInICU(p.admissionDate);
    }, 0) / patients.length;
    
    document.getElementById('totalAdmissions').textContent = totalAdmissions;
    document.getElementById('avgLengthStay').textContent = avgStay.toFixed(1) + ' Days';
    document.getElementById('ageRange').textContent = `${minAge} - ${maxAge}`;
    
    // Room Occupancy
    const occupied = rooms.filter(r => r.status === 'Occupied').length;
    const occupancyRate = ((occupied / rooms.length) * 100).toFixed(0);
    
    document.getElementById('occupancyRate').textContent = occupancyRate + '%';
    document.getElementById('totalBeds').textContent = rooms.length;
    document.getElementById('avgTurnover').textContent = '2.3 Days';
    
    // Staff Performance
    const totalShifts = 360; // Sample data
    const avgAttendance = 92;
    const staffUtilization = 85;
    
    document.getElementById('avgAttendance').textContent = avgAttendance + '%';
    document.getElementById('totalShifts').textContent = totalShifts;
    document.getElementById('staffUtilization').textContent = staffUtilization + '%';
    
    // Update report period
    const dateRange = document.getElementById('dateRange').value;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));
    
    document.getElementById('reportPeriod').textContent = 
        `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
}

function loadPatientReportTable(patients) {
    const tbody = document.getElementById('patientReportTable');
    if (!tbody) return;
    
    if (patients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No patients found</td></tr>';
        return;
    }
    
    tbody.innerHTML = patients.map(patient => `
        <tr>
            <td>${patient.id}</td>
            <td>${patient.name}</td>
            <td>${patient.age}</td>
            <td><span class="badge ${getConditionBadgeClass(patient.condition)}">${patient.condition}</span></td>
            <td>${formatDate(patient.admissionDate)}</td>
        </tr>
    `).join('');
}

function initializeReportCharts() {
    // Admissions Chart
    const admissionsCtx = document.getElementById('admissionsChart');
    if (admissionsCtx) {
        new Chart(admissionsCtx, {
            type: 'bar',
            data: {
                labels: ['Oct 1', 'Oct 5', 'Oct 10', 'Oct 15', 'Oct 20', 'Oct 25', 'Oct 30'],
                datasets: [{
                    label: 'Number of Admissions',
                    data: [5, 8, 6, 9, 7, 10, 8],
                    backgroundColor: '#4F46E5',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 2
                        }
                    }
                }
            }
        });
    }
    
    // Age Group Chart
    const ageGroupCtx = document.getElementById('ageGroupChart');
    if (ageGroupCtx) {
        const patients = DataManager.getPatients();
        const ageGroups = {
            '0-30': 0,
            '31-50': 0,
            '51-70': 0,
            '71+': 0
        };
        
        patients.forEach(p => {
            if (p.age <= 30) ageGroups['0-30']++;
            else if (p.age <= 50) ageGroups['31-50']++;
            else if (p.age <= 70) ageGroups['51-70']++;
            else ageGroups['71+']++;
        });
        
        new Chart(ageGroupCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(ageGroups),
                datasets: [{
                    data: Object.values(ageGroups),
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Occupancy Trend Chart
    const occupancyTrendCtx = document.getElementById('occupancyTrendChart');
    if (occupancyTrendCtx) {
        new Chart(occupancyTrendCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Occupancy Rate (%)',
                    data: [80, 75, 85, 70],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    // Staff Attendance Chart
    const staffAttendanceCtx = document.getElementById('staffAttendanceChart');
    if (staffAttendanceCtx) {
        new Chart(staffAttendanceCtx, {
            type: 'bar',
            data: {
                labels: ['Doctors', 'Nurses', 'Technicians', 'Admin'],
                datasets: [{
                    label: 'Attendance Rate (%)',
                    data: [95, 92, 88, 90],
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#6B7280'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

// Export functions will be implemented with ASP.NET MVC backend
function exportPDF() {
    showToast('PDF export will be available with ASP.NET MVC backend', 'info');
}

function exportCSV() {
    showToast('CSV export will be available with ASP.NET MVC backend', 'info');
}

