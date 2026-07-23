// src/register.js - REMADEF Registration Logic
// Updated: Removed full name, auto-redirect to login

// ============================================================
// CONFIGURATION - PUT YOUR ACTUAL URL HERE!
// ============================================================

// 🔥 IMPORTANT: Replace this with YOUR Appwrite function URL
const API_URL = 'https://6a60f589000c366da0d3.sfo.appwrite.run'; // <-- CHANGE THIS!

let currentMethod = 'email';
let redirectTimer = null;

// ============================================================
// DOM ELEMENTS
// ============================================================

const registerForm = document.getElementById('register-form');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirm-password');
const errorDisplay = document.getElementById('error-message');
const successDisplay = document.getElementById('success-message');
const successOverlay = document.getElementById('success-overlay');
const traineeIdDisplay = document.getElementById('trainee-id-display');
const countdownDisplay = document.getElementById('countdown');
const emailTab = document.getElementById('email-tab');
const phoneTab = document.getElementById('phone-tab');
const emailField = document.getElementById('email-field');
const phoneField = document.getElementById('phone-field');
const loginRedirect = document.getElementById('login-redirect');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    const clean = phone.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 11;
}

function normalizePhone(phone) {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
        return '+234' + clean.slice(1);
    } else if (clean.startsWith('234') && !clean.startsWith('+')) {
        return '+' + clean;
    } else if (!clean.startsWith('+') && clean.length === 10) {
        return '+234' + clean;
    }
    return clean;
}

function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';
    successDisplay.style.display = 'none';
    successOverlay.style.display = 'none';
}

function showSuccess(message) {
    successDisplay.textContent = message;
    successDisplay.style.display = 'block';
    errorDisplay.style.display = 'none';
}

