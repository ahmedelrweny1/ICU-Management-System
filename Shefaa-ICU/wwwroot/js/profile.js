// Pure MVC - only client-side validations and UI interactions, no data fetching

document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    populateProfileData();
    initializeFormValidations();
});

// Initialize Bootstrap Tabs
function initializeTabs() {
    const tabTriggerList = [].slice.call(document.querySelectorAll('#profileTabs button[data-bs-toggle="tab"], #profileTabs a[data-bs-toggle="tab"]'));
    tabTriggerList.map(function (tabTriggerEl) {
        return new bootstrap.Tab(tabTriggerEl);
    });
    
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
}

function switchTab(tabId) {
    document.querySelectorAll('#profileTabs .nav-link').forEach(function(link) {
        link.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-pane').forEach(function(pane) {
        pane.classList.remove('show', 'active');
    });
    
    const activeTab = document.querySelector(`#profileTabs a[href="#${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    const activePane = document.getElementById(tabId);
    if (activePane) {
        activePane.classList.add('show', 'active');
    }
}

// Populate profile data from server-rendered page
function populateProfileData() {
    const profileData = window.__profileData;
    if (!profileData) return;
    
    // Update header
    if (profileData.name) {
        document.getElementById('profileName').textContent = profileData.name;
    }
    if (profileData.role) {
        document.getElementById('profileRole').textContent = profileData.role;
    }
    if (profileData.email) {
        document.getElementById('profileEmail').textContent = profileData.email;
    }
    
    // Update stats
    if (profileData.daysActive !== undefined) {
        document.getElementById('memberSince').textContent = profileData.daysActive;
    }
    if (profileData.lastLogin) {
        const lastLogin = new Date(profileData.lastLogin);
        document.getElementById('lastLogin').textContent = lastLogin.toLocaleDateString();
    }
    
    // Update avatar if changed
    if (profileData.profilePhotoPath) {
        const avatar = document.getElementById('profileAvatar');
        if (avatar) {
            avatar.src = profileData.profilePhotoPath;
        }
    }
}

// Form validations
function initializeFormValidations() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            const newPassword = document.getElementById('NewPassword')?.value;
            const confirmPassword = document.getElementById('ConfirmPassword')?.value;
            
            if (newPassword && confirmPassword && newPassword !== confirmPassword) {
                e.preventDefault();
                alert('New passwords do not match');
                return false;
            }
            
            if (newPassword && newPassword.length < 8) {
                e.preventDefault();
                alert('Password must be at least 8 characters');
                return false;
            }
        });
    }
    
    const personalInfoForm = document.getElementById('personalInfoForm');
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', function(e) {
            const name = document.getElementById('Name')?.value;
            const email = document.getElementById('Email')?.value;
            
            if (!name || name.trim() === '') {
                e.preventDefault();
                alert('Name is required');
                return false;
            }
            
            if (!email || !email.includes('@')) {
                e.preventDefault();
                alert('Valid email is required');
                return false;
            }
        });
    }
}
