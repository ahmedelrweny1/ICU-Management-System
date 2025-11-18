// ===================================
// Profile Page JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    loadProfileData();
    initializeProfileForms();
});

function loadProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.userId) {
        const target = window.AppRoutes?.login || '/';
        window.location.href = target;
        return;
    }
    
    // Update profile header
    document.getElementById('profileName').textContent = currentUser.name || 'User Name';
    document.getElementById('profileRole').textContent = currentUser.role || 'Role';
    document.getElementById('profileEmail').textContent = currentUser.email || 'email@example.com';
    
    // Update avatars
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=6366F1&color=fff&size=120`;
    document.getElementById('profileAvatar').src = avatarUrl;
    
    // Calculate days active
    if (currentUser.loginTime) {
        const loginDate = new Date(currentUser.loginTime);
        const today = new Date();
        const diffTime = Math.abs(today - loginDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        document.getElementById('memberSince').textContent = diffDays;
    }
    
    // Last login
    if (currentUser.loginTime) {
        const loginDate = new Date(currentUser.loginTime);
        document.getElementById('lastLogin').textContent = loginDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Populate form fields
    const nameParts = (currentUser.name || 'User Name').split(' ');
    document.getElementById('firstName').value = nameParts[0] || '';
    document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
    document.getElementById('email').value = currentUser.email || '';
    document.getElementById('role').value = currentUser.role || '';
    document.getElementById('phone').value = '';
    document.getElementById('department').value = 'ICU Department';
    document.getElementById('bio').value = '';
}

function initializeProfileForms() {
    // Personal Info Form
    const personalInfoForm = document.getElementById('personalInfoForm');
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePersonalInfo();
        });
    }
    
    // Change Password Form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
}

function savePersonalInfo() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const department = document.getElementById('department').value.trim();
    const bio = document.getElementById('bio').value.trim();
    
    // Validation
    if (!firstName || !lastName || !email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    // Update current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.name = `${firstName} ${lastName}`;
    currentUser.email = email;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update users array
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.username === currentUser.userId);
    if (userIndex !== -1) {
        users[userIndex].firstName = firstName;
        users[userIndex].lastName = lastName;
        users[userIndex].email = email;
        users[userIndex].phone = phone;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    showToast('Profile updated successfully!');
    loadProfileData();
}

function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
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
    
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === currentUser.userId);
    
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    
    // Verify current password
    if (user.password !== currentPassword) {
        showToast('Current password is incorrect', 'error');
        return;
    }
    
    // Update password
    user.password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    
    showToast('Password changed successfully!');
    
    // Reset form
    document.getElementById('changePasswordForm').reset();
}

function changeAvatar() {
    showToast('Avatar upload will be available with ASP.NET MVC backend', 'info');
    // For ASP.NET MVC: implement file upload functionality
}

