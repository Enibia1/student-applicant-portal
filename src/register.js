// src/register.js - REMADEF Registration Logic
// Complete production-ready version

// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = 'https://6a60f589000c366da0d3.sfo.appwrite.run';
let currentMethod = 'email';

// ============================================================
// DOM ELEMENTS
// ============================================================

const registerForm = document.getElementById('register-form');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirm-password');
const fullNameInput = document.getElementById('full-name');
const errorDisplay = document.getElementById('error-message');
const successDisplay = document.getElementById('success-message');
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
// REAL-TIME DUPLICATE CHECK
// ============================================================

async function checkDuplicate(field, value) {
    if (!value || value.length < 3) return;
    
    try {
        const response = await fetch(`${API_URL}/check-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value })
        });
        const data = await response.json();
        
        const errorEl = document.getElementById(`${field}-error`);
        const input = document.getElementById(field);
        
        if (data.exists) {
            input.classList.add('input-error');
            if (errorEl) {
                errorEl.textContent = `This ${field} is already registered. Please login.`;
            }
            loginRedirect.style.display = 'block';
        } else {
            input.classList.remove('input-error');
            if (errorEl) {
                errorEl.textContent = '';
            }
            loginRedirect.style.display = 'none';
        }
    } catch (error) {
        console.error('Duplicate check failed:', error);
    }
}

emailInput.addEventListener('blur', function() {
    if (currentMethod === 'email' && this.value.trim()) {
        checkDuplicate('email', this.value.trim());
    }
});

phoneInput.addEventListener('blur', function() {
    if (currentMethod === 'phone' && this.value.trim()) {
        checkDuplicate('phone', normalizePhone(this.value.trim()));
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
    const fullName = fullNameInput.value.trim();
    
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
    
    // 4. Final duplicate check
    try {
        const checkResponse = await fetch(`${API_URL}/check-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email || undefined, phone: phone || undefined })
        });
        const checkData = await checkResponse.json();
        
        if (checkData.exists) {
            showError(`This ${checkData.field} is already registered. Please login.`);
            loginRedirect.style.display = 'block';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
    } catch (error) {
        console.error('Duplicate check failed:', error);
    }
    
    // 5. Submit registration
    try {
        const payload = {
            method: currentMethod,
            password: password,
            full_name: fullName || 'Remora Trainee'
        };
        if (email) payload.email = email;
        if (phone) payload.phone = phone;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`✅ ${data.message}`);
            loginRedirect.style.display = 'block';
            registerForm.style.display = 'none';
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showError(`❌ ${data.error || 'Registration failed. Please try again.'}`);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('🌐 Network error. Please check your connection and try again.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// ============================================================
// INITIALIZE
// ============================================================

console.log('📝 REMADEF Registration System loaded');
console.log(`📍 API: ${API_URL}`);
console.log('📧 Email support: ✅');
console.log('📱 Phone support: ✅');
