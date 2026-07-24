const PROJECT_ID =
    "6a5bc178003a2529271e";

const FUNCTION_ID =
    "6a60f5850019a9371c1e";

const APPWRITE_ENDPOINT =
    "https://sfo.cloud.appwrite.io/v1";

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


function togglePassword(id) {

    const input = $(id);

    const button =
        input.parentElement.querySelector("button");

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

        length:
            password.length >= 8,

        lowercase:
            /[a-z]/.test(password),

        uppercase:
            /[A-Z]/.test(password),

        number:
            /\d/.test(password)

    };


    const passed =
        Object.values(checks)
            .filter(Boolean)
            .length;


    if (passed === 4) {

        $("strength-text").textContent =
            "🟢 Strong";

    } else if (passed >= 2) {

        $("strength-text").textContent =
            "🟡 Medium";

    } else {

        $("strength-text").textContent =
            "🔴 Weak";

    }


    $("length").textContent =
        (checks.length ? "✅" : "🔴")
        + " 8+ chars";


    $("lower").textContent =
        (checks.lowercase ? "✅" : "🔴")
        + " Lowercase";


    $("upper").textContent =
        (checks.uppercase ? "✅" : "🔴")
        + " Uppercase";


    $("number").textContent =
        (checks.number ? "✅" : "🔴")
        + " Number";

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

        method:
            method,

        password:
            password

    };


    if (method === "email") {

        payload.email =
            email;

    } else {

        let cleanPhone =
            phone.replace(/\D/g, "");


        if (
            cleanPhone.startsWith("0")
        ) {

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

        const response =

            await fetch(

                APPWRITE_ENDPOINT
                + "/functions/"
                + FUNCTION_ID
                + "/executions",

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:

                        JSON.stringify({

                            body:
                                JSON.stringify(payload),

                            async:
                                false

                        })

                }

            );


        const text =
            await response.text();


        console.log(
            "Appwrite response:",
            response.status,
            text
        );


        if (!response.ok) {

            throw new Error(

                "Appwrite returned "
                + response.status
                + ": "
                + text

            );

        }


        let execution;


        try {

            execution =
                JSON.parse(text);

        } catch {

            throw new Error(
                "Invalid Appwrite response"
            );

        }


        form.style.display =
            "none";


        $("success").style.display =
            "block";


        $("trainee-id").textContent =
            "Account processing...";


        let seconds = 3;


        $("countdown").textContent =
            seconds;


        const timer =

            setInterval(

                function () {

                    seconds--;


                    $("countdown")
                        .textContent =
                        seconds;


                    if (
                        seconds <= 0
                    ) {

                        clearInterval(
                            timer
                        );


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

            "❌ CONNECTION ERROR: "
            + err.message

        );


        submit.disabled =
            false;


        submit.textContent =
            "🚀 Create Account";

    }

};
