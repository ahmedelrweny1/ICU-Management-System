// Pure MVC - only chart rendering with server data, no data fetching

let occupancyChart = null;
let roomStatusChart = null;
let vitalsChart = null;

// Initialize dashboard when DOM is ready
function initializeDashboard() {
    // Get dashboard data from server-rendered page
    const data = window.dashboardData || {};
    
    // Update statistics
    updateStatistics(data);
    
    // Load UI components with server data
    const activities = Array.isArray(data.recentActivities) ? data.recentActivities : [];
    const staff = Array.isArray(data.staffOnDutyList) ? data.staffOnDutyList : [];
    
    loadActivityFeed(activities);
    loadStaffOnDuty(staff);
    loadCurrentShift(data.currentShift);
    renderVitalsAlerts(data.vitalAlerts || []);
    
    // Initialize charts with server data
    initializeCharts(data);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}

function updateStatistics(data) {
    const getProp = (obj, key) => obj?.[key] ?? obj?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? 0;
    
    document.getElementById('totalRooms')?.setAttribute('data-count', getProp(data, 'totalRooms'));
    document.getElementById('totalPatients')?.setAttribute('data-count', getProp(data, 'totalPatients'));
    document.getElementById('totalStaff')?.setAttribute('data-count', getProp(data, 'totalStaff'));
    document.getElementById('criticalCases')?.setAttribute('data-count', getProp(data, 'criticalCases'));
    
    // Animate counters
    animateCounter('totalRooms', getProp(data, 'totalRooms'));
    animateCounter('totalPatients', getProp(data, 'totalPatients'));
    animateCounter('totalStaff', getProp(data, 'totalStaff'));
    animateCounter('criticalCases', getProp(data, 'criticalCases'));
}

function animateCounter(id, target) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const current = parseInt(element.textContent) || 0;
    const increment = target > current ? 1 : -1;
    const duration = 1000;
    const steps = Math.abs(target - current);
    const stepDuration = duration / steps;
    
    let currentValue = current;
    const timer = setInterval(() => {
        currentValue += increment;
        if ((increment > 0 && currentValue >= target) || (increment < 0 && currentValue <= target)) {
            currentValue = target;
            clearInterval(timer);
        }
        element.textContent = currentValue;
    }, stepDuration);
}

function loadActivityFeed(activities) {
    const container = document.getElementById('activityFeed');
    if (!container) return;
    
    if (!Array.isArray(activities) || activities.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">No recent activities</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const icon = activity.type === 'patient' ? 'fa-user' : 
                    activity.type === 'medication' ? 'fa-pills' : 'fa-user-md';
        return `
            <div class="activity-item" style="opacity: 1;">
                <div class="activity-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.text || ''}</p>
                    <span class="activity-time">${activity.time || ''}</span>
                </div>
            </div>
        `;
    }).join('');
}

function loadStaffOnDuty(staff) {
    const container = document.getElementById('staffOnDuty');
    if (!container) return;
    
    if (!Array.isArray(staff) || staff.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">No staff currently on duty</p>';
        return;
    }
    
    container.innerHTML = staff.map(member => {
        const photo = member.profilePhotoPath || 
                     `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || '')}&background=6366F1&color=fff&size=40`;
        return `
            <div class="staff-item" style="opacity: 1;">
                <img src="${photo}" alt="${member.name || ''}" class="staff-avatar">
                <div class="staff-info">
                    <strong>${member.name || ''}</strong>
                    <small>${member.role || ''}</small>
                </div>
            </div>
        `;
    }).join('');
}

function loadCurrentShift(shift) {
    if (!shift) return;
    
    const container = document.getElementById('currentShift');
    if (!container) return;
    
    container.innerHTML = `
        <div class="shift-info">
            <h5>${shift.shiftName || ''}</h5>
            <p>${shift.shiftTime || ''}</p>
            <span class="badge bg-primary">${shift.staffCount || 0} Staff</span>
        </div>
    `;
}

function renderVitalsAlerts(alerts) {
    const container = document.getElementById('vitalAlerts');
    if (!container) return;
    
    if (!Array.isArray(alerts) || alerts.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">No vital alerts</p>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => {
        const severityClass = alert.severity === 'danger' ? 'bg-danger' : 'bg-warning';
        return `
            <div class="alert-item">
                <div class="alert-icon ${severityClass}">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <strong>${alert.patientName || ''}</strong>
                    <p>${alert.metric || ''}: ${alert.value || ''}</p>
                    <small>${alert.recordedAt || ''}</small>
                </div>
            </div>
        `;
    }).join('');
}

function initializeCharts(data) {
    // Weekly Occupancy Chart
    const occupancyCtx = document.getElementById('occupancyChart');
    if (occupancyCtx && data.weeklyOccupancy && data.weeklyOccupancy.length > 0) {
        const labels = data.weeklyOccupancy.map(d => d.day || d.Day);
        const rates = data.weeklyOccupancy.map(d => d.occupancyRate || d.OccupancyRate);
        
        occupancyChart = new Chart(occupancyCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Occupancy Rate %',
                    data: rates,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    // Room Status Chart
    const roomStatusCtx = document.getElementById('roomStatusChart');
    if (roomStatusCtx) {
        const occupied = data.occupiedRooms || data.OccupiedRooms || 0;
        const available = data.availableRooms || data.AvailableRooms || 0;
        const cleaning = data.cleaningRooms || data.CleaningRooms || 0;
        
        roomStatusChart = new Chart(roomStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Occupied', 'Available', 'Cleaning'],
                datasets: [{
                    data: [occupied, available, cleaning],
                    backgroundColor: [
                        'rgb(239, 68, 68)',
                        'rgb(34, 197, 94)',
                        'rgb(251, 191, 36)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Vitals Trend Chart
    const vitalsCtx = document.getElementById('vitalsChart');
    if (vitalsCtx && data.vitalsTrend && data.vitalsTrend.length > 0) {
        const labels = data.vitalsTrend.map(d => d.label || d.Label);
        const pulse = data.vitalsTrend.map(d => d.pulse || d.Pulse || 0);
        const spO2 = data.vitalsTrend.map(d => d.spO2 || d.SpO2 || 0);
        
        vitalsChart = new Chart(vitalsCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pulse (bpm)',
                        data: pulse,
                        borderColor: 'rgb(239, 68, 68)',
                        yAxisID: 'y'
                    },
                    {
                        label: 'SpO₂ (%)',
                        data: spO2,
                        borderColor: 'rgb(34, 197, 94)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left'
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }
}
