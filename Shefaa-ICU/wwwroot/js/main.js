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
    const isAuthenticated = document.body.getAttribute('data-authenticated') === 'true';
    if (!isAuthenticated) {
        window.location.href = AppRoutes.login;
    }
}

function loadCurrentUser() {
    // Wait a bit to ensure __currentUser is set from the layout script
    setTimeout(() => {
        const currentUser = window.__currentUser || JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userNameElements = document.querySelectorAll('#currentUserName');
        userNameElements.forEach(el => {
            if (currentUser && currentUser.name && currentUser.name !== 'User') {
                el.textContent = currentUser.name;
            } else if (currentUser && currentUser.name) {
                el.textContent = currentUser.name;
            }
        });
        
        // Update avatar
        const userProfile = document.querySelector('.user-profile img');
        if (userProfile && currentUser && currentUser.name) {
            if (currentUser.profilePhotoPath) {
                userProfile.src = currentUser.profilePhotoPath;
            } else {
                userProfile.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=4F46E5&color=fff`;
            }
            userProfile.alt = currentUser.name;
        }
    }, 100);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        const logoutForm = document.getElementById('logoutForm');
        if (logoutForm) {
            logoutForm.submit();
        } else {
            window.location.href = AppRoutes.login;
        }
    }
}

// ===================================
// Navigation Functions
// ===================================
function initializeMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    // CRITICAL: Force sidebar hidden on mobile by default
    if (window.innerWidth < 992 && sidebar) {
        sidebar.classList.remove('active');
        // Force inline styles to ensure it's hidden
        sidebar.style.transform = 'translateX(-100%)';
        sidebar.style.visibility = 'hidden';
        sidebar.style.opacity = '0';
        sidebar.style.width = '0';
        sidebar.style.minWidth = '0';
        sidebar.style.maxWidth = '0';
    }
    
    // Also ensure main-content has no margin on mobile
    const mainContent = document.querySelector('.main-content');
    if (window.innerWidth < 992 && mainContent) {
        mainContent.style.marginLeft = '0';
        mainContent.style.width = '100%';
        mainContent.style.maxWidth = '100vw';
    }
    
    // Create sidebar overlay if it doesn't exist
    let sidebarOverlay = document.getElementById('sidebarOverlay');
    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement('div');
        sidebarOverlay.id = 'sidebarOverlay';
        sidebarOverlay.className = 'sidebar-overlay';
        document.body.appendChild(sidebarOverlay);
    }
    
    if (menuToggle && sidebar) {
        const toggleSidebar = () => {
            const wasActive = sidebar.classList.contains('active');
            const isMobile = window.innerWidth < 992;
            
            // Toggle the active class
            sidebar.classList.toggle('active');
            const isNowActive = sidebar.classList.contains('active');
            
            sidebarOverlay.classList.toggle('active');
            document.body.style.overflow = isNowActive ? 'hidden' : '';
            
            // On mobile, use setProperty with important to override CSS
            if (isMobile) {
                if (isNowActive) {
                    // Opening sidebar - use setProperty with important flag
                    sidebar.style.setProperty('transform', 'translateX(0)', 'important');
                    sidebar.style.setProperty('visibility', 'visible', 'important');
                    sidebar.style.setProperty('opacity', '1', 'important');
                    sidebar.style.setProperty('width', '280px', 'important');
                    sidebar.style.setProperty('min-width', '280px', 'important');
                    sidebar.style.setProperty('max-width', '280px', 'important');
                    sidebar.style.setProperty('pointer-events', 'auto', 'important');
                } else {
                    // Closing sidebar
                    sidebar.style.setProperty('transform', 'translateX(-100%)', 'important');
                    sidebar.style.setProperty('visibility', 'hidden', 'important');
                    sidebar.style.setProperty('opacity', '0', 'important');
                    sidebar.style.setProperty('width', '0', 'important');
                    sidebar.style.setProperty('min-width', '0', 'important');
                    sidebar.style.setProperty('max-width', '0', 'important');
                    sidebar.style.setProperty('pointer-events', 'none', 'important');
                }
            }
        };
        
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            toggleSidebar();
            // Toggle active class on button for visual feedback
            menuToggle.classList.toggle('active');
        });
        
        // Close sidebar when clicking overlay
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
            menuToggle.classList.remove('active');
            // Reset inline styles on mobile
            if (window.innerWidth < 992) {
                sidebar.style.transform = 'translateX(-100%)';
                sidebar.style.visibility = 'hidden';
                sidebar.style.opacity = '0';
                sidebar.style.width = '0';
                sidebar.style.minWidth = '0';
                sidebar.style.maxWidth = '0';
            }
        });
        
        // Close sidebar button (inside sidebar)
        const sidebarClose = document.getElementById('sidebarClose');
        if (sidebarClose) {
            sidebarClose.addEventListener('click', function(e) {
                e.stopPropagation();
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
                menuToggle.classList.remove('active');
                // Reset inline styles on mobile
                if (window.innerWidth < 992) {
                    sidebar.style.transform = 'translateX(-100%)';
                    sidebar.style.visibility = 'hidden';
                    sidebar.style.opacity = '0';
                    sidebar.style.width = '0';
                    sidebar.style.minWidth = '0';
                    sidebar.style.maxWidth = '0';
                }
            });
        }
        
        // Close sidebar when clicking navigation links on mobile
        const navLinks = sidebar.querySelectorAll('.nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 992) {
                    setTimeout(() => {
                        sidebar.classList.remove('active');
                        sidebarOverlay.classList.remove('active');
                        document.body.style.overflow = '';
                        menuToggle.classList.remove('active');
                        // Reset inline styles on mobile
                        sidebar.style.transform = 'translateX(-100%)';
                        sidebar.style.visibility = 'hidden';
                        sidebar.style.opacity = '0';
                        sidebar.style.width = '0';
                        sidebar.style.minWidth = '0';
                        sidebar.style.maxWidth = '0';
                    }, 150); // Small delay to allow navigation to start
                }
            });
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth < 992) {
                if (sidebar.classList.contains('active') && 
                    !sidebar.contains(e.target) && 
                    !menuToggle.contains(e.target) &&
                    !sidebarOverlay.contains(e.target)) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                    menuToggle.classList.remove('active');
                    // Reset inline styles on mobile
                    sidebar.style.transform = 'translateX(-100%)';
                    sidebar.style.visibility = 'hidden';
                    sidebar.style.opacity = '0';
                    sidebar.style.width = '0';
                    sidebar.style.minWidth = '0';
                    sidebar.style.maxWidth = '0';
                }
            }
        });
        
        // Close sidebar on window resize if it becomes desktop size
        // Also ensure it's hidden on mobile when resizing
        window.addEventListener('resize', function() {
            const isMobile = window.innerWidth < 992;
            const mainContent = document.querySelector('.main-content');
            
            if (window.innerWidth >= 992) {
                // Desktop: remove inline styles, let CSS handle it
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
                sidebar.style.transform = '';
                sidebar.style.visibility = '';
                sidebar.style.opacity = '';
                sidebar.style.width = '';
                sidebar.style.minWidth = '';
                sidebar.style.maxWidth = '';
                if (mainContent) {
                    mainContent.style.marginLeft = '';
                    mainContent.style.width = '';
                    mainContent.style.maxWidth = '';
                }
            } else {
                // Mobile: ensure sidebar is hidden if not active
                if (!sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                    sidebar.style.transform = 'translateX(-100%)';
                    sidebar.style.visibility = 'hidden';
                    sidebar.style.opacity = '0';
                    sidebar.style.width = '0';
                    sidebar.style.minWidth = '0';
                    sidebar.style.maxWidth = '0';
                }
                if (mainContent) {
                    mainContent.style.marginLeft = '0';
                    mainContent.style.width = '100%';
                    mainContent.style.maxWidth = '100vw';
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
    const root = document.documentElement;
    const bgColor = type === 'success' ? getComputedStyle(root).getPropertyValue('--success').trim() || '#34D399' : 
                    type === 'error' ? getComputedStyle(root).getPropertyValue('--danger').trim() || '#F87171' : 
                    type === 'warning' ? getComputedStyle(root).getPropertyValue('--warning').trim() || '#FBBF24' : 
                    getComputedStyle(root).getPropertyValue('--info').trim() || '#60A5FA';
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
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
    `;
    const root = document.documentElement;
    const primaryColor = getComputedStyle(root).getPropertyValue('--primary').trim() || '#6366F1';
    loader.innerHTML = `
        <div style="text-align: center;">
            <div class="spinner"></div>
            <p style="margin-top: 20px; color: ${primaryColor}; font-weight: 600;">Loading...</p>
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
let notificationDropdown = null;

async function initializeNotifications() {
    const notificationIcon = document.querySelector('.notification-icon');
    if (!notificationIcon) return;
    
    await updateNotificationBadge();
    
    notificationDropdown = await createNotificationsDropdown();
    notificationIcon.appendChild(notificationDropdown);
    
    notificationIcon.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isShowing = notificationDropdown.classList.contains('show');
        
        if (!isShowing) {
            await refreshNotificationsContent();
        }
        
        notificationDropdown.classList.toggle('show');
    });
    
    // Make sure badge and icon are clickable
    const badge = document.getElementById('notificationBadge');
    const icon = notificationIcon.querySelector('i');
    if (badge) {
        badge.style.pointerEvents = 'none'; // Let clicks pass through to parent
    }
    if (icon) {
        icon.style.pointerEvents = 'none'; // Let clicks pass through to parent
    }
    
    document.addEventListener('click', function(e) {
        if (!notificationIcon.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.classList.remove('show');
        }
    });
    
    setInterval(async () => {
        await updateNotificationBadge();
    }, 30000);
}

async function updateNotificationBadge() {
    try {
        const response = await fetch('/api/notifications/unread-count');
        if (!response.ok) {
            hideBadge();
            return;
        }
        const data = await response.json();
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const count = data.count || 0;
            if (count > 0) {
                badge.textContent = String(count);
                badge.style.display = 'flex';
            } else {
                hideBadge();
            }
        }
    } catch (error) {
        console.error('Error updating badge:', error);
        hideBadge();
    }
}

function hideBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = '';
        badge.style.display = 'none';
    }
}

async function createNotificationsDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'notifications-dropdown';
    
    const notifications = await getNotifications();
    
    function formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    
    dropdown.innerHTML = `
        <div class="notifications-header">
            <h6>Notifications</h6>
            ${notifications.some(n => n.unread) ? `<span class="mark-read" onclick="markAllAsRead()">Mark all as read</span>` : ''}
        </div>
        <div class="notifications-body">
            ${notifications.length > 0 ? 
                notifications.map(notif => `
                    <div class="notification-item-dropdown ${notif.unread ? 'unread' : ''}" onclick="handleNotificationClick(${notif.id})">
                        <div class="notification-icon-wrapper ${notif.type}">
                            <i class="fas ${notif.icon}"></i>
                        </div>
                        <div class="notification-content">
                            <p class="notification-title">${notif.title}</p>
                            <p class="notification-text">${notif.text}</p>
                            <p class="notification-time">${formatTime(notif.time)}</p>
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
    `;
    
    return dropdown;
}

let notificationsCache = [];

async function getNotifications() {
    try {
        const response = await fetch('/api/notifications?limit=20');
        if (!response.ok) return [];
        const data = await response.json();
        notificationsCache = data;
        return data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

async function handleNotificationClick(notificationId) {
    await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
    await refreshNotifications();
}

async function markAllAsRead() {
    try {
        await fetch('/api/notifications/mark-all-read', { method: 'POST' });
        await refreshNotifications();
        showToast('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

async function refreshNotificationsContent() {
    const notifications = await getNotifications();
    
    function formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    
    if (!notificationDropdown) return;
    
    const header = notificationDropdown.querySelector('.notifications-header');
    const body = notificationDropdown.querySelector('.notifications-body');
    
    if (header && body) {
        header.innerHTML = `
            <h6>Notifications</h6>
            ${notifications.some(n => n.unread) ? `<span class="mark-read" onclick="markAllAsRead()">Mark all as read</span>` : ''}
        `;
        
        body.innerHTML = notifications.length > 0 ? 
            notifications.map(notif => `
                <div class="notification-item-dropdown ${notif.unread ? 'unread' : ''}" onclick="handleNotificationClick(${notif.id})">
                    <div class="notification-icon-wrapper ${notif.type}">
                        <i class="fas ${notif.icon}"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-title">${notif.title}</p>
                        <p class="notification-text">${notif.text}</p>
                        <p class="notification-time">${formatTime(notif.time)}</p>
                    </div>
                </div>
            `).join('') 
            : 
            `<div class="notifications-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications</p>
            </div>`;
    }
}

async function refreshNotifications() {
    await updateNotificationBadge();
    await refreshNotificationsContent();
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


