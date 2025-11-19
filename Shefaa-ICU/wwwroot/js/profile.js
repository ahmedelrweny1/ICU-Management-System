// ===================================
// Profile Page JavaScript
// ===================================

// Make switchTab available globally immediately
function switchTab(tabId) {
    console.log('Switching to tab:', tabId);
    
    // Remove active class from all tabs and panes
    document.querySelectorAll('#profileTabs .nav-link').forEach(function(link) {
        link.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-pane').forEach(function(pane) {
        pane.classList.remove('show', 'active');
    });
    
    // Add active class to selected tab
    const activeTab = document.querySelector(`#profileTabs a[href="#${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Show selected pane
    const activePane = document.getElementById(tabId);
    if (activePane) {
        activePane.classList.add('show', 'active');
        console.log('Tab switched successfully to:', tabId);
    } else {
        console.error('Tab pane not found:', tabId);
    }
}

// Make it globally accessible
window.switchTab = switchTab;

document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    loadProfileData();
    initializeProfileForms();
    initializeAccountSettings();
    initializeNotificationSettings();
});

// ===================================
// Initialize Bootstrap Tabs
// ===================================
function initializeTabs() {
    console.log('Initializing tabs...');
    
    // Initialize Bootstrap tabs
    const tabTriggerList = [].slice.call(document.querySelectorAll('#profileTabs button[data-bs-toggle="tab"], #profileTabs a[data-bs-toggle="tab"]'));
    tabTriggerList.map(function (tabTriggerEl) {
        return new bootstrap.Tab(tabTriggerEl);
    });
    
    // Handle tab clicks manually if Bootstrap isn't working
    const tabLinks = document.querySelectorAll('#profileTabs .nav-link');
    tabLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                switchTab(targetId.substring(1));
            }
        });
    });
    
    // Handle Security button in header
    const securityBtn = document.querySelector('a[href="#security"][data-bs-toggle="tab"]');
    if (securityBtn) {
        securityBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab('security');
        });
    }
}

function switchTab(tabId) {
    console.log('Switching to tab:', tabId);
    
    // Remove active class from all tabs and panes
    document.querySelectorAll('#profileTabs .nav-link').forEach(function(link) {
        link.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-pane').forEach(function(pane) {
        pane.classList.remove('show', 'active');
    });
    
    // Add active class to selected tab
    const activeTab = document.querySelector(`#profileTabs a[href="#${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Show selected pane
    const activePane = document.getElementById(tabId);
    if (activePane) {
        activePane.classList.add('show', 'active');
        console.log('Tab switched successfully to:', tabId);
    } else {
        console.error('Tab pane not found:', tabId);
    }
}

// ===================================
// Load Profile Data
// ===================================
function loadProfileData() {
    // Check authentication from body attribute (set by server)
    const isAuthenticated = document.body.getAttribute('data-authenticated') === 'true';
    if (!isAuthenticated) {
        const target = window.AppRoutes?.login || '/';
        window.location.href = target;
        return;
    }
    
    // Get profile data from server (passed via ViewData or fetch)
    const profileData = window.__profileData || getProfileDataFromPage();
    
    if (!profileData || !profileData.name) {
        // Try to fetch from server
        fetchProfileData();
        return;
    }
    
    populateProfileData(profileData);
}

function getProfileDataFromPage() {
    // Try to get data from hidden input or data attribute
    const dataElement = document.getElementById('profileData');
    if (dataElement) {
        try {
            return JSON.parse(dataElement.value || dataElement.textContent);
        } catch (e) {
            console.error('Error parsing profile data:', e);
        }
    }
    return null;
}

async function fetchProfileData() {
    try {
        const response = await fetch('/Profile');
        if (response.ok) {
            // If response is HTML, we're already on the page with data
            // The data should be in ViewData
            loadProfileData();
        }
    } catch (error) {
        console.error('Error fetching profile data:', error);
    }
}

function populateProfileData(data) {
    console.log('Populating profile data:', data);
    
    // Update profile header
    const profileNameEl = document.getElementById('profileName');
    const profileRoleEl = document.getElementById('profileRole');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileAvatarEl = document.getElementById('profileAvatar');
    
    if (profileNameEl) profileNameEl.textContent = data.name || 'User Name';
    if (profileRoleEl) profileRoleEl.textContent = data.role || 'Role';
    if (profileEmailEl) profileEmailEl.textContent = data.email || 'email@example.com';
    
    // Update avatar
    if (profileAvatarEl) {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=6366F1&color=fff&size=120`;
        profileAvatarEl.src = avatarUrl;
    }
    
    // Days active
    const memberSinceEl = document.getElementById('memberSince');
    if (memberSinceEl) {
        if (data.daysActive !== undefined) {
            memberSinceEl.textContent = data.daysActive;
        } else {
            memberSinceEl.textContent = '0';
        }
    }
    
    // Last login
    const lastLoginEl = document.getElementById('lastLogin');
    if (lastLoginEl) {
        if (data.lastLogin) {
            try {
                const lastLoginDate = new Date(data.lastLogin);
                lastLoginEl.textContent = lastLoginDate.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                lastLoginEl.textContent = '-';
            }
        } else {
            lastLoginEl.textContent = '-';
        }
    }
    
    // Populate Personal Info form
    const nameParts = (data.name || '').split(' ');
    const firstNameEl = document.getElementById('firstName');
    const lastNameEl = document.getElementById('lastName');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const roleEl = document.getElementById('role');
    const departmentEl = document.getElementById('department');
    
    if (firstNameEl) firstNameEl.value = nameParts[0] || '';
    if (lastNameEl) lastNameEl.value = nameParts.slice(1).join(' ') || '';
    if (emailEl) emailEl.value = data.email || '';
    if (phoneEl) phoneEl.value = data.phoneNumber || '';
    if (roleEl) roleEl.value = data.role || '';
    if (departmentEl) departmentEl.value = data.specialty || 'ICU Department';
}

// ===================================
// Initialize Forms
// ===================================
function initializeProfileForms() {
    console.log('Initializing profile forms...');
    
    // Personal Info Form
    const personalInfoForm = document.getElementById('personalInfoForm');
    if (personalInfoForm) {
        console.log('Personal info form found');
        personalInfoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Personal info form submitted');
            savePersonalInfo();
        });
    } else {
        console.error('Personal info form not found!');
    }
    
    // Change Password Form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        console.log('Change password form found');
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Change password form submitted');
            changePassword();
        });
    } else {
        console.error('Change password form not found!');
    }
}

function initializeAccountSettings() {
    console.log('Initializing account settings...');
    const accountSettingsForm = document.getElementById('accountSettingsForm');
    if (accountSettingsForm) {
        console.log('Account settings form found');
        accountSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Account settings form submitted');
            saveAccountSettings();
        });
    } else {
        console.error('Account settings form not found!');
    }
    
    // Load saved settings from localStorage (or fetch from server)
    loadAccountSettings();
}

function initializeNotificationSettings() {
    console.log('Initializing notification settings...');
    const saveBtn = document.getElementById('saveNotificationSettingsBtn');
    if (saveBtn) {
        console.log('Notification settings button found');
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Notification settings button clicked');
            saveNotificationSettings();
        });
    } else {
        console.error('Notification settings button not found!');
    }
    
    // Load saved settings from localStorage (or fetch from server)
    loadNotificationSettings();
}

// ===================================
// Personal Information
// ===================================
async function savePersonalInfo() {
    const firstName = document.getElementById('firstName')?.value.trim() || '';
    const lastName = document.getElementById('lastName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const department = document.getElementById('department')?.value.trim() || '';
    
    // Validation
    if (!firstName || !lastName || !email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    const data = {
        name: `${firstName} ${lastName}`.trim(),
        email: email,
        phoneNumber: phone || null,
        specialty: department || null
    };
    
    console.log('Saving personal info:', data);
    
    try {
        showLoading(true);
        const response = await fetch('/Profile/UpdatePersonalInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);
        showLoading(false);
        
        if (result.success) {
            showToast(result.message || 'Profile updated successfully!', 'success');
            // Reload page to get updated data
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast(result.message || 'Error updating profile', 'error');
        }
    } catch (error) {
        showLoading(false);
        console.error('Error updating profile:', error);
        showToast('Error updating profile. Please try again.', 'error');
    }
}

// ===================================
// Change Password
// ===================================
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value || '';
    const newPassword = document.getElementById('newPassword')?.value || '';
    const confirmPassword = document.getElementById('confirmNewPassword')?.value || '';
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('New password must be at least 8 characters', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    const data = {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
    };
    
    try {
        showLoading(true);
        const response = await fetch('/Profile/ChangePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        showLoading(false);
        
        if (result.success) {
            showToast(result.message || 'Password changed successfully!', 'success');
            // Reset form
            document.getElementById('changePasswordForm')?.reset();
        } else {
            showToast(result.message || 'Error changing password', 'error');
        }
    } catch (error) {
        showLoading(false);
        console.error('Error changing password:', error);
        showToast('Error changing password. Please try again.', 'error');
    }
}

// ===================================
// Account Settings
// ===================================
function loadAccountSettings() {
    // Load from localStorage (in production, fetch from server)
    const settings = JSON.parse(localStorage.getItem('accountSettings') || '{}');
    
    const languageEl = document.getElementById('accountLanguage');
    const timezoneEl = document.getElementById('accountTimezone');
    const profileVisibleEl = document.getElementById('profileVisibility');
    const showOnlineStatusEl = document.getElementById('showOnlineStatus');
    
    if (languageEl && settings.language) languageEl.value = settings.language;
    if (timezoneEl && settings.timezone) timezoneEl.value = settings.timezone;
    if (profileVisibleEl !== null) profileVisibleEl.checked = settings.profileVisible !== false;
    if (showOnlineStatusEl !== null) showOnlineStatusEl.checked = settings.showOnlineStatus !== false;
}

async function saveAccountSettings() {
    const language = document.getElementById('accountLanguage')?.value || 'en';
    const timezone = document.getElementById('accountTimezone')?.value || 'utc';
    const profileVisible = document.getElementById('profileVisibility')?.checked ?? true;
    const showOnlineStatus = document.getElementById('showOnlineStatus')?.checked ?? true;
    
    const data = {
        language: language,
        timezone: timezone,
        profileVisible: profileVisible,
        showOnlineStatus: showOnlineStatus
    };
    
    try {
        showLoading(true);
        const response = await fetch('/Profile/UpdateAccountSettings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        showLoading(false);
        
        if (result.success) {
            // Save to localStorage as backup
            localStorage.setItem('accountSettings', JSON.stringify(data));
            showToast(result.message || 'Account settings saved successfully!', 'success');
        } else {
            showToast(result.message || 'Error saving settings', 'error');
        }
    } catch (error) {
        showLoading(false);
        console.error('Error saving account settings:', error);
        // Save to localStorage as fallback
        localStorage.setItem('accountSettings', JSON.stringify(data));
        showToast('Settings saved locally. Server sync will be available soon.', 'info');
    }
}

// ===================================
// Notification Settings
// ===================================
function loadNotificationSettings() {
    // Load from localStorage (in production, fetch from server)
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    
    const notifPatientsEl = document.getElementById('notifPatients');
    const notifRoomsEl = document.getElementById('notifRooms');
    const notifScheduleEl = document.getElementById('notifSchedule');
    const notifEmailEl = document.getElementById('notifEmail');
    
    if (notifPatientsEl !== null) notifPatientsEl.checked = settings.patientUpdates !== false;
    if (notifRoomsEl !== null) notifRoomsEl.checked = settings.roomAssignments !== false;
    if (notifScheduleEl !== null) notifScheduleEl.checked = settings.scheduleChanges !== false;
    if (notifEmailEl !== null) notifEmailEl.checked = settings.emailNotifications === true;
}

async function saveNotificationSettings() {
    const patientUpdates = document.getElementById('notifPatients')?.checked ?? true;
    const roomAssignments = document.getElementById('notifRooms')?.checked ?? true;
    const scheduleChanges = document.getElementById('notifSchedule')?.checked ?? true;
    const emailNotifications = document.getElementById('notifEmail')?.checked ?? false;
    
    const data = {
        patientUpdates: patientUpdates,
        roomAssignments: roomAssignments,
        scheduleChanges: scheduleChanges,
        emailNotifications: emailNotifications
    };
    
    try {
        showLoading(true);
        const response = await fetch('/Profile/UpdateNotificationSettings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        showLoading(false);
        
        if (result.success) {
            // Save to localStorage as backup
            localStorage.setItem('notificationSettings', JSON.stringify(data));
            showToast(result.message || 'Notification settings saved successfully!', 'success');
        } else {
            showToast(result.message || 'Error saving settings', 'error');
        }
    } catch (error) {
        showLoading(false);
        console.error('Error saving notification settings:', error);
        // Save to localStorage as fallback
        localStorage.setItem('notificationSettings', JSON.stringify(data));
        showToast('Settings saved locally. Server sync will be available soon.', 'info');
    }
}

// ===================================
// Avatar Upload
// ===================================
function changeAvatar() {
    showToast('Avatar upload will be available in a future update', 'info');
    // TODO: Implement file upload functionality
    // const input = document.createElement('input');
    // input.type = 'file';
    // input.accept = 'image/*';
    // input.onchange = async (e) => {
    //     const file = e.target.files[0];
    //     if (file) {
    //         const formData = new FormData();
    //         formData.append('avatar', file);
    //         await fetch('/Profile/UploadAvatar', { method: 'POST', body: formData });
    //     }
    // };
    // input.click();
}

// ===================================
// Helper Functions
// ===================================
function getAntiForgeryToken() {
    const tokenElement = document.querySelector('input[name="__RequestVerificationToken"]');
    return tokenElement ? tokenElement.value : '';
}

// Debug function to check if profile data loaded
console.log('Profile page loaded. Profile data:', window.__profileData);
