const client = new Appwrite.Client();

client
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('6a5bc178003a2529271e');

const account = new Appwrite.Account(client);


// ================================
// REGISTRATION METHOD SELECTOR
// ================================

const emailMethod =
    document.getElementById('emailMethod');

const phoneMethod =
    document.getElementById('phoneMethod');

const emailSection =
    document.getElementById('emailSection');

const phoneSection =
    document.getElementById('phoneSection');

let registrationMethod = 'email';


// EMAIL METHOD

emailMethod.addEventListener('click', function () {

    registrationMethod = 'email';

    emailMethod.classList.add('active');

    phoneMethod.classList.remove('active');

    emailSection.classList.remove('hidden');

    phoneSection.classList.add('hidden');

});


// PHONE METHOD

phoneMethod.addEventListener('click', function () {

    registrationMethod = 'phone';

    phoneMethod.classList.add('active');

    emailMethod.classList.remove('active');

    phoneSection.classList.remove('hidden');

    emailSection.classList.add('hidden');

});


// ================================
// PHONE NORMALIZATION
// ================================

function normalizePhoneNumber(
    countryCode,
    phoneNumber
) {

    let number = phoneNumber
        .replace(/\s+/g, '')
        .replace(/-/g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '');

    /*
     * If the user enters:
     *
     * 08031234567
     *
     * remove the first 0.
     */

    if (number.startsWith('0')) {

        number = number.substring(1);

    }

    /*
     * If the user enters:
     *
     * +2348031234567
     *
     * remove the country code
     * because the country code
     * is already selected.
     */

    if (
        number.startsWith(
            countryCode.replace('+', '')
        )
    ) {

        number = number.substring(
            countryCode.replace('+', '').length
        );

    }

    return countryCode + number;

}


// ================================
// REGISTRATION FORM
// ================================

document
    .getElementById('registerForm')
    .addEventListener(
        'submit',
        async function (event) {

            event.preventDefault();

            const message =
                document.getElementById('message');

            const registerButton =
                document.getElementById(
                    'registerButton'
                );

            const password =
                document.getElementById(
                    'password'
                ).value;

            const confirmPassword =
                document.getElementById(
                    'confirmPassword'
                ).value;


            // PASSWORD VALIDATION

            if (
                password !==
                confirmPassword
            ) {

                message.style.color =
                    '#ef4444';

                message.innerText =
                    'Passwords do not match.';

                return;

            }


            if (
                password.length < 8
            ) {

                message.style.color =
                    '#ef4444';

                message.innerText =
                    'Password must be at least 8 characters.';

                return;

            }


            let identifier;


            // ================================
            // EMAIL REGISTRATION
            // ================================

            if (
                registrationMethod === 'email'
            ) {

                identifier =
                    document.getElementById(
                        'email'
                    ).value.trim();


                if (!identifier) {

                    message.style.color =
                        '#ef4444';

                    message.innerText =
                        'Please enter your email address.';

                    return;

                }

            }


            // ================================
            // PHONE REGISTRATION
            // ================================

            if (
                registrationMethod === 'phone'
            ) {

                const countryCode =
                    document.getElementById(
                        'countryCode'
                    ).value;

                const phoneNumber =
                    document.getElementById(
                        'phoneNumber'
                    ).value.trim();


                if (!phoneNumber) {

                    message.style.color =
                        '#ef4444';

                    message.innerText =
                        'Please enter your phone number.';

                    return;

                }


                identifier =
                    normalizePhoneNumber(
                        countryCode,
                        phoneNumber
                    );

            }


            message.style.color =
                '#006494';

            message.innerText =
                'Creating your REMADEF account...';


            registerButton.disabled =
                true;


            try {

                let user;


                /*
                 * EMAIL ACCOUNT
                 */

                if (
                    registrationMethod ===
                    'email'
                ) {

                    user =
                        await account.create(
                            Appwrite.ID.unique(),
                            identifier,
                            password
                        );

                }


                /*
                 * PHONE ACCOUNT
                 */

                if (
                    registrationMethod ===
                    'phone'
                ) {

                    user =
                        await account.createPhone(
                            Appwrite.ID.unique(),
                            identifier,
                            password
                        );

                }


                console.log(
                    'REMADEF account created:',
                    user
                );


                message.style.color =
                    '#10b981';

                message.innerText =
                    'Account created successfully.';


                document
                    .getElementById(
                        'registerForm'
                    )
                    .reset();


            } catch (error) {

                console.error(
                    'Registration error:',
                    error
                );


                message.style.color =
                    '#ef4444';

                message.innerText =
                    error.message ||
                    'Account creation failed.';

            }


            registerButton.disabled =
                false;

        }
    );
