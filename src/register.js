// ============================================================
// REMADEF REGISTRATION
// src/register.js
// ============================================================

const API_URL = 'https://6a60f589000c366da0d3.sfo.appwrite.run';

let currentMethod = 'email';
let timer;


// DOM
const $ = id => document.getElementById(id);

const form = $('register-form');
const email = $('email');
const phone = $('phone');
const password = $('password');
const confirmPassword = $('confirm-password');
const errorBox = $('error-message');
const successBox = $('success-box');
const submitBtn = document.querySelector('.submit-btn');
const btnText = $('btn-text');
const spinner = $('btn-spinner');


// ============================================================
// UI HELPERS
// ============================================================

function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    successBox.style.display = 'none';
}

function hideError() {
    errorBox.textContent = '';
    errorBox.style.display = 'none';
}

function loading(state) {
    submitBtn.disabled = state;
    btnText.style.display = state ? 'none' : 'inline';
    spinner.style.display = state ? 'block' : 'none';
}


// ============================================================
// EMAIL / PHONE SWITCH
// ============================================================

window.switchMethod = method => {

    currentMethod = method;
    hideError();

    $('email-field').classList.toggle(
        'hidden',
        method !== 'email'
    );

    $('phone-field').classList.toggle(
        'hidden',
        method !== 'phone'
    );

    $('email-tab').classList.toggle(
        'active',
        method === 'email'
    );

    $('phone-tab').classList.toggle(
        'active',
        method === 'phone'
    );
};


// ============================================================
// PASSWORD VISIBILITY
// ============================================================

window.togglePassword = fieldId => {

    const input = $(fieldId);
    const button = input.parentElement.querySelector(
        '.password-toggle'
    );

    input.type =
        input.type === 'password'
            ? 'text'
            : 'password';

    button.textContent =
        input.type === 'password'
            ? '👁️'
            : '🙈';
};


// ============================================================
// LOGIN
// ============================================================

window.goToLogin = () => {
    window.location.href = 'login.html';
};


// ============================================================
// PASSWORD STRENGTH
// ============================================================

password.addEventListener('input', () => {

    const value = password.value;

    const checks = [
        [value.length >= 8, 'req-length'],
        [/[a-z]/.test(value), 'req-lower'],
        [/[A-Z]/.test(value), 'req-upper'],
        [/\d/.test(value), 'req-number']
    ];

    let score = 0;

    checks.forEach(([passed, id]) => {

        const el = $(id);

        el.className = passed ? 'met' : '';

        el.textContent =
            el.textContent
                .replace(passed ? '🔴' : '✅',
                        passed ? '✅' : '🔴');

        if (passed) score++;
    });

    $('strength-bar').style.width =
        `${score * 25}%`;

    const strength = [
        ['', ''],
        ['🔴 Weak', '#dc3545'],
        ['🟡 Medium', '#ffc107'],
        ['🔵 Good', '#17a2b8'],
        ['🟢 Strong', '#28a745']
    ][score];

    $('strength-text').textContent =
        value ? strength[0] : '';

    $('strength-text').style.color =
        value ? strength[1] : '';
});


// ============================================================
// REGISTRATION
// ============================================================

form.addEventListener('submit', async event => {

    event.preventDefault();
    hideError();

    let emailValue = email.value.trim();
    let phoneValue = phone.value.trim();
    const passwordValue = password.value;

    // Validate email
    if (currentMethod === 'email') {

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            showError('📧 Enter a valid email address');
            return;
        }

        emailValue = emailValue.toLowerCase();
    }

    // Validate phone
    if (currentMethod === 'phone') {

        const clean = phoneValue.replace(/\D/g, '');

        if (clean.length < 10 || clean.length > 11) {
            showError('📱 Enter a valid phone number');
            return;
        }

        phoneValue =
            clean.startsWith('0')
                ? '+234' + clean.slice(1)
                : clean.startsWith('234')
                    ? '+' + clean
                    : '+234' + clean;
    }

    // Validate password
    if (passwordValue.length < 8 ||
        !/[a-z]/.test(passwordValue) ||
        !/[A-Z]/.test(passwordValue) ||
        !/\d/.test(passwordValue)) {

        showError(
            '🔑 Password must contain 8+ characters, uppercase, lowercase and number'
        );

        return;
    }

    if (passwordValue !== confirmPassword.value) {
        showError('🔑 Passwords do not match');
        return;
    }

    const payload = {
        method: currentMethod,
        password: passwordValue
    };

    if (currentMethod === 'email') {
        payload.email = emailValue;
    } else {
        payload.phone = phoneValue;
    }

    loading(true);

    try {

        const response = await fetch(API_URL, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {

            showError(
                '❌ ' +
                (data.error || 'Registration failed')
            );

            loading(false);
            return;
        }

        form.style.display = 'none';
        successBox.style.display = 'block';

        $('trainee-id-display').textContent =
            data.data?.trainee_id || 'REM-0000';

        let seconds = 3;

        $('countdown').textContent = seconds;

        timer = setInterval(() => {

            $('countdown').textContent = --seconds;

            if (seconds <= 0) {

                clearInterval(timer);

                window.location.href =
                    'login.html';
            }

        }, 1000);

    } catch (error) {

        console.error(error);

        showError(
            '🌐 Failed to fetch. Please try again.'
        );

        loading(false);
    }
});


// ============================================================
// STARTUP
// ============================================================

console.log('✅ REMADEF registration loaded');
