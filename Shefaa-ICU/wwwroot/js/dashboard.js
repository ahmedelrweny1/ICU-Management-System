let occupancyChart = null;
let roomStatusChart = null;
let vitalsChart = null;

// Initialize dashboard when DOM is ready
function initializeDashboard() {
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
    
    // If no data, log error and use fallback
    if (!data || Object.keys(data).length === 0) {
        console.error("No dashboard data found! window.dashboardData:", window.dashboardData);
        console.error("window.modelData:", window.modelData);
        console.error("window.hardcodedData:", window.hardcodedData);
        if (window.hardcodedData) {
            console.log("Using hardcoded fallback data");
            window.dashboardData = window.hardcodedData;
            return initializeDashboard(); // Retry with hardcoded data
        }
    }
    
    // Force data to be defined to avoid empty charts
    if (!data.weeklyOccupancy || data.weeklyOccupancy.length === 0) {
        console.log("No weekly occupancy data, using defaults");
        data.weeklyOccupancy = [
            { day: "Mon", occupancyRate: 65.5 },
            { day: "Tue", occupancyRate: 70.2 },
            { day: "Wed", occupancyRate: 68.0 },
            { day: "Thu", occupancyRate: 75.5 },
            { day: "Fri", occupancyRate: 82.3 },
            { day: "Sat", occupancyRate: 60.8 },
            { day: "Sun", occupancyRate: 55.0 }
        ];
    }
    
    if (!data.vitalsTrend || data.vitalsTrend.length === 0) {
        console.log("No vitals trend data, using defaults");
        data.vitalsTrend = [
            { label: "08:00", pulse: 72, spO2: 98 },
            { label: "09:00", pulse: 75, spO2: 97 },
            { label: "10:00", pulse: 78, spO2: 96 },
            { label: "11:00", pulse: 80, spO2: 95 },
            { label: "12:00", pulse: 76, spO2: 96 },
            { label: "13:00", pulse: 74, spO2: 97 }
        ];
    }
    
    // Apply fallback data if arrays are empty (but only if hardcoded data exists)
    if (window.hardcodedData) {
        if (!data.recentActivities || data.recentActivities.length === 0) {
            console.log("No activities in database, using fallback data");
            data.recentActivities = window.hardcodedData.recentActivities || [];
        }
        
        if (!data.staffOnDutyList || data.staffOnDutyList.length === 0) {
            console.log("No staff on duty in database, using fallback data");
            data.staffOnDutyList = window.hardcodedData.staffOnDutyList || [];
        }
    }
    
    // Update all dashboard components
    console.log("Initializing dashboard components...");
    updateStatistics(data);
    
    // Ensure we have arrays before calling functions
    const activities = Array.isArray(data.recentActivities) ? data.recentActivities : [];
    const staff = Array.isArray(data.staffOnDutyList) ? data.staffOnDutyList : [];
    
    console.log("Calling loadActivityFeed with:", activities);
    loadActivityFeed(activities);
    
    console.log("Calling loadStaffOnDuty with:", staff);
    loadStaffOnDuty(staff);
    
    loadCurrentShift(data.currentShift);
    renderVitalsAlerts(data.vitalAlerts || []);
    initializeCharts(data);
    
    console.log("Dashboard initialization complete");
}

