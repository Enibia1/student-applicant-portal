// src/register.js
// REMADEF ACCOUNT REGISTRATION

const API_URL =
    'https://6a60f589000c366da0d3.sfo.appwrite.run';

let currentMethod = 'email';
let timer = null;

// ============================================================
// DOM ELEMENTS
// ============================================================

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

    if (clean.startsWith('0')) {
        return '+234' + clean.slice(1);
    }

    if (clean.startsWith('234')) {
        return '+' + clean;
    }

    if (clean.length === 10) {
        return '+234' + clean;
    }

    return clean;
}

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

    function updateRequirement(element, passed) {

        if (passed) {
            element.className = 'met';
            element.textContent =
                element.textContent.replace('🔴', '✅');
        } else {
            element.className = '';
            element.textContent =
                element.textContent.replace('✅', '🔴');
        }
    }

    updateRequirement(reqLength, checks.length);
    updateRequirement(reqLower, checks.lower);
    updateRequirement(reqUpper, checks.upper);
    updateRequirement(reqNumber, checks.number);

    let score = 0;

    if (checks.length) score++;
    if (checks.lower) score++;
    if (checks.upper) score++;
    if (checks.number) score++;

    strengthBar.style.width = ((score / 4) * 100) + '%';

    if (password.length === 0) {
        strengthBar.style.background = '#e8ecf1';
        strengthText.textContent = '';
        return;
    }

    if (score <= 1) {
        strengthBar.style.background = '#dc3545';
        strengthText.textContent = '🔴 Weak';
        strengthText.style.color = '#dc3545';
    }

    else if (score === 2) {
        strengthBar.style.background = '#ffc107';
        strengthText.textContent = '🟡 Medium';
        strengthText.style.color = '#ffc107';
    }

    else if (score === 3) {
        strengthBar.style.background = '#17a2b8';
        strengthText.textContent = '🔵 Good';
        strengthText.style.color = '#17a2b8';
    }

    else {
        strengthBar.style.background = '#28a745';
        strengthText.textContent = '🟢 Strong';
        strengthText.style.color = '#28a745';
    }
});

// ============================================================
// SWITCH EMAIL / PHONE
// ============================================================

window.switchMethod = function (method) {

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
// PASSWORD VISIBILITY
// ============================================================

window.togglePassword = function (fieldId) {

    const input = document.getElementById(fieldId);

    const button =
        input.parentElement.querySelector('.password-toggle');

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

window.goToLogin = function () {
    window.location.href = 'login.html';
};

// ============================================================
// REGISTRATION
// ============================================================

form.addEventListener('submit', async function (event) {

    event.preventDefault();

    hideError();

    let email = emailInput.value.trim();
    let phone = phoneInput.value.trim();

    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

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

    if (!password) {
        showError('🔑 Password is required');
        return;
    }

    if (password.length < 8) {
        showError('🔑 Password must be at least 8 characters');
        return;
    }

    if (!/[a-z]/.test(password)) {
        showError('🔑 Password needs a lowercase letter');
        return;
    }

    if (!/[A-Z]/.test(password)) {
        showError('🔑 Password needs an uppercase letter');
        return;
    }

    if (!/\d/.test(password)) {
        showError('🔑 Password needs a number');
        return;
    }

    if (password !== confirmPassword) {
        showError('🔑 Passwords do not match');
        return;
    }

    // --------------------------------------------------------
    // START LOADING
    // --------------------------------------------------------

    setLoading(true);

    try {

        const payload = {
            method: currentMethod,
            password: password
        };

        if (email) {
            payload.email = email;
        }

        if (phone) {
            payload.phone = phone;
        }

        console.log('Sending registration request');

        /*
         * IMPORTANT:
         *
         * text/plain avoids the browser CORS preflight request.
         * The Python backend still reads the body as JSON.
         */

        const response = await fetch(API_URL, {

            method: 'POST',

            headers: {
                'Content-Type': 'text/plain'
            },

            body: JSON.stringify(payload)

        });

        console.log('Response status:', response.status);

        const responseText = await response.text();

        console.log('Response:', responseText);

        let data;

        try {
            data = JSON.parse(responseText);
        } catch (parseError) {

            throw new Error(
                'Server returned an invalid response'
            );
        }

        if (response.ok && data.success) {

            form.style.display = 'none';

            successBox.style.display = 'block';

            traineeIdDisplay.textContent =
                data.data?.trainee_id || 'REM-0000';

            let seconds = 3;

            countdownDisplay.textContent = seconds;

            if (timer) {
                clearInterval(timer);
            }

            timer = setInterval(function () {

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
                (
                    data.error ||
                    data.message ||
                    'Registration failed'
                )
            );

            setLoading(false);
        }

    } catch (error) {

        console.error('Registration error:', error);

        showError(
            '🌐 Failed to connect to registration server. Please try again.'
        );

        setLoading(false);
    }

});

// ============================================================
// INITIALIZATION
// ============================================================

console.log('REMADEF Registration loaded');

console.log(
    'API:',
    API_URL
);
