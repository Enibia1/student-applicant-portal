// register.js - Complete Fixed Version

import { Client, Account, ID } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.0/+esm';

// Initialize Appwrite
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('YOUR_PROJECT_ID'); // Replace with your project ID

const account = new Account(client);

// DOM Elements
const registrationMethod = document.querySelector('input[name="method"]:checked') || { value: 'email' };
const emailField = document.getElementById('email-field');
const phoneField = document.getElementById('phone-field');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const registerForm = document.getElementById('register-form');
const errorDisplay = document.getElementById('error-message');
const successDisplay = document.getElementById('success-message');

// ✅ Track current registration method
let currentMethod = 'email';

// ✅ Toggle between Email and Phone
function switchMethod(method) {
    currentMethod = method;
    
    if (method === 'email') {
        emailField.style.display = 'block';
        phoneField.style.display = 'none';
        emailInput.required = true;
        phoneInput.required = false;
        // Clear phone validation errors
        phoneInput.classList.remove('error');
        document.getElementById('phone-error')?.remove();
    } else {
        emailField.style.display = 'none';
        phoneField.style.display = 'block';
        emailInput.required = false;
        phoneInput.required = true;
        // Clear email validation errors
        emailInput.classList.remove('error');
        document.getElementById('email-error')?.remove();
    }
    
    // Clear all errors when switching
    clearErrors();
}

// ✅ Email validation
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ✅ Phone validation (Nigerian format)
function isValidPhone(phone) {
    // Remove non-digits
    const clean = phone.replace(/\D/g, '');
    // Must be 10-11 digits (08012345678 or +2348012345678)
    return clean.length >= 10 && clean.length <= 13;
}

// ✅ Normalize phone number to +234 format
function normalizePhone(phone) {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
        clean = '+234' + clean.slice(1);
    } else if (clean.startsWith('234') && !clean.startsWith('+')) {
        clean = '+' + clean;
    } else if (!clean.startsWith('+') && clean.length === 10) {
        clean = '+234' + clean;
    }
    return clean;
}

// ✅ Check for existing user BEFORE submission
async function checkExistingUser(email, phone) {
    try {
        // This calls your Appwrite function to check duplicates
        const response = await fetch('https://6a60f589000c366da0d3.sfo.appwrite.run/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email || undefined,
                phone: phone || undefined
            })
        });
        const data = await response.json();
        return data.exists || false;
    } catch (error) {
        console.error('Duplicate check failed:', error);
        return false;
    }
}

// ✅ Clear all error messages
function clearErrors() {
    errorDisplay.textContent = '';
    errorDisplay.style.display = 'none';
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

// ✅ Display error
function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';
    errorDisplay.style.color = '#dc3545';
    errorDisplay.style.padding = '10px';
    errorDisplay.style.borderRadius = '5px';
    errorDisplay.style.backgroundColor = '#f8d7da';
    errorDisplay.style.border = '1px solid #f5c6cb';
    errorDisplay.style.marginBottom = '15px';
}

// ✅ Display success
function showSuccess(message) {
    successDisplay.textContent = message;
    successDisplay.style.display = 'block';
    successDisplay.style.color = '#155724';
    successDisplay.style.padding = '10px';
    successDisplay.style.borderRadius = '5px';
    successDisplay.style.backgroundColor = '#d4edda';
    successDisplay.style.border = '1px solid #c3e6cb';
    successDisplay.style.marginBottom = '15px';
    registerForm.style.display = 'none';
}

// ✅ Real-time duplicate check on blur
async function checkDuplicateOnBlur(field, value) {
    if (!value || value.length < 3) return;
    
    try {
        const response = await fetch('https://6a60f589000c366da0d3.sfo.appwrite.run/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                [field]: value 
            })
        });
        const data = await response.json();
        
        if (data.exists) {
            field.classList.add('input-error');
            const errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            errorEl.style.color = '#dc3545';
            errorEl.style.fontSize = '0.875rem';
            errorEl.style.marginTop = '5px';
            errorEl.textContent = `This ${field === 'email' ? 'email' : 'phone number'} is already registered. Please login.`;
            field.parentNode.appendChild(errorEl);
            
            // Show login link
            document.getElementById('login-redirect').style.display = 'block';
        } else {
            field.classList.remove('input-error');
            document.querySelectorAll('.error-message').forEach(el => el.remove());
            document.getElementById('login-redirect').style.display = 'none';
        }
    } catch (error) {
        console.error('Duplicate check failed:', error);
    }
}

// ✅ Event Listeners for real-time validation
emailInput.addEventListener('blur', function() {
    if (currentMethod === 'email' && this.value.trim()) {
        checkDuplicateOnBlur(this, this.value.trim());
    }
});

phoneInput.addEventListener('blur', function() {
    if (currentMethod === 'phone' && this.value.trim()) {
        const normalized = normalizePhone(this.value.trim());
        checkDuplicateOnBlur(this, normalized);
    }
});

// ✅ Form submission
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();
    
    let email = emailInput.value.trim();
    let phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // ✅ Conditional validation based on selected method
    if (currentMethod === 'email') {
        if (!email) {
            showError('Email address is required');
            emailInput.focus();
            return;
        }
        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            emailInput.focus();
            return;
        }
        phone = ''; // Clear phone when using email
    } else {
        if (!phone) {
            showError('Phone number is required');
            phoneInput.focus();
            return;
        }
        if (!isValidPhone(phone)) {
            showError('Please enter a valid Nigerian phone number (e.g., 08012345678)');
            phoneInput.focus();
            return;
        }
        email = ''; // Clear email when using phone
        phone = normalizePhone(phone);
    }
    
    // ✅ Password validation
    if (!password || password.length < 8) {
        showError('Password must be at least 8 characters');
        passwordInput.focus();
        return;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        showError('Password must contain uppercase, lowercase, and a number');
        passwordInput.focus();
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        confirmPasswordInput.focus();
        return;
    }
    
    // ✅ Double-check duplicate before sending
    showError('Checking if account already exists...');
    
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
            showError('This account already exists. Please login.');
            document.getElementById('login-redirect').style.display = 'block';
            return;
        }
    } catch (error) {
        console.error('Pre-submission check failed:', error);
        // Continue anyway - backend will handle it
    }
    
    // ✅ Create account via Appwrite function
    try {
        const response = await fetch('https://6a60f589000c366da0d3.sfo.appwrite.run/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email || undefined,
                phone: phone || undefined,
                password: password,
                method: currentMethod
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Account created successfully! Redirecting to login...');
            document.getElementById('login-redirect').style.display = 'block';
            
            // Auto-redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showError(data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Network error. Please check your connection and try again.');
    }
});

// ✅ Real-time password strength indicator
passwordInput.addEventListener('input', function() {
    const password = this.value;
    const strengthEl = document.getElementById('password-strength');
    
    if (password.length === 0) {
        strengthEl.textContent = '';
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
        strengthEl.textContent = 'Weak';
        strengthEl.style.color = '#dc3545';
    } else if (strength <= 3) {
        strengthEl.textContent = 'Medium';
        strengthEl.style.color = '#ffc107';
    } else {
        strengthEl.textContent = 'Strong';
        strengthEl.style.color = '#28a745';
    }
});

// ✅ Show/hide password toggle
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

// ✅ Initialize
switchMethod('email');

// ✅ Export for testing
export { switchMethod, isValidEmail, isValidPhone, normalizePhone };
