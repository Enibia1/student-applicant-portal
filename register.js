// ==========================================
// REMADEF ACCOUNT REGISTRATION V1
// ==========================================

// Appwrite Client
const client = new Appwrite.Client();

client
    .setEndpoint("https://sfo.cloud.appwrite.io/v1")
    .setProject("6a5bc178003a2529271e");

const account = new Appwrite.Account(client);


// ==========================================
// ELEMENTS
// ==========================================

const registerForm =
    document.getElementById("registerForm");

const emailMethod =
    document.getElementById("emailMethod");

const phoneMethod =
    document.getElementById("phoneMethod");

const emailSection =
    document.getElementById("emailSection");

const phoneSection =
    document.getElementById("phoneSection");

const emailInput =
    document.getElementById("email");

const countryCodeInput =
    document.getElementById("countryCode");

const phoneNumberInput =
    document.getElementById("phoneNumber");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const registerButton =
    document.getElementById("registerButton");

const message =
    document.getElementById("message");


// ==========================================
// DEFAULT REGISTRATION METHOD
// ==========================================

let registrationMethod = "email";


// ==========================================
// MESSAGE HELPER
// ==========================================

function showMessage(
    text,
    type = "error"
) {

    message.innerText = text;

    if (type === "success") {

        message.style.color = "#10b981";

    } else if (type === "info") {

        message.style.color = "#006494";

    } else {

        message.style.color = "#ef4444";

    }

}


// ==========================================
// EMAIL REGISTRATION METHOD
// ==========================================

emailMethod.addEventListener(
    "click",
    function () {

        registrationMethod = "email";

        emailMethod.classList.add("active");

        phoneMethod.classList.remove("active");

        emailSection.classList.remove("hidden");

        phoneSection.classList.add("hidden");

        clearMessage();

    }
);


// ==========================================
// PHONE REGISTRATION METHOD
// ==========================================

phoneMethod.addEventListener(
    "click",
    function () {

        registrationMethod = "phone";

        phoneMethod.classList.add("active");

        emailMethod.classList.remove("active");

        phoneSection.classList.remove("hidden");

        emailSection.classList.add("hidden");

        clearMessage();

    }
);


// ==========================================
// CLEAR MESSAGE
// ==========================================

function clearMessage() {

    message.innerText = "";

}


// ==========================================
// NORMALIZE PHONE NUMBER
// ==========================================

function normalizePhoneNumber(
    countryCode,
    phoneNumber
) {

    let number =
        phoneNumber
            .trim()
            .replace(/\s+/g, "")
            .replace(/-/g, "")
            .replace(/\(/g, "")
            .replace(/\)/g, "");


    // Remove leading +
    if (number.startsWith("+")) {

        number = number.substring(1);

    }


    const cleanCountryCode =
        countryCode.replace("+", "");


    /*
     * Example:
     *
     * Country Code: +234
     * Number: 08031234567
     *
     * Result:
     * +2348031234567
     */


    // If user entered full international number
    if (
        number.startsWith(
            cleanCountryCode
        )
    ) {

        return "+" + number;

    }


    // If user entered local number beginning with 0
    if (
        number.startsWith("0")
    ) {

        number =
            number.substring(1);

    }


    return (
        "+" +
        cleanCountryCode +
        number
    );

}


// ==========================================
// BASIC PHONE VALIDATION
// ==========================================

function isValidPhoneNumber(
    phoneNumber
) {

    /*
     * International phone number
     * after normalization.
     *
     * Minimum: 7 digits
     * Maximum: 15 digits
     */

    const digitsOnly =
        phoneNumber.replace(
            /\D/g,
            ""
        );


    return (
        digitsOnly.length >= 7 &&
        digitsOnly.length <= 15
    );

}


// ==========================================
// FORM SUBMISSION
// ==========================================

registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // ----------------------------------
        // GET PASSWORDS
        // ----------------------------------

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        // ----------------------------------
        // PASSWORD VALIDATION
        // ----------------------------------

        if (
            password.length < 8
        ) {

            showMessage(
                "Password must be at least 8 characters."
            );

            return;

        }


        if (
            password !==
            confirmPassword
        ) {

            showMessage(
                "Passwords do not match."
            );

            return;

        }


        // ----------------------------------
        // IDENTIFIER
        // ----------------------------------

        let identifier;


        // ==================================
        // EMAIL REGISTRATION
        // ==================================

        if (
            registrationMethod ===
            "email"
        ) {

            identifier =
                emailInput.value.trim();


            if (
                !identifier
            ) {

                showMessage(
                    "Please enter your email address."
                );

                return;

            }


            // Browser validation
            if (
                !emailInput.checkValidity()
            ) {

                showMessage(
                    "Please enter a valid email address."
                );

                return;

            }

        }


        // ==================================
        // PHONE REGISTRATION
        // ==================================

        if (
            registrationMethod ===
            "phone"
        ) {

            const countryCode =
                countryCodeInput.value;

            const phoneNumber =
                phoneNumberInput.value.trim();


            if (
                !phoneNumber
            ) {

                showMessage(
                    "Please enter your phone number."
                );

                return;

            }


            identifier =
                normalizePhoneNumber(
                    countryCode,
                    phoneNumber
                );


            if (
                !isValidPhoneNumber(
                    identifier
                )
            ) {

                showMessage(
                    "Please enter a valid phone number."
                );

                return;

            }

        }


        // ==================================
        // START REGISTRATION
        // ==================================

        showMessage(
            "Creating your REMADEF account...",
            "info"
        );


        registerButton.disabled =
            true;

        registerButton.innerText =
            "Creating Account...";


        try {


            // ==================================
            // EMAIL ACCOUNT
            // ==================================

            if (
                registrationMethod ===
                "email"
            ) {

                await account.create(
                    Appwrite.ID.unique(),
                    identifier,
                    password
                );

            }


            // ==================================
            // PHONE ACCOUNT
            // ==================================

            else if (
                registrationMethod ===
                "phone"
            ) {

                await account.create(
                    Appwrite.ID.unique(),
                    identifier,
                    password
                );

            }


            // ==================================
            // SUCCESS
            // ==================================

            showMessage(
                "Account created successfully. You can now log in.",
                "success"
            );


            registerForm.reset();


            // Return default state
            registrationMethod =
                "email";


            emailMethod.classList.add(
                "active"
            );

            phoneMethod.classList.remove(
                "active"
            );

            emailSection.classList.remove(
                "hidden"
            );

            phoneSection.classList.add(
                "hidden"
            );


            /*
             * Optional redirect.
             *
             * Uncomment this if you want
             * automatic redirection to login.
             */

            // setTimeout(function () {
            //     window.location.href = "login.html";
            // }, 2000);


        } catch (error) {


            console.error(
                "REMADEF Registration Error:",
                error
            );


            // ==================================
            // FRIENDLY ERROR MESSAGES
            // ==================================

            let errorMessage =
                "Account creation failed.";


            if (
                error.code === 409
            ) {

                errorMessage =
                    "An account with this email or phone number already exists.";

            }


            else if (
                error.code === 400
            ) {

                errorMessage =
                    error.message ||
                    "The registration information is invalid.";

            }


            else if (
                error.message
            ) {

                errorMessage =
                    error.message;

            }


            showMessage(
                errorMessage
            );


        } finally {


            registerButton.disabled =
                false;

            registerButton.innerText =
                "Create Account";

        }

    }
);