function clearErrors() {
    errorDisplay.textContent = '';
    errorDisplay.style.display = 'none';
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

// ============================================================
// NAVIGATION
// ============================================================

window.goToLogin = function() {
    // Redirect to login page (create login.html later)
    // For now, show a message
    alert('Login page coming soon! 🚀\n\nFor now, you can login at:\nhttps://cloud.appwrite.io/console');
    
    // When login.html is created, use:
    // window.location.href = 'login.html';
};

// ============================================================
// METHOD SWITCHING
// ============================================================

window.switchMethod = function(method) {
    currentMethod = method;
    clearErrors();
    
    if (method === 'email') {
        emailField.classList.remove('hidden');
        phoneField.classList.add('hidden');
        emailInput.required = true;
        phoneInput.required = false;
        emailTab.classList.add('active');
        phoneTab.classList.remove('active');
    } else {
        emailField.classList.add('hidden');
        phoneField.classList.remove('hidden');
        emailInput.required = false;
        phoneInput.required = true;
        phoneTab.classList.add('active');
        emailTab.classList.remove('active');
    }
};

// ============================================================
// PASSWORD TOGGLE
// ============================================================

window.togglePassword = function(fieldId) {
    const input = document.getElementById(fieldId);
    const button = input.parentElement.querySelector('.password-toggle');
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
};

// ============================================================
// PASSWORD STRENGTH
// ============================================================

passwordInput.addEventListener('input', function() {
    const password = this.value;
    const strengthEl = document.getElementById('password-strength');
    
    if (password.length === 0) {
        strengthEl.style.display = 'none';
        return;
    }
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    
    strengthEl.style.display = 'block';
    
    if (score <= 1) {
        strengthEl.textContent = '🔴 Weak - Use 8+ chars, uppercase, lowercase, and numbers';
        strengthEl.style.color = '#dc3545';
    } else if (score <= 2) {
        strengthEl.textContent = '🟡 Medium - Add more variety for stronger password';
        strengthEl.style.color = '#ffc107';
    } else {
        strengthEl.textContent = '🟢 Strong - Good password!';
        strengthEl.style.color = '#28a745';
    }
});

// ============================================================
// FORM SUBMISSION
// ============================================================

registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();
    
    let email = emailInput.value.trim();
    let phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    
    console.log('📝 Starting registration...');
    console.log('API URL:', API_URL);
    
    // 1. Validate method
    if (currentMethod === 'email') {
        if (!email) {
            showError('📧 Email address is required');
            emailInput.focus();
            return;
        }
        if (!isValidEmail(email)) {
            showError('📧 Please enter a valid email address');
            emailInput.focus();
            return;
        }
        phone = '';
    } else {
        if (!phone) {
            showError('📱 Phone number is required');
            phoneInput.focus();
            return;
        }
        if (!isValidPhone(phone)) {
            showError('📱 Enter a valid Nigerian phone number (e.g., 08012345678)');
            phoneInput.focus();
            return;
        }
        email = '';
        phone = normalizePhone(phone);
    }
    
    // 2. Validate password
    if (!password) {
        showError('🔑 Password is required');
        passwordInput.focus();
        return;
    }
    if (password.length < 8) {
        showError('🔑 Password must be at least 8 characters');
        passwordInput.focus();
        return;
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
        showError('🔑 Password must contain uppercase, lowercase, and a number');
        passwordInput.focus();
        return;
    }
    if (password !== confirmPassword) {
        showError('🔑 Passwords do not match');
        confirmInput.focus();
        return;
    }
    
    // 3. Show loading
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Creating account...';
    submitBtn.disabled = true;
    
    // 4. Submit registration
    try {
        const payload = {
            method: currentMethod,
            password: password
            // No full_name - will default to 'Remora Trainee' in backend
        };
        if (email) payload.email = email;
        if (phone) payload.phone = phone;
        
        console.log('📤 Sending payload:', payload);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📥 Response status:', response.status);
        
        let data;
        try {
            data = await response.json();
            console.log('📦 Response data:', data);
        } catch (parseError) {
            console.error('❌ Failed to parse response:', parseError);
            const text = await response.text();
            console.log('📄 Raw response:', text);
            showError('❌ Server returned invalid response. Please check Appwrite logs.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        if (data.success) {
            // Show success with trainee ID
            const traineeId = data.data?.trainee_id || 'REM-0000';
            showRegistrationSuccess(traineeId);
            
            // Hide form
            registerForm.style.display = 'none';
            loginRedirect.style.display = 'none';
            
            // Start redirect countdown
            startRedirectCountdown(3);
            
        } else {
            showError(`❌ ${data.error || 'Registration failed. Please try again.'}`);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('❌ Registration error:', error);
        console.error('Error details:', error.message);
        showError(`🌐 Network error: ${error.message}. Please check your connection and try again.`);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// ============================================================
// SUCCESS HANDLING
// ============================================================

function showRegistrationSuccess(traineeId) {
    // Hide form
    registerForm.style.display = 'none';
    loginRedirect.style.display = 'none';
    
    // Show success overlay
    successOverlay.style.display = 'block';
    traineeIdDisplay.textContent = traineeId;
}

function startRedirectCountdown(seconds) {
    let remaining = seconds;
    countdownDisplay.textContent = remaining;
    
    if (redirectTimer) {
        clearInterval(redirectTimer);
    }
    
    redirectTimer = setInterval(() => {
        remaining--;
        countdownDisplay.textContent = remaining;
        
        if (remaining <= 0) {
            clearInterval(redirectTimer);
            // Redirect to login page
            window.location.href = 'login.html';
        }
    }, 1000);
}

// ============================================================
// INITIALIZE
// ============================================================

console.log('📝 REMADEF Registration System loaded');
console.log(`📍 API URL: ${API_URL}`);
console.log('📧 Email support: ✅');
console.log('📱 Phone support: ✅');
console.log('👤 Full name: Removed (will be in profile edit)');
console.log('🔐 Auto-redirect to login: ✅');
console.log('💡 If you see network error, check API_URL in register.js');