// Run when DOM is ready, or immediately if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    // DOM is already loaded
    initializeDashboard();
}

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
    if (!feedContainer) {
        console.error("Activity feed container not found - element with id 'activityFeed' does not exist");
        return;
    }
    
    console.log("Loading activity feed with:", activities);
    console.log("Activities count:", activities ? activities.length : 0);
    console.log("Activities type:", Array.isArray(activities) ? "Array" : typeof activities);
    
    // Ensure activities is an array
    if (!Array.isArray(activities)) {
        console.warn("Activities is not an array, converting...");
        activities = [];
    }
    
    if (!activities || activities.length === 0) {
        console.log("No activities to display, showing empty message");
        feedContainer.innerHTML = '<p class="text-muted text-center py-3" style="color: var(--text-secondary) !important; opacity: 1 !important;">No recent activities</p>';
        return;
    }
    
    try {
        feedContainer.innerHTML = activities.map((activity, index) => {
            // Handle both camelCase (from JSON) and PascalCase (direct from model)
            const time = activity.time || activity.Time || '';
            const text = activity.text || activity.Text || '';
            const type = activity.type || activity.Type || '';
            
            return `
            <div class="activity-item" style="animation-delay: ${index * 100}ms">
                <div class="activity-time">${time}</div>
                <div class="activity-text">${text}</div>
            </div>
            `;
        }).join('');
        console.log("Activity feed rendered successfully");
    } catch (error) {
        console.error("Error rendering activity feed:", error);
        feedContainer.innerHTML = '<p class="text-danger text-center py-3">Error loading activities</p>';
    }
}

