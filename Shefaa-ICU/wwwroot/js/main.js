// ===================================
// Shefaa - ICU Management System
// Main JavaScript - Global Functions and Utilities
// ===================================

const AppRoutes = {
    login: '/',
    signup: '/Home/Signup',
    dashboard: '/Dashboard',
    patients: '/Patients',
    patientDetails: (id) => `/Patients/Details?id=${encodeURIComponent(id || '')}`
};

window.AppRoutes = AppRoutes;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = (window.location.pathname || '/').toLowerCase();
    if (!isAuthPage(currentPath)) {
        checkAuth();
    }
    
    loadCurrentUser();
    initializeMenuToggle();
    initializeNotifications();
});

// ===================================
// Authentication Functions
// ===================================
function isAuthPage(pathname) {
    const normalized = pathname.replace(/\/+$/, '');
    return normalized === '' ||
        normalized === '/' ||
        normalized === '/home' ||
        normalized === '/home/index' ||
        normalized === '/home/signup';
}

function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = AppRoutes.login;
    }
}

function loadCurrentUser() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userNameElements = document.querySelectorAll('#currentUserName');
    userNameElements.forEach(el => {
        if (currentUser.name) {
            el.textContent = currentUser.name;
        }
    });
    
    // Update avatar
    const userProfile = document.querySelector('.user-profile img');
    if (userProfile && currentUser.name) {
        userProfile.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=4F46E5&color=fff`;
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = AppRoutes.login;
    }
}

// ===================================
// Navigation Functions
// ===================================
function initializeMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth < 992) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
}

// ===================================
// Utility Functions
// ===================================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calculateDaysInICU(admissionDate) {
    if (!admissionDate) return 0;
    const admission = new Date(admissionDate);
    const today = new Date();
    const diffTime = Math.abs(today - admission);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function getConditionBadgeClass(condition) {
    switch(condition) {
        case 'Critical':
            return 'bg-danger';
        case 'Stable':
            return 'bg-success';
        case 'Moderate':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'Available':
            return 'bg-success';
        case 'Occupied':
            return 'bg-danger';
        case 'Cleaning':
            return 'bg-warning';
        case 'On Duty':
        case 'Present':
            return 'bg-success';
        case 'Off Duty':
        case 'Absent':
            return 'bg-secondary';
        case 'On Call':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

// ===================================
// Toast Notification System
// ===================================
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#34D399' : type === 'error' ? '#F87171' : type === 'warning' ? '#FBBF24' : '#60A5FA';
    toast.style.cssText = `
        background: ${bgColor};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        margin-bottom: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        font-weight: 500;
        cursor: pointer;
    `;
    
    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
                 type === 'error' ? '<i class="fas fa-times-circle"></i>' : 
                 type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' :
                 '<i class="fas fa-info-circle"></i>';
    toast.innerHTML = `<span style="font-size: 18px;">${icon}</span><span style="flex: 1;">${message}</span>`;
    
    // Close on click
    toast.onclick = () => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    };
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===================================
// Loading State Management
// ===================================
function showPageLoading() {
    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
    `;
    loader.innerHTML = `
        <div style="text-align: center;">
            <div class="spinner"></div>
            <p style="margin-top: 20px; color: #6366F1; font-weight: 600;">Loading...</p>
        </div>
    `;
    document.body.appendChild(loader);
}

function hidePageLoading() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s';
        setTimeout(() => loader.remove(), 300);
    }
}

// ===================================
// Form Validation Helpers
// ===================================
function validateFormField(input, isValid) {
    input.classList.remove('is-valid', 'is-invalid');
    if (isValid === true) {
        input.classList.add('is-valid');
    } else if (isValid === false) {
        input.classList.add('is-invalid');
    }
}

function addRealTimeValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            const isValid = input.checkValidity();
            validateFormField(input, isValid);
        });
        
        input.addEventListener('input', () => {
            if (input.classList.contains('is-invalid')) {
                const isValid = input.checkValidity();
                if (isValid) {
                    validateFormField(input, true);
                }
            }
        });
    });
}

// Add animation styles
if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ===================================
// Search Functionality
// ===================================
function initializeSearch(inputId, dataArray, filterFunction) {
    const searchInput = document.getElementById(inputId);
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterFunction(searchTerm);
        });
    }
}

// ===================================
// Export Functions (for future use with ASP.NET MVC)
// ===================================
function exportPDF() {
    showToast('PDF export will be implemented with ASP.NET MVC backend', 'info');
    // For ASP.NET MVC: window.location.href = '/Reports/ExportPDF';
}

function exportCSV() {
    showToast('CSV export will be implemented with ASP.NET MVC backend', 'info');
    // For ASP.NET MVC: window.location.href = '/Reports/ExportCSV';
}

// ===================================
// Form Validation Helpers
// ===================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$/;
    return re.test(phone);
}

