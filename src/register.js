const API_URL =
"https://6a60f589000c366da0d3.sfo.appwrite.run";

let method = "email";

const $ = id => document.getElementById(id);

const form = $("form");
const error = $("error");
const emailBox = $("email-box");
const phoneBox = $("phone-box");
const emailTab = $("email-tab");
const phoneTab = $("phone-tab");
const submit = $("submit");

function showError(message) {
error.textContent = message;
error.style.display = "block";
}

function hideError() {
error.textContent = "";
error.style.display = "none";
}

function togglePassword(id) {
const input = $(id);

input.type =
    input.type === "password"
        ? "text"
        : "password";

}

window.togglePassword = togglePassword;

// EMAIL / PHONE SWITCHING

emailTab.onclick = () => {

method = "email";

emailBox.classList.remove("hidden");
phoneBox.classList.add("hidden");

emailTab.classList.add("active");
phoneTab.classList.remove("active");

hideError();

};

phoneTab.onclick = () => {

method = "phone";

phoneBox.classList.remove("hidden");
emailBox.classList.add("hidden");

phoneTab.classList.add("active");
emailTab.classList.remove("active");

hideError();

};

// PASSWORD STRENGTH

$("password").oninput = function () {

const password = this.value;

const checks = [
    [password.length >= 8, "length"],
    [/[a-z]/.test(password), "lower"],
    [/[A-Z]/.test(password), "upper"],
    [/\d/.test(password), "number"]
];

let score = 0;

checks.forEach(([valid, id]) => {

    const element = $(id);

    element.textContent =
        valid
            ? "✅ " + element.textContent.slice(2)
            : "🔴 " + element.textContent.slice(2);

    element.className =
        valid ? "met" : "";

    if (valid) score++;

});

$("strength-bar").style.width =
    `${score * 25}%`;

const messages = [
    "",
    "🔴 Weak",
    "🟡 Medium",
    "🔵 Good",
    "🟢 Strong"
];

$("strength-text").textContent =
    messages[score];

};

// FORM SUBMISSION

form.onsubmit = async event => {

event.preventDefault();

hideError();

const email =
    $("email").value.trim().toLowerCase();

const phone =
    $("phone").value.trim();

const password =
    $("password").value;

const confirm =
    $("confirm").value;


// EMAIL VALIDATION

if (method === "email") {

    if (!email)
        return showError(
            "📧 Email is required"
        );

    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email)
    )
        return showError(
            "📧 Invalid email address"
        );

}


// PHONE VALIDATION

else {

    if (!phone)
        return showError(
            "📱 Phone number is required"
        );

}


// PASSWORD VALIDATION

if (password.length < 8)
    return showError(
        "🔑 Password must be at least 8 characters"
    );

if (!/[a-z]/.test(password))
    return showError(
        "🔑 Password needs a lowercase letter"
    );

if (!/[A-Z]/.test(password))
    return showError(
        "🔑 Password needs an uppercase letter"
    );

if (!/\d/.test(password))
    return showError(
        "🔑 Password needs a number"
    );

if (password !== confirm)
    return showError(
        "🔑 Passwords do not match"
    );


// LOADING

submit.disabled = true;

submit.textContent =
    "⏳ Creating Account...";


// PAYLOAD

const payload = {
    method: method,
    password: password
};

if (method === "email") {

    payload.email = email;

} else {

    let cleanPhone =
        phone.replace(/\D/g, "");

    if (cleanPhone.startsWith("0")) {

        cleanPhone =
            "+234" +
            cleanPhone.slice(1);

    } else if (
        cleanPhone.startsWith("234")
    ) {

        cleanPhone =
            "+" +
            cleanPhone;

    } else {

        cleanPhone =
            "+234" +
            cleanPhone;

    }

    payload.phone = cleanPhone;
}


try {

    const response =
        await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type":
                    "text/plain"
            },

            body:
                JSON.stringify(payload)

        });


    const text =
        await response.text();

    let data;

    try {

        data =
            JSON.parse(text);

    } catch {

        throw new Error(
            "Server returned an invalid response"
        );

    }


    if (
        !response.ok ||
        !data.success
    ) {

        throw new Error(
            data.error ||
            data.message ||
            "Registration failed"
        );

    }


    // SUCCESS

    form.style.display =
        "none";

    $("success").style.display =
        "block";

    $("trainee-id").textContent =
        data.data?.trainee_id ||
        "REM-0000";


    let seconds = 3;

    const timer =
        setInterval(() => {

            seconds--;

            $("countdown")
                .textContent =
                seconds;

            if (seconds <= 0) {

                clearInterval(timer);

                location.href =
                    "login.html";

            }

        }, 1000);


} catch (err) {

    console.error(
        "Registration Error:",
        err
    );


    if (
        err instanceof TypeError
    ) {

        showError(
            "🌐 Failed to fetch. API connection failed."
        );

    } else {

        showError(
            "❌ " +
            err.message
        );

    }


    submit.disabled =
        false;

    submit.textContent =
        "🚀 Create Account";

}

};