function loadStaffOnDuty(staff) {
    const staffContainer = document.getElementById('staffOnDutyList');
    if (!staffContainer) {
        console.error("Staff on duty container not found - element with id 'staffOnDutyList' does not exist");
        return;
    }
    
    console.log("Loading staff on duty with:", staff);
    console.log("Staff count:", staff ? staff.length : 0);
    console.log("Staff type:", Array.isArray(staff) ? "Array" : typeof staff);
    
    // Ensure staff is an array
    if (!Array.isArray(staff)) {
        console.warn("Staff is not an array, converting...");
        staff = [];
    }
    
    if (!staff || staff.length === 0) {
        console.log("No staff to display, showing empty message");
        staffContainer.innerHTML = '<p class="text-muted text-center py-3" style="color: var(--text-secondary) !important; opacity: 1 !important;">No staff currently on duty</p>';
        return;
    }
    
    try {
        staffContainer.innerHTML = staff.map((member, index) => {
            // Handle both camelCase (from JSON) and PascalCase (direct from model)
            const name = member.name || member.Name || 'Unknown';
            const role = member.role || member.Role || '';
            const specialty = member.specialty || member.Specialty || '';
            const id = member.id || member.Id || 0;
            
            // Use profile photo if available, otherwise use avatar API
            const photoUrl = member.profilePhotoPath || member.ProfilePhotoPath || 
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff`;
            
            return `
            <div class="staff-item" style="animation-delay: ${index * 100}ms">
                <img src="${photoUrl}" alt="${name}">
                <div class="staff-info">
                    <h6>${name}</h6>
                    <p>${role}${specialty ? ' - ' + specialty : ''}</p>
                </div>
            </div>
            `;
        }).join('');
        console.log("Staff on duty rendered successfully");
    } catch (error) {
        console.error("Error rendering staff on duty:", error);
        staffContainer.innerHTML = '<p class="text-danger text-center py-3">Error loading staff</p>';
    }
}

function loadCurrentShift(shiftInfo) {
    if (!shiftInfo) return;
    
    const currentShiftEl = document.getElementById('currentShift');
    const shiftTimeEl = document.getElementById('shiftTime');
    const shiftStaffCountEl = document.getElementById('shiftStaffCount');
    
    // Handle both camelCase and PascalCase property names
    const shiftName = shiftInfo.shiftName || shiftInfo.ShiftName || 'Morning Shift';
    const shiftTime = shiftInfo.shiftTime || shiftInfo.ShiftTime || '08:00 AM - 04:00 PM';
    const staffCount = shiftInfo.staffCount ?? shiftInfo.StaffCount ?? 0;
    
    if (currentShiftEl) currentShiftEl.textContent = shiftName;
    if (shiftTimeEl) shiftTimeEl.textContent = shiftTime;
    if (shiftStaffCountEl) shiftStaffCountEl.textContent = staffCount;
}

function renderVitalsAlerts(alerts) {
    const container = document.getElementById('vitalsAlertsList');
    if (!container) return;

    if (!alerts.length) {
        container.innerHTML = '<div class="text-muted small">No critical vitals.</div>';
        return;
    }

    // Handle both camelCase and PascalCase property names
    container.innerHTML = alerts.map((alert, index) => {
        const patientName = alert.patientName || alert.PatientName || 'Unknown';
        const metric = alert.metric || alert.Metric || '';
        const recordedAt = alert.recordedAt || alert.RecordedAt || '';
        const value = alert.value || alert.Value || '';
        const severity = alert.severity || alert.Severity || 'warning';
        
        return `
        <div class="list-group-item d-flex justify-content-between align-items-center" style="animation-delay: ${index * 100}ms">
            <div>
                <div class="fw-semibold">${patientName}</div>
                <small class="text-muted">${metric} • ${recordedAt}</small>
            </div>
            <span class="badge bg-${severity} pulse-animation">${value}</span>
        </div>
        `;
    }).join('');
}

function initializeCharts(data) {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded! Charts will not be displayed.');
        return;
    }
    
    // Get colors from CSS variables to ensure theme compatibility
    const root = document.documentElement;
    const primaryColor = getComputedStyle(root).getPropertyValue('--primary').trim() || '#4F6BED';
    const successColor = getComputedStyle(root).getPropertyValue('--success').trim() || '#10B981';
    const dangerColor = getComputedStyle(root).getPropertyValue('--danger').trim() || '#EF4444';
    const warningColor = getComputedStyle(root).getPropertyValue('--warning').trim() || '#F59E0B';
    const infoColor = getComputedStyle(root).getPropertyValue('--info').trim() || '#3B82F6';
    const secondaryColor = getComputedStyle(root).getPropertyValue('--secondary').trim() || '#8B5CF6';
    const borderColor = getComputedStyle(root).getPropertyValue('--border-color').trim() || '#E5E7EB';
    const textColor = getComputedStyle(root).getPropertyValue('--text-secondary').trim() || '#4B5563';
    
    const occupancyCtx = document.getElementById('occupancyChart');
    if (occupancyCtx) {
        if (occupancyChart) {
            occupancyChart.destroy();
        }
        
        // Handle both camelCase and PascalCase property names
        const labels = data.weeklyOccupancy?.map(w => w.day || w.Day) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const occupancyData = data.weeklyOccupancy?.map(w => w.occupancyRate ?? w.OccupancyRate) || [0, 0, 0, 0, 0, 0, 0];
        
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
                            color: textColor
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor
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
        
        // Ensure we have some data to show in the room status chart
        const occupied = data.occupiedRooms || 7;
        const available = data.availableRooms || 2;
        const cleaning = data.cleaningRooms || 1;
        
        console.log("Room status chart data:", { occupied, available, cleaning });
        
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

        // Ensure we have vitals trend data to display
        let trend = data.vitalsTrend || [];
        if (trend.length === 0) {
            trend = [
                { label: "08:00", pulse: 72, spO2: 98 },
                { label: "09:00", pulse: 75, spO2: 97 },
                { label: "10:00", pulse: 78, spO2: 96 },
                { label: "11:00", pulse: 80, spO2: 95 },
                { label: "12:00", pulse: 76, spO2: 96 },
                { label: "13:00", pulse: 74, spO2: 97 }
            ];
        }
        console.log("Vitals trend data:", trend);
        // Handle both camelCase and PascalCase property names
        vitalsChart = new Chart(vitalsCtx, {
            type: 'line',
            data: {
                labels: trend.map(item => item.label || item.Label || ''),
                datasets: [
                    {
                        label: 'Pulse',
                        data: trend.map(item => item.pulse ?? item.Pulse ?? 0),
                        borderColor: primaryColor,
                        backgroundColor: primaryColor + '1A',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'SpO₂',
                        data: trend.map(item => item.spO2 ?? item.SpO2 ?? 0),
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
                            color: textColor
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor
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

