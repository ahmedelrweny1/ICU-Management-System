let occupancyChart = null;
let roomStatusChart = null;
let vitalsChart = null;

document.addEventListener('DOMContentLoaded', function() {
    // Get dashboard data from the model
    const data = window.dashboardData || {};
    
    // Debug data received in JavaScript
    console.log("Dashboard data in JavaScript:", data);
    console.log("totalRooms:", data.totalRooms);
    console.log("totalPatients:", data.totalPatients);
    console.log("totalStaff:", data.totalStaff);
    console.log("criticalCases:", data.criticalCases);
    console.log("availableRooms:", data.availableRooms);
    console.log("occupiedRooms:", data.occupiedRooms);
    console.log("cleaningRooms:", data.cleaningRooms);
    console.log("staffOnDuty:", data.staffOnDuty);
    console.log("weeklyOccupancy:", data.weeklyOccupancy);
    console.log("recentActivities:", data.recentActivities);
    console.log("staffOnDutyList:", data.staffOnDutyList);
    
    // Update all dashboard components
    updateStatistics(data);
    loadActivityFeed(data.recentActivities || []);
    loadStaffOnDuty(data.staffOnDutyList || []);
    loadCurrentShift(data.currentShift);
    renderVitalsAlerts(data.vitalAlerts || []);
    initializeCharts(data);
});

function updateStatistics(data) {
    animateNumber(document.getElementById('totalRooms'), 0, data.totalRooms || 0, 1000);
    animateNumber(document.getElementById('totalPatients'), 0, data.totalPatients || 0, 1000);
    animateNumber(document.getElementById('totalStaff'), 0, data.totalStaff || 0, 1000);
    animateNumber(document.getElementById('criticalCases'), 0, data.criticalCases || 0, 1000);
    animateNumber(document.getElementById('availableRooms'), 0, data.availableRooms || 0, 1000);
    animateNumber(document.getElementById('staffOnDuty'), 0, data.staffOnDuty || 0, 1000);
}

function loadActivityFeed(activities) {
    const feedContainer = document.getElementById('activityFeed');
    if (!feedContainer) return;
    
    console.log("Loading activity feed with:", activities);
    
    if (!activities || activities.length === 0) {
        feedContainer.innerHTML = '<p class="text-muted">No recent activities</p>';
        return;
    }
    
    feedContainer.innerHTML = activities.map((activity, index) => `
        <div class="activity-item" style="animation-delay: ${index * 100}ms">
            <div class="activity-time">${activity.time || ''}</div>
            <div class="activity-text">${activity.text || ''}</div>
        </div>
    `).join('');
}

function loadStaffOnDuty(staff) {
    const staffContainer = document.getElementById('staffOnDutyList');
    if (!staffContainer) return;
    
    console.log("Loading staff on duty with:", staff);
    
    if (!staff || staff.length === 0) {
        staffContainer.innerHTML = '<p class="text-muted">No staff currently on duty</p>';
        return;
    }
    
    staffContainer.innerHTML = staff.map((member, index) => `
        <div class="staff-item" style="animation-delay: ${index * 100}ms">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Staff')}&background=random" alt="${member.name || 'Staff'}">
            <div class="staff-info">
                <h6>${member.name || 'Unknown'}</h6>
                <p>${member.role || ''}${member.specialty ? ' - ' + member.specialty : ''}</p>
            </div>
        </div>
    `).join('');
}

function loadCurrentShift(shiftInfo) {
    if (!shiftInfo) return;
    
    const currentShiftEl = document.getElementById('currentShift');
    const shiftTimeEl = document.getElementById('shiftTime');
    const shiftStaffCountEl = document.getElementById('shiftStaffCount');
    
    if (currentShiftEl) currentShiftEl.textContent = shiftInfo.shiftName || 'Morning Shift';
    if (shiftTimeEl) shiftTimeEl.textContent = shiftInfo.shiftTime || '08:00 AM - 04:00 PM';
    if (shiftStaffCountEl) shiftStaffCountEl.textContent = shiftInfo.staffCount || 0;
}

