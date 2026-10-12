// ================================================
// AUTH.JS
// Shree Electrical Service
// ================================================

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    auth
} from "./firebase.js";


// ================================================
// LOGIN FORM
// ================================================

const loginForm =
    document.getElementById("loginForm");


const loginButton =
    document.getElementById("loginButton");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            /* CLEAR OLD MESSAGE */

            if (window.showLoginMessage) {

                window.showLoginMessage(
                    "Checking your login details...",
                    "info"
                );

            }


            /* DISABLE BUTTON */

            loginButton.disabled = true;


            loginButton.innerHTML = `

                <span
                    class="spinner-border spinner-border-sm me-2">
                </span>

                Signing in...

            `;


            try {


                /* FIREBASE LOGIN */

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                /* SUCCESS MESSAGE */

                if (window.showLoginMessage) {

                    window.showLoginMessage(
                        "Login successful! Opening your dashboard...",
                        "success"
                    );

                }


                /*
                   WAIT A LITTLE SO USER CAN SEE
                   THE SUCCESS MESSAGE
                */

                setTimeout(function () {

                    window.location.href =
                        "dashboard.html";

                }, 1000);


            }

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                let message =
                    "Unable to login. Please check your email and password.";


                /* FIREBASE ERROR MESSAGES */

                if (
                    error.code ===
                    "auth/invalid-credential"
                ) {

                    message =
                        "Incorrect email or password.";

                }

                else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    message =
                        "Please enter a valid email address.";

                }

                else if (
                    error.code ===
                    "auth/user-not-found"
                ) {

                    message =
                        "No owner account was found with this email.";

                }

                else if (
                    error.code ===
                    "auth/wrong-password"
                ) {

                    message =
                        "Incorrect password.";

                }

                else if (
                    error.code ===
                    "auth/too-many-requests"
                ) {

                    message =
                        "Too many login attempts. Please try again later.";

                }

                else if (
                    error.code ===
                    "auth/network-request-failed"
                ) {

                    message =
                        "Network error. Please check your internet connection.";

                }


                /* SHOW ERROR INSIDE PAGE */

                if (window.showLoginMessage) {

                    window.showLoginMessage(
                        message,
                        "error"
                    );

                }


                /* ENABLE BUTTON */

                loginButton.disabled =
                    false;


                loginButton.innerHTML = `

                    <i
                        class="bi bi-box-arrow-in-right me-2">
                    </i>

                    Login to Dashboard

                `;

            }

        }
    );

}


// ================================================
// AUTH STATE
// ================================================

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            console.log(
                "Owner logged in:",
                user.email
            );

        }

    }
);