function validateRequired(value) {
    return value && value.trim() !== '';
}

// ===================================
// Modal Helpers
// ===================================
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    }
}

function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

// ===================================
// Loading Indicator
// ===================================
function showLoading(show = true) {
    let loader = document.getElementById('loadingOverlay');
    if (!loader && show) {
        loader = document.createElement('div');
        loader.id = 'loadingOverlay';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        loader.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; text-align: center;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div style="margin-top: 15px; font-weight: 500;">Loading...</div>
            </div>
        `;
        document.body.appendChild(loader);
    } else if (loader && !show) {
        loader.remove();
    }
}

// ===================================
// Confirmation Dialog
// ===================================
function confirmAction(message) {
    return confirm(message);
}

// ===================================
// Number Animation for Statistics
// ===================================
function animateNumber(element, start, end, duration) {
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16); // 60 FPS
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// ===================================
// Notifications System
// ===================================
function initializeNotifications() {
    const notificationIcon = document.querySelector('.notification-icon');
    if (!notificationIcon) return;
    
    // Update badge count
    updateNotificationBadge();
    
    // Create notifications dropdown
    const dropdown = createNotificationsDropdown();
    notificationIcon.appendChild(dropdown);
    
    // Toggle dropdown on click
    notificationIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationIcon.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

function updateNotificationBadge() {
    const notifications = getNotifications();
    const unreadCount = notifications.filter(n => n.unread).length;
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function createNotificationsDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'notifications-dropdown';
    
    // Get notifications (sample data for now)
    const notifications = getNotifications();
    
    dropdown.innerHTML = `
        <div class="notifications-header">
            <h6>Notifications</h6>
            <span class="mark-read" onclick="markAllAsRead()">Mark all as read</span>
        </div>
        <div class="notifications-body">
            ${notifications.length > 0 ? 
                notifications.map(notif => `
                    <div class="notification-item-dropdown ${notif.unread ? 'unread' : ''}" onclick="handleNotificationClick('${notif.id}')">
                        <div class="notification-icon-wrapper ${notif.type}">
                            <i class="fas ${notif.icon}"></i>
                        </div>
                        <div class="notification-content">
                            <p class="notification-title">${notif.title}</p>
                            <p class="notification-text">${notif.text}</p>
                            <p class="notification-time">${notif.time}</p>
                        </div>
                    </div>
                `).join('') 
                : 
                `<div class="notifications-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>`
            }
        </div>
        ${notifications.length > 0 ? `
            <div class="notifications-footer">
                <a href="#" onclick="viewAllNotifications()">View all notifications</a>
            </div>
        ` : ''}
    `;
    
    return dropdown;
}

function getNotifications() {
    // Sample notifications - will be replaced with API call in ASP.NET MVC
    return [
        {
            id: '1',
            type: 'danger',
            icon: 'fa-exclamation-circle',
            title: 'Critical Patient Alert',
            text: 'Patient John Doe (Room 101) vitals are critical',
            time: '2 minutes ago',
            unread: true
        },
        {
            id: '2',
            type: 'success',
            icon: 'fa-check-circle',
            title: 'Patient Discharged',
            text: 'Jane Smith has been successfully discharged',
            time: '1 hour ago',
            unread: true
        },
        {
            id: '3',
            type: 'info',
            icon: 'fa-user-md',
            title: 'Shift Change',
            text: 'Evening shift starts in 30 minutes',
            time: '3 hours ago',
            unread: false
        },
        {
            id: '4',
            type: 'warning',
            icon: 'fa-bed',
            title: 'Room Maintenance',
            text: 'Room 105 requires cleaning',
            time: '5 hours ago',
            unread: false
        }
    ];
}

function handleNotificationClick(notificationId) {
    console.log('Notification clicked:', notificationId);
    // Mark as read and navigate to relevant page
    // For ASP.NET MVC: await fetch(`/api/notifications/read/${notificationId}`)
}

function markAllAsRead() {
    const unreadItems = document.querySelectorAll('.notification-item-dropdown.unread');
    unreadItems.forEach(item => item.classList.remove('unread'));
    
    // Update badge
    updateNotificationBadge();
    
    showToast('All notifications marked as read', 'success');
    // For ASP.NET MVC: await fetch('/api/notifications/markallread', { method: 'POST' })
}

function viewAllNotifications() {
    // Navigate to notifications page
    // window.location.href = 'notifications.html';
    showToast('Full notifications page coming soon', 'info');
}

// ===================================
// Local Storage Helpers (for ASP.NET MVC migration)
// ===================================
/* 
   These can be replaced with API calls:
   
   getData(key) -> fetch(`/api/data/${key}`)
   setData(key, value) -> fetch('/api/data/save', { method: 'POST', body: JSON.stringify({key, value}) })
*/
function getData(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
        console.error('Error parsing data:', e);
        return [];
    }
}

function setData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Error saving data:', e);
        return false;
    }
}

