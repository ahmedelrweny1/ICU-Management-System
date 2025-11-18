// ===================================
// Dashboard Page JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    initializeCharts();
});

function loadDashboardData() {
    const rooms = DataManager.getRooms();
    const patients = DataManager.getPatients();
    const staff = DataManager.getStaff();
    const activities = DataManager.getActivities();
    
    // Update statistics with animation
    updateStatistics(rooms, patients, staff);
    
    // Load activity feed
    loadActivityFeed(activities);
    
    // Load staff on duty
    loadStaffOnDuty(staff);
    
    // Load current shift info
    loadCurrentShift();
}

function updateStatistics(rooms, patients, staff) {
    const totalRooms = rooms.length;
    const totalPatients = patients.length;
    const totalStaff = staff.length;
    const criticalCases = patients.filter(p => p.condition === 'Critical').length;
    const availableRooms = rooms.filter(r => r.status === 'Available').length;
    const staffOnDuty = staff.filter(s => s.status === 'On Duty').length;
    
    // Animate numbers
    animateNumber(document.getElementById('totalRooms'), 0, totalRooms, 1000);
    animateNumber(document.getElementById('totalPatients'), 0, totalPatients, 1000);
    animateNumber(document.getElementById('totalStaff'), 0, totalStaff, 1000);
    animateNumber(document.getElementById('criticalCases'), 0, criticalCases, 1000);
    animateNumber(document.getElementById('availableRooms'), 0, availableRooms, 1000);
    animateNumber(document.getElementById('staffOnDuty'), 0, staffOnDuty, 1000);
}

function loadActivityFeed(activities) {
    const feedContainer = document.getElementById('activityFeed');
    if (!feedContainer) return;
    
    if (activities.length === 0) {
        feedContainer.innerHTML = '<p class="text-muted">No recent activities</p>';
        return;
    }
    
    feedContainer.innerHTML = activities.slice(0, 10).map(activity => `
        <div class="activity-item">
            <div class="activity-time">${activity.time}</div>
            <div class="activity-text">${activity.text}</div>
        </div>
    `).join('');
}

function loadStaffOnDuty(staff) {
    const staffContainer = document.getElementById('staffOnDutyList');
    if (!staffContainer) return;
    
    const onDutyStaff = staff.filter(s => s.status === 'On Duty');
    
    if (onDutyStaff.length === 0) {
        staffContainer.innerHTML = '<p class="text-muted">No staff currently on duty</p>';
        return;
    }
    
    staffContainer.innerHTML = onDutyStaff.map(member => `
        <div class="staff-item">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random" alt="${member.name}">
            <div class="staff-info">
                <h6>${member.name}</h6>
                <p>${member.role} - ${member.specialty}</p>
            </div>
        </div>
    `).join('');
}

function loadCurrentShift() {
    const currentHour = new Date().getHours();
    let shiftName, shiftTime;
    
    if (currentHour >= 8 && currentHour < 16) {
        shiftName = 'Morning Shift';
        shiftTime = '08:00 AM - 04:00 PM';
    } else if (currentHour >= 16 && currentHour < 24) {
        shiftName = 'Evening Shift';
        shiftTime = '04:00 PM - 12:00 AM';
    } else {
        shiftName = 'Night Shift';
        shiftTime = '12:00 AM - 08:00 AM';
    }
    
    const staff = DataManager.getStaff();
    const onDutyCount = staff.filter(s => s.status === 'On Duty').length;
    
    document.getElementById('currentShift').textContent = shiftName;
    document.getElementById('shiftTime').textContent = shiftTime;
    document.getElementById('shiftStaffCount').textContent = onDutyCount;
}

function initializeCharts() {
    // Occupancy Chart
    const occupancyCtx = document.getElementById('occupancyChart');
    if (occupancyCtx) {
        new Chart(occupancyCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Occupancy Rate (%)',
                    data: [85, 75, 90, 80, 95, 70, 85],
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#6366F1'
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
    
    // Room Status Chart
    const roomStatusCtx = document.getElementById('roomStatusChart');
    if (roomStatusCtx) {
        const rooms = DataManager.getRooms();
        const occupied = rooms.filter(r => r.status === 'Occupied').length;
        const available = rooms.filter(r => r.status === 'Available').length;
        const cleaning = rooms.filter(r => r.status === 'Cleaning').length;
        
        new Chart(roomStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Occupied', 'Available', 'Cleaning'],
                datasets: [{
                    data: [occupied, available, cleaning],
                    backgroundColor: ['#F87171', '#34D399', '#FBBF24'],
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
}