function renderVitalsAlerts(alerts) {
    const container = document.getElementById('vitalsAlertsList');
    if (!container) return;

    if (!alerts.length) {
        container.innerHTML = '<div class="text-muted small">No critical vitals.</div>';
        return;
    }

    container.innerHTML = alerts.map((alert, index) => `
        <div class="list-group-item d-flex justify-content-between align-items-center" style="animation-delay: ${index * 100}ms">
            <div>
                <div class="fw-semibold">${alert.patientName}</div>
                <small class="text-muted">${alert.metric} • ${alert.recordedAt}</small>
            </div>
            <span class="badge bg-${alert.severity || 'warning'} pulse-animation">${alert.value}</span>
        </div>
    `).join('');
}

function initializeCharts(data) {
    const root = document.documentElement;
    const primaryColor = getComputedStyle(root).getPropertyValue('--primary').trim() || '#6366F1';
    const successColor = getComputedStyle(root).getPropertyValue('--success').trim() || '#34D399';
    const dangerColor = getComputedStyle(root).getPropertyValue('--danger').trim() || '#F87171';
    const warningColor = getComputedStyle(root).getPropertyValue('--warning').trim() || '#FBBF24';
    const borderColor = getComputedStyle(root).getPropertyValue('--border-color').trim() || 'rgba(0, 0, 0, 0.05)';
    
    const occupancyCtx = document.getElementById('occupancyChart');
    if (occupancyCtx) {
        if (occupancyChart) {
            occupancyChart.destroy();
        }
        
        const labels = data.weeklyOccupancy?.map(w => w.day) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const occupancyData = data.weeklyOccupancy?.map(w => w.occupancyRate) || [0, 0, 0, 0, 0, 0, 0];
        
        occupancyChart = new Chart(occupancyCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Occupancy Rate (%)',
                    data: occupancyData,
                    borderColor: primaryColor,
                    backgroundColor: primaryColor + '1A',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: primaryColor
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
                            color: borderColor
                        },
                        ticks: {
                            color: getComputedStyle(root).getPropertyValue('--text-secondary').trim() || '#6B7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: getComputedStyle(root).getPropertyValue('--text-secondary').trim() || '#6B7280'
                        }
                    }
                }
            }
        });
    }
    
    const roomStatusCtx = document.getElementById('roomStatusChart');
    if (roomStatusCtx) {
        if (roomStatusChart) {
            roomStatusChart.destroy();
        }
        
        const occupied = data.occupiedRooms || 0;
        const available = data.availableRooms || 0;
        const cleaning = data.cleaningRooms || 0;
        
        roomStatusChart = new Chart(roomStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Occupied', 'Available', 'Cleaning'],
                datasets: [{
                    data: [occupied, available, cleaning],
                    backgroundColor: [dangerColor, successColor, warningColor],
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
                            },
                            color: getComputedStyle(root).getPropertyValue('--text-primary').trim() || '#374151'
                        }
                    }
                }
            }
        });
    }

    const vitalsCtx = document.getElementById('vitalsChart');
    if (vitalsCtx) {
        if (vitalsChart) {
            vitalsChart.destroy();
        }

        const trend = data.vitalsTrend || [];
        vitalsChart = new Chart(vitalsCtx, {
            type: 'line',
            data: {
                labels: trend.map(item => item.label),
                datasets: [
                    {
                        label: 'Pulse',
                        data: trend.map(item => item.pulse),
                        borderColor: primaryColor,
                        backgroundColor: primaryColor + '1A',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'SpO₂',
                        data: trend.map(item => item.spO2),
                        borderColor: successColor,
                        backgroundColor: successColor + '1A',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: borderColor
                        },
                        ticks: {
                            color: getComputedStyle(root).getPropertyValue('--text-secondary').trim() || '#6B7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: getComputedStyle(root).getPropertyValue('--text-secondary').trim() || '#6B7280'
                        }
                    }
                }
            }
        });
    }
}

function animateNumber(element, start, end, duration) {
    if (!element) return;
    
    const startTime = performance.now();
    const startValue = start;
    const endValue = end;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(startValue + (endValue - startValue) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = endValue;
        }
    }
    
    requestAnimationFrame(update);
}

