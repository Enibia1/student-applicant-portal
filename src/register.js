const API_URL =
    "https://6a60f589000c366da0d3.sfo.appwrite.run";

let method = "email";

const $ = id =>
    document.getElementById(id);

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

function togglePassword(id, button) {

    const input = $(id);

    if (input.type === "password") {

        input.type = "text";
        button.textContent = "🙈";

    } else {

        input.type = "password";
        button.textContent = "👁️";

    }

}

emailTab.onclick = function () {

    method = "email";

    emailTab.classList.add("active");
    phoneTab.classList.remove("active");

    emailBox.style.display = "block";
    phoneBox.style.display = "none";

    $("email").required = true;
    $("phone").required = false;

    hideError();

};

phoneTab.onclick = function () {

    method = "phone";

    phoneTab.classList.add("active");
    emailTab.classList.remove("active");

    emailBox.style.display = "none";
    phoneBox.style.display = "block";

    $("email").required = false;
    $("phone").required = true;

    hideError();

};

$("password").oninput = function () {

    const password = this.value;

    const checks = {

        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password)

    };

    const passed =
        Object.values(checks)
            .filter(Boolean)
            .length;

    if (passed === 4) {

        $("strength").textContent = "🟢 Strong";

    } else if (passed >= 2) {

        $("strength").textContent = "🟡 Medium";

    } else {

        $("strength").textContent = "🔴 Weak";

    }

    $("length-check").textContent =
        (checks.length ? "✅" : "🔴") + " 8+ chars";

    $("lower-check").textContent =
        (checks.lowercase ? "✅" : "🔴") + " Lowercase";

    $("upper-check").textContent =
        (checks.uppercase ? "✅" : "🔴") + " Uppercase";

    $("number-check").textContent =
        (checks.number ? "✅" : "🔴") + " Number";

};

form.onsubmit = async function (e) {

    e.preventDefault();

    hideError();

    const email =
        $("email").value.trim();

    const phone =
        $("phone").value.trim();

    const password =
        $("password").value;

    const confirm =
        $("confirm").value;

    if (method === "email" && !email) {

        return showError(
            "📧 Please enter your email address"
        );

    }

    if (method === "phone" && !phone) {

        return showError(
            "📱 Please enter your phone number"
        );

    }

    if (password.length < 8) {

        return showError(
            "🔑 Password must be at least 8 characters"
        );

    }

    if (!/[a-z]/.test(password)) {

        return showError(
            "🔑 Password needs a lowercase letter"
        );

    }

    if (!/[A-Z]/.test(password)) {

        return showError(
            "🔑 Password needs an uppercase letter"
        );

    }

    if (!/\d/.test(password)) {

        return showError(
            "🔑 Password needs a number"
        );

    }

    if (password !== confirm) {

        return showError(
            "🔑 Passwords do not match"
        );

    }

    submit.disabled = true;

    submit.textContent =
        "⏳ Creating Account...";

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

        payload.phone =
            cleanPhone;

    }

    showError(
        "🔄 Connecting to registration server..."
    );

    try {

        const response = await fetch(
            API_URL,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "text/plain"

                },

                body:
                    JSON.stringify(payload)

            }
        );

        showError(
            "✅ Server responded: " +
            response.status
        );

        const text =
            await response.text();

        let data;

        try {

            data =
                JSON.parse(text);

        } catch {

            throw new Error(
                "Server returned invalid response: " +
                text
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

        form.style.display =
            "none";

        $("success").style.display =
            "block";

        $("trainee-id").textContent =
            data.data?.trainee_id ||
            "REM-0000";

        let seconds = 3;

        $("countdown").textContent =
            seconds;

        const timer =
            setInterval(
                function () {

                    seconds--;

                    $("countdown").textContent =
                        seconds;

                    if (seconds <= 0) {

                        clearInterval(timer);

                        window.location.href =
                            "login.html";

                    }

                },
                1000
            );

    } catch (err) {

        console.error(
            "Registration Error:",
            err
        );

        showError(
            "❌ CONNECTION ERROR: " +
            err.message
        );

        submit.disabled =
            false;

        submit.textContent =
            "🚀 Create Account";

    }

};
