// ===================================
// Reports Page JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    loadReports();
    initializeReportCharts();
});

function loadReports() {
    const patients = window.reportsData?.patients || [];
    const rooms = window.reportsData?.rooms || [];
    const staff = window.reportsData?.staff || [];

    updateReportStatistics(patients, rooms, staff);
    loadPatientReportTable(patients);
}

function updateReportStatistics(patients, rooms, staff) {
    // Use server data if available
    if (window.reportsData) {
        document.getElementById('totalAdmissions').textContent = window.reportsData.totalAdmissions || 0;
        document.getElementById('avgLengthStay').textContent = (window.reportsData.avgStay || 0).toFixed(1) + ' Days';
        document.getElementById('ageRange').textContent = `${window.reportsData.minAge || 0} - ${window.reportsData.maxAge || 0}`;
        
        document.getElementById('occupancyRate').textContent = (window.reportsData.occupancyRate || 0).toFixed(0) + '%';
        document.getElementById('totalBeds').textContent = window.reportsData.totalBeds || 0;
        document.getElementById('avgTurnover').textContent = '2.3 Days'; // Can be calculated later
        
        document.getElementById('avgAttendance').textContent = '92%'; // Can be calculated from attendance logs later
        document.getElementById('totalShifts').textContent = window.reportsData.totalShifts || 0;
        document.getElementById('staffUtilization').textContent = (window.reportsData.staffUtilization || 0).toFixed(0) + '%';
    } else {
        // Fallback calculation from arrays
        const totalAdmissions = patients.length;
        const ages = patients.map(p => p.age || 0).filter(a => a > 0);
        const minAge = ages.length > 0 ? Math.min(...ages) : 0;
        const maxAge = ages.length > 0 ? Math.max(...ages) : 0;
        
        const avgStay = patients.length > 0 ? patients.reduce((sum, p) => {
            return sum + calculateDaysInICU(p.admissionDate);
        }, 0) / patients.length : 0;
        
        document.getElementById('totalAdmissions').textContent = totalAdmissions;
        document.getElementById('avgLengthStay').textContent = avgStay.toFixed(1) + ' Days';
        document.getElementById('ageRange').textContent = `${minAge} - ${maxAge}`;
        
        const occupied = rooms.filter(r => r.status === 'Occupied').length;
        const occupancyRate = rooms.length > 0 ? ((occupied / rooms.length) * 100).toFixed(0) : 0;
        
        document.getElementById('occupancyRate').textContent = occupancyRate + '%';
        document.getElementById('totalBeds').textContent = rooms.length;
        document.getElementById('avgTurnover').textContent = '2.3 Days';
        
        document.getElementById('avgAttendance').textContent = '92%';
        document.getElementById('totalShifts').textContent = 360;
        document.getElementById('staffUtilization').textContent = '85%';
    }
    
    // Update report period
    const dateRange = document.getElementById('dateRange')?.value || '30';
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));
    
    const reportPeriodEl = document.getElementById('reportPeriod');
    if (reportPeriodEl) {
        reportPeriodEl.textContent = 
            `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }
}

// Store original filtered data
let filteredPatients = [];

function loadPatientReportTable(patients) {
    const tbody = document.getElementById('patientReportTable');
    if (!tbody) return;
    
    // Store for filtering
    filteredPatients = patients;
    
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

// Search functionality
function filterReports(searchTerm) {
    if (!window.reportsData) return;
    
    const allPatients = window.reportsData.patients || [];
    let filtered = allPatients;
    
    if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        filtered = allPatients.filter(patient => {
            return patient.name.toLowerCase().includes(term) ||
                   patient.condition.toLowerCase().includes(term) ||
                   patient.id.toString().includes(term) ||
                   patient.age.toString().includes(term);
        });
    }
    
    loadPatientReportTable(filtered);
}

function clearSearch() {
    const searchInput = document.getElementById('reportSearch');
    if (searchInput) {
        searchInput.value = '';
        filterReports('');
    }
}

function initializeReportCharts() {
    // Get patient data
    const patients = window.reportsData?.patients || [];
    
    // Calculate admissions per day (last 7 days)
    const last7Days = [];
    const admissionsData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        const count = patients.filter(p => p.admissionDate === dateStr).length;
        admissionsData.push(count);
    }
    
    // Admissions Chart
    const admissionsCtx = document.getElementById('admissionsChart');
    if (admissionsCtx) {
        new Chart(admissionsCtx, {
            type: 'bar',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Number of Admissions',
                    data: admissionsData,
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6366F1',
                    borderRadius: 6,
                    hoverBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-light').trim() || '#818CF8'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Age Group Chart
    const ageGroupCtx = document.getElementById('ageGroupChart');
    if (ageGroupCtx) {
        const ageGroups = {
            '0-30': 0,
            '31-50': 0,
            '51-70': 0,
            '71+': 0
        };
        
        patients.forEach(p => {
            const age = p.age || 0;
            if (age <= 30) ageGroups['0-30']++;
            else if (age <= 50) ageGroups['31-50']++;
            else if (age <= 70) ageGroups['51-70']++;
            else ageGroups['71+']++;
        });
        
        new Chart(ageGroupCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(ageGroups),
                datasets: [{
                    data: Object.values(ageGroups),
                    backgroundColor: [
                        getComputedStyle(document.documentElement).getPropertyValue('--info').trim() || '#60A5FA',
                        getComputedStyle(document.documentElement).getPropertyValue('--success').trim() || '#34D399',
                        getComputedStyle(document.documentElement).getPropertyValue('--warning').trim() || '#FBBF24',
                        getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#F87171'
                    ],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
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
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--success').trim() || '#34D399',
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--success').trim() + '1A' || 'rgba(52, 211, 153, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#34D399'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
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
                    backgroundColor: ['#60A5FA', '#34D399', '#FBBF24', '#9CA3AF'],
                    borderRadius: 6,
                    hoverBackgroundColor: ['#93C5FD', '#6EE7B7', '#FCD34D', '#D1D5DB']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Export functions
function exportHTML() {
    try {
        // Get current report data
        const reportData = window.reportsData || {};
        const patients = filteredPatients.length > 0 ? filteredPatients : (reportData.patients || []);
        
        // Get report period
        const reportPeriod = document.getElementById('reportPeriod')?.textContent || 'Selected Range';
        const reportType = document.getElementById('reportType')?.value || 'comprehensive';
        
        // Create HTML content
        const htmlContent = generateHTMLReport(reportData, patients, reportPeriod, reportType);
        
        // Create download link
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ICU-Report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('HTML report exported successfully!', 'success');
    } catch (error) {
        console.error('HTML export error:', error);
        showToast('Error generating HTML report: ' + error.message, 'error');
    }
}

function generateHTMLReport(reportData, patients, reportPeriod, reportType) {
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Build patient rows
    let patientRows = '';
    if (patients && patients.length > 0) {
        patients.forEach(p => {
            let admissionDate = 'N/A';
            if (p.admissionDate) {
                try {
                    if (typeof formatDate === 'function') {
                        admissionDate = formatDate(p.admissionDate);
                    } else {
                        const date = new Date(p.admissionDate);
                        admissionDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    }
                } catch (e) {
                    admissionDate = String(p.admissionDate);
                }
            }
            
            patientRows += '<tr>' +
                '<td>' + (p.id || 'N/A') + '</td>' +
                '<td>' + (p.name || 'N/A') + '</td>' +
                '<td>' + (p.age || 0) + '</td>' +
                '<td>' + (p.condition || 'Unknown') + '</td>' +
                '<td>' + admissionDate + '</td>' +
                '</tr>';
        });
    } else {
        patientRows = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">No patients found</td></tr>';
    }
    
    // Get statistics
    const totalAdmissions = reportData.totalAdmissions || 0;
    const avgStay = (reportData.avgStay || 0).toFixed(1);
    const occupancyRate = (reportData.occupancyRate || 0).toFixed(0);
    const totalBeds = reportData.totalBeds || 0;
    const totalShifts = reportData.totalShifts || 0;
    const staffUtilization = (reportData.staffUtilization || 0).toFixed(0);
    const minAge = reportData.minAge || 0;
    const maxAge = reportData.maxAge || 0;
    const patientCount = patients ? patients.length : 0;
    
    // Build complete HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ICU Report - ${currentDate}</title>
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
            max-width: 1200px;
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
            background: #F3F4F6;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #E5E7EB;
        }
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        .stat-primary { color: #6366F1; }
        .stat-success { color: #10B981; }
        .stat-warning { color: #F59E0B; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
        }
        table thead {
            background: #6366F1;
            color: white;
        }
        table th {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
        }
        table td {
            padding: 10px;
            border: 1px solid #ddd;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Shefaa ICU Management System</h1>
            <h2>Reports & Analytics</h2>
            <p>Generated on ${currentDate}</p>
            <p>Report Period: ${reportPeriod || 'Selected Range'}</p>
        </div>
        
        <div class="section">
            <h3 class="section-title">Summary Statistics</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value stat-primary">${totalAdmissions}</div>
                    <div class="stat-label">Total Admissions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value stat-success">${avgStay}</div>
                    <div class="stat-label">Avg Length of Stay (Days)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value stat-warning">${occupancyRate}%</div>
                    <div class="stat-label">Occupancy Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value stat-primary">${totalBeds}</div>
                    <div class="stat-label">Total ICU Beds</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value stat-success">${totalShifts}</div>
                    <div class="stat-label">Total Shifts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value stat-warning">${staffUtilization}%</div>
                    <div class="stat-label">Staff Utilization</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3 class="section-title">Patient Demographics</h3>
            <p><strong>Age Range:</strong> ${minAge} - ${maxAge} years</p>
        </div>
        
        <div class="section">
            <h3 class="section-title">Patient Details (${patientCount} patients)</h3>
            <table>
                <thead>
                    <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Condition</th>
                        <th>Admission Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${patientRows}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>This report was generated automatically by Shefaa ICU Management System</p>
            <p>For questions or concerns, please contact the system administrator</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
}

// Keep PDF export for backward compatibility
async function exportPDF() {
    try {
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            showToast('PDF library not loaded. Please refresh the page.', 'error');
            console.error('html2pdf library not found');
            return;
        }
        
        showToast('Generating PDF...', 'info');
        
        // Get current report data
        const reportData = window.reportsData || {};
        const patients = filteredPatients.length > 0 ? filteredPatients : (reportData.patients || []);
        
        console.log('Report Data:', reportData);
        console.log('Patients count:', patients.length);
        
        // Get report period
        const reportPeriod = document.getElementById('reportPeriod')?.textContent || 'Selected Range';
        const reportType = document.getElementById('reportType')?.value || 'comprehensive';
        
        // Create PDF content
        const pdfContent = generatePDFTemplate(reportData, patients, reportPeriod, reportType);
        
        // Remove any existing temp div
        const existingDiv = document.getElementById('pdf-content-temp');
        if (existingDiv) {
            existingDiv.remove();
        }
        
        // Create temporary element for PDF generation
        const tempDiv = document.createElement('div');
        tempDiv.id = 'pdf-content-temp';
        tempDiv.innerHTML = pdfContent;
        
        // Style the container for PDF - make it visible in viewport
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '0px';
        tempDiv.style.left = '0px';
        tempDiv.style.width = '794px';
        tempDiv.style.minHeight = 'auto';
        tempDiv.style.padding = '20px';
        tempDiv.style.backgroundColor = '#FFFFFF';
        tempDiv.style.zIndex = '99999';
        tempDiv.style.visibility = 'visible';
        tempDiv.style.opacity = '1';
        tempDiv.style.color = '#000000';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.fontSize = '14px';
        tempDiv.style.lineHeight = '1.5';
        tempDiv.style.overflow = 'visible';
        tempDiv.style.display = 'block';
        
        // Append to body
        document.body.appendChild(tempDiv);
        
        // Force a reflow to ensure rendering
        const height = tempDiv.offsetHeight;
        const scrollHeight = tempDiv.scrollHeight;
        console.log('Temp div height:', height, 'scrollHeight:', scrollHeight);
        
        // Wait for fonts and images to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify content is there
        if (!tempDiv.innerHTML || tempDiv.innerHTML.trim().length === 0) {
            throw new Error('PDF content is empty');
        }
        
        // Check if content is visible
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        console.log('Text content length:', textContent.length);
        console.log('First 500 chars:', textContent.substring(0, 500));
        console.log('InnerHTML length:', tempDiv.innerHTML.length);
        console.log('Patient rows in HTML:', (tempDiv.innerHTML.match(/<tr>/g) || []).length);
        
        if (textContent.length < 10) {
            console.error('Content appears empty. InnerHTML preview:', tempDiv.innerHTML.substring(0, 1000));
            throw new Error('PDF content appears to be empty');
        }
        
        // Generate PDF with better options and page breaks
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `ICU-Report-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: true,
                backgroundColor: '#FFFFFF',
                width: scrollHeight || 794,
                height: scrollHeight || 1123,
                windowWidth: 794,
                windowHeight: scrollHeight || 1123,
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
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.page-break-before',
                after: '.page-break-after',
                avoid: ['tr', 'thead', 'tbody']
            }
        };
        
        console.log('Starting PDF generation with element:', tempDiv);
        console.log('Element dimensions:', tempDiv.offsetWidth, 'x', tempDiv.offsetHeight);
        console.log('Element scrollHeight:', tempDiv.scrollHeight);
        
        // Generate PDF
        const pdf = await html2pdf().set(opt).from(tempDiv).outputPdf('blob');
        
        // Create download link
        const url = URL.createObjectURL(pdf);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ICU-Report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Remove temporary element after a delay
        setTimeout(() => {
            const element = document.getElementById('pdf-content-temp');
            if (element && element.parentNode) {
                element.remove();
            }
        }, 3000);
        
        showToast('PDF exported successfully!', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        console.error('Error stack:', error.stack);
        showToast('Error generating PDF: ' + error.message, 'error');
        
        // Clean up on error
        const tempDiv = document.getElementById('pdf-content-temp');
        if (tempDiv && tempDiv.parentNode) {
            tempDiv.remove();
        }
    }
}

