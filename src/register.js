// ============================================================
// REMADEF REGISTRATION - MOBILE DIAGNOSTIC VERSION
// ============================================================

const API_URL = 'https://6a60f589000c366da0d3.sfo.appwrite.run';

let currentMethod = 'email';
let timer = null;

// DOM
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

const reqLength = document.getElementById('req-length');
const reqLower = document.getElementById('req-lower');
const reqUpper = document.getElementById('req-upper');
const reqNumber = document.getElementById('req-number');

// ============================================================
// UI
// ============================================================

function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';

    if (successBox) {
        successBox.style.display = 'none';
    }
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
// VALIDATION
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
        return '+234' + clean.substring(1);
    }

    if (clean.startsWith('234')) {
        return '+' + clean;
    }

    if (clean.length === 10) {
        return '+234' + clean;
    }

    return clean;
}

// ============================================================
// PASSWORD STRENGTH
// ============================================================

passwordInput.addEventListener('input', function () {

    const password = this.value;

    const checks = {
        length: password.length >= 8,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /\d/.test(password)
    };

    let score = 0;

    function update(element, valid) {

        if (!element) return;

        if (valid) {
            element.className = 'met';
            element.textContent =
                element.textContent.replace('🔴', '✅');
        } else {
            element.className = '';
            element.textContent =
                element.textContent.replace('✅', '🔴');
        }
    }

    update(reqLength, checks.length);
    update(reqLower, checks.lower);
    update(reqUpper, checks.upper);
    update(reqNumber, checks.number);

    if (checks.length) score++;
    if (checks.lower) score++;
    if (checks.upper) score++;
    if (checks.number) score++;

    strengthBar.style.width = (score / 4 * 100) + '%';

    if (password.length === 0) {
        strengthBar.style.background = '#e8ecf1';
        strengthText.textContent = '';
    } else if (score <= 1) {
        strengthBar.style.background = '#dc3545';
        strengthText.textContent = '🔴 Weak';
    } else if (score === 2) {
        strengthBar.style.background = '#ffc107';
        strengthText.textContent = '🟡 Medium';
    } else if (score === 3) {
        strengthBar.style.background = '#17a2b8';
        strengthText.textContent = '🔵 Good';
    } else {
        strengthBar.style.background = '#28a745';
        strengthText.textContent = '🟢 Strong';
    }
});

// ============================================================
// METHOD SWITCH
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
// LOGIN
// ============================================================

window.goToLogin = function() {
    window.location.href = 'login.html';
};

// ============================================================
// REGISTRATION
// ============================================================

form.addEventListener('submit', async function(event) {

    event.preventDefault();

    hideError();

    let email = emailInput.value.trim();
    let phone = phoneInput.value.trim();

    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    // CONTACT VALIDATION
    if (currentMethod === 'email') {

        if (!email) {
            showError('📧 Email is required');
            return;
        }

        if (!isValidEmail(email)) {
            showError('📧 Invalid email address');
            return;
        }

        phone = '';

    } else {

        if (!phone) {
            showError('📱 Phone number is required');
            return;
        }

        if (!isValidPhone(phone)) {
            showError('📱 Invalid phone number');
            return;
        }

        phone = normalizePhone(phone);
        email = '';
    }

    // PASSWORD VALIDATION
    if (!password) {
        showError('🔑 Password is required');
        return;
    }

    if (password.length < 8) {
        showError('🔑 Password must be 8+ characters');
        return;
    }

    if (!/[a-z]/.test(password)) {
        showError('🔑 Need a lowercase letter');
        return;
    }

    if (!/[A-Z]/.test(password)) {
        showError('🔑 Need an uppercase letter');
        return;
    }

    if (!/\d/.test(password)) {
        showError('🔑 Need a number');
        return;
    }

    if (password !== confirmPassword) {
        showError('🔑 Passwords do not match');
        return;
    }

    setLoading(true);

    const payload = {
        method: currentMethod,
        password: password
    };

    if (email) payload.email = email;
    if (phone) payload.phone = phone;

    try {

        const response = await fetch(API_URL, {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },

            body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        } catch (error) {

            showError(
                '⚠️ Server response error. HTTP Status: ' +
                response.status
            );

            setLoading(false);
            return;
        }

        if (!response.ok) {

            showError(
                '❌ ' +
                (data.error ||
                 data.message ||
                 'Registration failed') +
                ' (' + response.status + ')'
            );

            setLoading(false);
            return;
        }

        if (data.success) {

            form.style.display = 'none';
            successBox.style.display = 'block';

            traineeIdDisplay.textContent =
                data.data?.trainee_id ||
                data.trainee_id ||
                'REM-0000';

            let seconds = 3;

            countdownDisplay.textContent = seconds;

            if (timer) clearInterval(timer);

            timer = setInterval(function() {

                seconds--;

                countdownDisplay.textContent = seconds;

                if (seconds <= 0) {

                    clearInterval(timer);
                    window.location.href = 'login.html';
                }

            }, 1000);

        } else {

            showError(
                '❌ ' +
                (data.error ||
                 data.message ||
                 'Registration failed')
            );

            setLoading(false);
        }

    } catch (error) {

        console.error(error);

        showError(
            '🌐 ' + error.message +
            ' | API connection failed'
        );

        setLoading(false);
    }

});

console.log('REMADEF registration loaded');
console.log('API:', API_URL);
