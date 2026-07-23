// src/register.js - REMADEF Registration
// 🔥 YOUR APPUTE FUNCTION URL
const API_URL = 'https://6a60f589000c366da0d3.sfo.appwrite.run';

let currentMethod = 'email';
let timer = null;

// DOM Elements
const form = document.getElementById('register-form');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirm-password');
const errorDisplay = document.getElementById('error-message');
const successBox = document.getElementById('success-box');
const traineeIdDisplay = document.getElementById('trainee-id-display');
const countdownDisplay = document.getElementById('countdown');
const emailTab = document.getElementById('email-tab');
const phoneTab = document.getElementById('phone-tab');
const emailField = document.getElementById('email-field');
const phoneField = document.getElementById('phone-field');
const strengthBar = document.getElementById('strength-bar');
const strengthText = document.getElementById('strength-text');
const btnText = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');
const submitBtn = document.querySelector('.submit-btn');

// Requirements elements
const reqLength = document.getElementById('req-length');
const reqLower = document.getElementById('req-lower');
const reqUpper = document.getElementById('req-upper');
const reqNumber = document.getElementById('req-number');

// ============================================================
// HELPERS
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
    if (clean.startsWith('0')) return '+234' + clean.slice(1);
    if (clean.startsWith('234') && !clean.startsWith('+')) return '+' + clean;
    if (!clean.startsWith('+') && clean.length === 10) return '+234' + clean;
    return clean;
}

function showError(msg) {
    errorDisplay.textContent = msg;
    errorDisplay.style.display = 'block';
    successBox.style.display = 'none';
}

function hideError() {
    errorDisplay.textContent = '';
    errorDisplay.style.display = 'none';
}

function setLoading(loading) {
    if (loading) {
        btnText.style.display = 'none';
        btnSpinner.style.display = 'block';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// ============================================================
// PASSWORD STRENGTH
// ============================================================

passwordInput.addEventListener('input', function() {
    const pwd = this.value;
    let score = 0;
    let checks = {
        length: pwd.length >= 8,
        lower: /[a-z]/.test(pwd),
        upper: /[A-Z]/.test(pwd),
        number: /\d/.test(pwd)
    };
    
    function updateReq(el, met) {
        if (met) {
            el.className = 'met';
            el.textContent = el.textContent.replace('🔴', '✅');
        } else {
            el.className = '';
            el.textContent = el.textContent.replace('✅', '🔴');
        }
    }
    
    updateReq(reqLength, checks.length);
    updateReq(reqLower, checks.lower);
    updateReq(reqUpper, checks.upper);
    updateReq(reqNumber, checks.number);
    
    if (checks.length) score++;
    if (checks.lower) score++;
    if (checks.upper) score++;
    if (checks.number) score++;
    
    const percent = (score / 4) * 100;
    strengthBar.style.width = percent + '%';
    
    if (pwd.length === 0) {
        strengthBar.style.background = '#e8ecf1';
        strengthText.textContent = '';
        return;
    }
    
    if (score <= 1) {
        strengthBar.style.background = '#dc3545';
        strengthText.textContent = '🔴 Weak';
        strengthText.style.color = '#dc3545';
    } else if (score <= 2) {
        strengthBar.style.background = '#ffc107';
        strengthText.textContent = '🟡 Medium';
        strengthText.style.color = '#ffc107';
    } else if (score <= 3) {
        strengthBar.style.background = '#17a2b8';
        strengthText.textContent = '🔵 Good';
        strengthText.style.color = '#17a2b8';
    } else {
        strengthBar.style.background = '#28a745';
        strengthText.textContent = '🟢 Strong';
        strengthText.style.color = '#28a745';
    }
});

// ============================================================
// METHOD SWITCHING
// ============================================================

window.switchMethod = function(method) {
    currentMethod = method;
    hideError();
    
    if (method === 'email') {
        emailField.classList.remove('hidden');
        phoneField.classList.add('hidden');
        emailTab.classList.add('active');
        phoneTab.classList.remove('active');
    } else {
        emailField.classList.add('hidden');
        phoneField.classList.remove('hidden');
        phoneTab.classList.add('active');
        emailTab.classList.remove('active');
    }
};

// ============================================================
// PASSWORD TOGGLE
// ============================================================

window.togglePassword = function(fieldId) {
    const input = document.getElementById(fieldId);
    const btn = input.parentElement.querySelector('.password-toggle');
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
};

// ============================================================
// LOGIN REDIRECT
// ============================================================

window.goToLogin = function() {
    window.location.href = 'login.html';
};

// ============================================================
// FORM SUBMIT
// ============================================================

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError();
    
    let email = emailInput.value.trim();
    let phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    
    // Validate
    if (currentMethod === 'email') {
        if (!email) return showError('📧 Email is required');
        if (!isValidEmail(email)) return showError('📧 Invalid email address');
        phone = '';
    } else {
        if (!phone) return showError('📱 Phone number is required');
        if (!isValidPhone(phone)) return showError('📱 Invalid phone number');
        email = '';
        phone = normalizePhone(phone);
    }
    
    if (!password) return showError('🔑 Password is required');
    if (password.length < 8) return showError('🔑 Password must be 8+ characters');
    if (!/[a-z]/.test(password)) return showError('🔑 Need a lowercase letter');
    if (!/[A-Z]/.test(password)) return showError('🔑 Need an uppercase letter');
    if (!/\d/.test(password)) return showError('🔑 Need a number');
    if (password !== confirmPassword) return showError('🔑 Passwords do not match');
    
    setLoading(true);
    
    try {
        const payload = { method: currentMethod, password };
        if (email) payload.email = email;
        if (phone) payload.phone = phone;
        
        console.log('📤 Sending to:', API_URL);
        console.log('📦 Payload:', payload);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if (data.success) {
            form.style.display = 'none';
            successBox.style.display = 'block';
            traineeIdDisplay.textContent = data.data?.trainee_id || 'REM-0000';
            
            let seconds = 3;
            countdownDisplay.textContent = seconds;
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
                seconds--;
                countdownDisplay.textContent = seconds;
                if (seconds <= 0) {
                    clearInterval(timer);
                    window.location.href = 'login.html';
                }
            }, 1000);
        } else {
            showError(`❌ ${data.error || 'Registration failed'}`);
            setLoading(false);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showError(`🌐 ${error.message || 'Network error - check console'}`);
        setLoading(false);
    }
});

// ============================================================
// INIT
// ============================================================

console.log('✅ REMADEF Registration loaded');
console.log('📍 API URL:', API_URL);
