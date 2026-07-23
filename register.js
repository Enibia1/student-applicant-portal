// register.js - REMADEF Registration System
// Complete production-ready version

import { Client, Account, ID } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.0/+esm';

// Initialize Appwrite
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('YOUR_PROJECT_ID'); // Replace with your project ID

const account = new Account(client);

// DOM Elements
let currentMethod = 'email';
const registerForm = document.getElementById('register-form');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const errorDisplay = document.getElementById('error-message');
const successDisplay = document.getElementById('success-message');

// ============================================================
// 🔧 HELPER FUNCTIONS
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
    errorDisplay.style.color = '#dc3545';
    errorDisplay.style.padding = '10px';
    errorDisplay.style.borderRadius = '5px';
    errorDisplay.style.backgroundColor = '#f8d7da';
    errorDisplay.style.border = '1px solid #f5c6cb';
    errorDisplay.style.marginBottom = '15px';
    successDisplay.style.display = 'none';
}

function showSuccess(message) {
    successDisplay.textContent = message;
    successDisplay.style.display = 'block';
    successDisplay.style.color = '#155724';
    successDisplay.style.padding = '10px';
    successDisplay.style.borderRadius = '5px';
    successDisplay.style.backgroundColor = '#d4edda';
    successDisplay.style.border = '1px solid #c3e6cb';
    successDisplay.style.marginBottom = '15px';
    errorDisplay.style.display = 'none';
    registerForm.style.display = 'none';
}

function clearErrors() {
    errorDisplay.textContent = '';
    errorDisplay.style.display = 'none';
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

// ============================================================
// 🔄 METHOD SWITCHING
// ============================================================

function switchMethod(method) {
    currentMethod = method;
    clearErrors();
    
    const emailField = document.getElementById('email-field');
    const phoneField = document.getElementById('phone-field');
    const emailTab = document.getElementById('email-tab');
    const phoneTab = document.getElementById('phone-tab');
    
    if (method === 'email') {
        emailField.style.display = 'block';
        phoneField.style.display = 'none';
        emailInput.required = true;
        phoneInput.required = false;
        emailTab.classList.add('active');
        phoneTab.classList.remove('active');
    } else {
        emailField.style.display = 'none';
        phoneField.style.display = 'block';
        emailInput.required = false;
        phoneInput.required = true;
        phoneTab.classList.add('active');
        emailTab.classList.remove('active');
    }
}

// Make switchMethod globally accessible
window.switchMethod = switchMethod;

// ============================================================
// 🔍 REAL-TIME DUPLICATE CHECK
// ============================================================

async function checkDuplicate(field, value) {
    if (!value || value.length < 3) return;
    
    try {
        const response = await fetch('https://6a60f589000c366da0d3.sfo.appwrite.run/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value })
        });
        const data = await response.json();
        
        const errorEl = document.getElementById(`${field}-error`);
        
        if (data.exists) {
            const input = document.getElementById(field);
            input.classList.add('input-error');
            
            if (!errorEl) {
                const newError = document.createElement('div');
                newError.id = `${field}-error`;
                newError.className = 'field-error';
                newError.style.color = '#dc3545';
                newError.style.fontSize = '0.875rem';
                newError.style.marginTop = '5px';
                newError.textContent = `This ${field} is already registered. Please login.`;
                input.parentNode.appendChild(newError);
            }
            
            document.getElementById('login-redirect').style.display = 'block';
        } else {
            const input = document.getElementById(field);
            input.classList.remove('input-error');
            if (errorEl) errorEl.remove();
            document.getElementById('login-redirect').style.display = 'none';
        }
    } catch (error) {
        console.error('Duplicate check failed:', error);
    }
}

// Event listeners for real-time duplicate check
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
// 📊 PASSWORD STRENGTH INDICATOR
// ============================================================

passwordInput.addEventListener('input', function() {
    const password = this.value;
    const strengthEl = document.getElementById('password-strength');
    
    if (password.length === 0) {
        strengthEl.style.display = 'none';
        return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    strengthEl.style.display = 'block';
    
    if (strength <= 2) {
        strengthEl.textContent = '🔴 Weak - Add uppercase, lowercase, and numbers';
        strengthEl.style.color = '#dc3545';
    } else if (strength <= 3) {
        strengthEl.textContent = '🟡 Medium - Add special characters for stronger password';
        strengthEl.style.color = '#ffc107';
    } else {
        strengthEl.textContent = '🟢 Strong - Good password!';
        strengthEl.style.color = '#28a745';
    }
});

// ============================================================
// 👁️ PASSWORD TOGGLE
// ============================================================

document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        if (input.type === 'password') {
            input.type = 'text';
            this.textContent = '🙈';
        } else {
            input.type = 'password';
            this.textContent = '👁️';
        }
    });
});

// ============================================================
// 📝 FORM SUBMISSION
// ============================================================

registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();
    
    let email = emailInput.value.trim();
    let phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // 1. Validate based on method
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
        phone = ''; // Clear phone
    } else {
        if (!phone) {
            showError('📱 Phone number is required');
            phoneInput.focus();
            return;
        }
        if (!isValidPhone(phone)) {
            showError('📱 Please enter a valid Nigerian phone number (e.g., 08012345678)');
            phoneInput.focus();
            return;
        }
        email = ''; // Clear email
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
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        showError('🔑 Password must contain uppercase, lowercase, and a number');
        passwordInput.focus();
        return;
    }
    if (password !== confirmPassword) {
        showError('🔑 Passwords do not match');
        confirmPasswordInput.focus();
        return;
    }
    
    // 3. Show loading state
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Creating account...';
    submitBtn.disabled = true;
    
    // 4. Final duplicate check before sending
    try {
        const checkResponse = await fetch('https://6a60f589000c366da0d3.sfo.appwrite.run/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email || undefined,
                phone: phone || undefined
            })
        });
        const checkData = await checkResponse.json();
        
        if (checkData.exists) {
            showError(`This ${checkData.field} is already registered. Please login.`);
            document.getElementById('login-redirect').style.display = 'block';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
    } catch (error) {
        console.error('Pre-submission check failed:', error);
        // Continue anyway - backend will handle it
    }
    
    // 5. Send registration request
    try {
        const payload = {
            method: currentMethod,
            password: password
        };
        
        if (email) payload.email = email;
        if (phone) payload.phone = phone;
        
        const response = await fetch('https://6a60f589000c366da0d3.sfo.appwrite.run/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`✅ ${data.message}`);
            document.getElementById('login-redirect').style.display = 'block';
            
            // Auto-redirect to login after 3 seconds
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
// 🚀 INITIALIZE
// ============================================================

// Set default to email
switchMethod('email');

console.log('📝 REMADEF Registration System loaded successfully');
console.log('📍 Endpoint: https://6a60f589000c366da0d3.sfo.appwrite.run/');
console.log('📧 Email support: ✅');
console.log('📱 Phone support: ✅');
console.log('🔒 Password strength: ✅');
console.log('🔄 Duplicate check: ✅');