function generatePDFTemplate(reportData, patients, reportPeriod, reportType) {
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Build patient rows HTML - ensure all patients are included
    let patientRows = '';
    if (patients && patients.length > 0) {
        console.log('Building patient rows for', patients.length, 'patients');
        patientRows = patients.map((p, index) => {
            let admissionDate = 'N/A';
            if (p.admissionDate) {
                try {
                    if (typeof formatDate === 'function') {
                        admissionDate = formatDate(p.admissionDate);
                    } else {
                        // Fallback date formatting
                        const date = new Date(p.admissionDate);
                        admissionDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    }
                } catch (e) {
                    admissionDate = String(p.admissionDate);
                }
            }
            const patientId = String(p.id || 'N/A');
            const patientName = String(p.name || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const patientAge = String(p.age || 0);
            const patientCondition = String(p.condition || 'Unknown').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            
            return '<tr>' +
                '<td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">' + patientId + '</td>' +
                '<td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">' + patientName + '</td>' +
                '<td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 11px;">' + patientAge + '</td>' +
                '<td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">' + patientCondition + '</td>' +
                '<td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">' + admissionDate + '</td>' +
                '</tr>';
        }).join('');
        console.log('Patient rows built, length:', patientRows.length);
    } else {
        patientRows = '<tr><td colspan="5" style="padding: 15px; text-align: center; border: 1px solid #ddd; color: #999;">No patients found</td></tr>';
    }
    
    // Ensure we have valid numbers
    const totalAdmissions = reportData.totalAdmissions || 0;
    const avgStay = (reportData.avgStay || 0).toFixed(1);
    const occupancyRate = (reportData.occupancyRate || 0).toFixed(0);
    const totalBeds = reportData.totalBeds || 0;
    const totalShifts = reportData.totalShifts || 0;
    const staffUtilization = (reportData.staffUtilization || 0).toFixed(0);
    const minAge = reportData.minAge || 0;
    const maxAge = reportData.maxAge || 0;
    const patientCount = patients ? patients.length : 0;
    
    // Build HTML using string concatenation with page breaks
    const html = '<div style="font-family: Arial, sans-serif; color: #333; background: #FFFFFF; width: 100%; display: block;">' +
        '<!-- Page 1: Header and Summary Statistics -->' +
        '<div style="padding: 20px; margin-bottom: 40px; display: block;">' +
        '<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #6366F1; padding-bottom: 20px;">' +
        '<h1 style="color: #6366F1; margin: 0; font-size: 28px; font-weight: bold;">Shefaa ICU Management System</h1>' +
        '<h2 style="color: #666; margin: 10px 0 0 0; font-size: 20px; font-weight: normal;">Reports & Analytics</h2>' +
        '<p style="color: #999; margin: 10px 0 0 0; font-size: 14px;">Generated on ' + currentDate + '</p>' +
        '<p style="color: #999; margin: 5px 0 0 0; font-size: 14px;">Report Period: ' + (reportPeriod || 'Selected Range') + '</p>' +
        '</div>' +
        '<div style="margin-bottom: 30px;">' +
        '<h3 style="color: #6366F1; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; margin-bottom: 20px; font-size: 18px;">Summary Statistics</h3>' +
        '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">' +
        '<tr>' +
        '<td style="width: 33.33%; padding: 10px; vertical-align: top;">' +
        '<div style="background: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">' +
        '<div style="font-size: 32px; font-weight: bold; color: #6366F1;">' + totalAdmissions + '</div>' +
        '<div style="color: #666; margin-top: 5px; font-size: 14px;">Total Admissions</div>' +
        '</div></td>' +
        '<td style="width: 33.33%; padding: 10px; vertical-align: top;">' +
        '<div style="background: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">' +
        '<div style="font-size: 32px; font-weight: bold; color: #10B981;">' + avgStay + '</div>' +
        '<div style="color: #666; margin-top: 5px; font-size: 14px;">Avg Length of Stay (Days)</div>' +
        '</div></td>' +
        '<td style="width: 33.33%; padding: 10px; vertical-align: top;">' +
        '<div style="background: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">' +
        '<div style="font-size: 32px; font-weight: bold; color: #F59E0B;">' + occupancyRate + '%</div>' +
        '<div style="color: #666; margin-top: 5px; font-size: 14px;">Occupancy Rate</div>' +
        '</div></td>' +
        '</tr>' +
        '<tr>' +
        '<td style="width: 33.33%; padding: 10px; vertical-align: top;">' +
        '<div style="background: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">' +
        '<div style="font-size: 32px; font-weight: bold; color: #6366F1;">' + totalBeds + '</div>' +
        '<div style="color: #666; margin-top: 5px; font-size: 14px;">Total ICU Beds</div>' +
        '</div></td>' +
        '<td style="width: 33.33%; padding: 10px; vertical-align: top;">' +
        '<div style="background: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">' +
        '<div style="font-size: 32px; font-weight: bold; color: #10B981;">' + totalShifts + '</div>' +
        '<div style="color: #666; margin-top: 5px; font-size: 14px;">Total Shifts</div>' +
        '</div></td>' +
        '<td style="width: 33.33%; padding: 10px; vertical-align: top;">' +
        '<div style="background: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">' +
        '<div style="font-size: 32px; font-weight: bold; color: #F59E0B;">' + staffUtilization + '%</div>' +
        '<div style="color: #666; margin-top: 5px; font-size: 14px;">Staff Utilization</div>' +
        '</div></td>' +
        '</tr>' +
        '</table>' +
        '</div>' +
        '</div>' +
        '<!-- Page 2: Patient Demographics -->' +
        '<div style="padding: 20px; margin-bottom: 40px; display: block; margin-top: 40px;">' +
        '<div style="margin-bottom: 30px;">' +
        '<h3 style="color: #6366F1; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; margin-bottom: 20px; font-size: 18px;">Patient Demographics</h3>' +
        '<div style="margin-bottom: 15px; font-size: 14px;">' +
        '<strong>Age Range:</strong> ' + minAge + ' - ' + maxAge + ' years' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<!-- Page 3+: Patient Table -->' +
        '<div style="padding: 20px; margin-bottom: 20px; display: block; margin-top: 40px;">' +
        '<h3 style="color: #6366F1; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; margin-bottom: 20px; font-size: 18px;">Patient Details (' + patientCount + ' patients)</h3>' +
        '<table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #ddd; page-break-inside: auto;">' +
        '<thead style="display: table-header-group;">' +
        '<tr style="background: #6366F1; color: white; page-break-inside: avoid;">' +
        '<th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; font-size: 11px;">ID</th>' +
        '<th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; font-size: 11px;">Name</th>' +
        '<th style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 11px;">Age</th>' +
        '<th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; font-size: 11px;">Condition</th>' +
        '<th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; font-size: 11px;">Admission Date</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody style="display: table-row-group;">' +
        patientRows +
        '</tbody>' +
        '</table>' +
        '</div>' +
        '<!-- Footer -->' +
        '<div style="padding: 20px; page-break-inside: avoid;">' +
        '<div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; color: #999; font-size: 12px;">' +
        '<p style="margin: 5px 0;">This report was generated automatically by Shefaa ICU Management System</p>' +
        '<p style="margin: 5px 0;">For questions or concerns, please contact the system administrator</p>' +
        '</div>' +
        '</div>' +
        '</div>';
    
    return html;
}

function exportCSV() {
    // Get patient data
    const patients = window.reportsData?.patients || [];
    
    if (patients.length === 0) {
        showToast('No data to export', 'error');
        return;
    }
    
    // Create CSV content
    let csv = 'Patient ID,Name,Age,Condition,Admission Date\n';
    patients.forEach(p => {
        csv += `${p.id},"${p.name}",${p.age},"${p.condition}",${p.admissionDate}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icu-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('CSV exported successfully!', 'success');
}

// Make functions globally accessible
window.exportHTML = exportHTML;
window.exportPDF = exportPDF;
window.exportCSV = exportCSV;

// Add filter change handlers
document.addEventListener('DOMContentLoaded', function() {
    const dateRange = document.getElementById('dateRange');
    const reportType = document.getElementById('reportType');
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    const reportSearch = document.getElementById('reportSearch');
    
    // Search functionality
    if (reportSearch) {
        reportSearch.addEventListener('input', function(e) {
            filterReports(e.target.value);
        });
    }
    
    if (dateRange) {
        dateRange.addEventListener('change', function() {
            updateReportPeriod();
        });
    }
    
    if (reportType) {
        reportType.addEventListener('change', function() {
            loadReports();
        });
    }
    
    if (fromDate && toDate) {
        fromDate.addEventListener('change', updateReportPeriod);
        toDate.addEventListener('change', updateReportPeriod);
    }
});

// Make functions globally accessible
window.filterReports = filterReports;
window.clearSearch = clearSearch;

function updateReportPeriod() {
    const dateRange = document.getElementById('dateRange')?.value || '30';
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const reportPeriodEl = document.getElementById('reportPeriod');
    
    if (fromDateInput && toDateInput && fromDateInput.value && toDateInput.value) {
        // Use custom date range
        const startDate = new Date(fromDateInput.value);
        const endDate = new Date(toDateInput.value);
        if (reportPeriodEl) {
            reportPeriodEl.textContent = 
                `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        }
    } else {
        // Use preset range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
        if (reportPeriodEl) {
            reportPeriodEl.textContent = 
                `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        }
    }
}

