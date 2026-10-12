// ================================================
// USER-AUTH.JS  (customer login + register)
// Customer logs in with MOBILE NUMBER + PASSWORD.
// Firebase Auth stores it as  <mobile>@customer.shree.local
// ================================================
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase.js";

const DOMAIN = "customer.shree.local";
const $ = (id) => document.getElementById(id);
const toEmail = (mobile) => `${mobile}@${DOMAIN}`;

// ---------- tabs ----------
function showTab(name) {
    $("loginForm").classList.toggle("d-none", name !== "login");
    $("registerForm").classList.toggle("d-none", name !== "register");
    $("tabLogin").classList.toggle("active", name === "login");
    $("tabRegister").classList.toggle("active", name === "register");
    msg("");
}
$("tabLogin").addEventListener("click", () => showTab("login"));
$("tabRegister").addEventListener("click", () => showTab("register"));

// ---------- show / hide password ----------
document.querySelectorAll("[data-eye]").forEach((btn) => {
    btn.addEventListener("click", () => {
        const input = $(btn.dataset.eye);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.innerHTML = show ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    });
});

// ---------- message box ----------
function msg(text, type = "danger") {
    const box = $("msgBox");
    if (!text) { box.className = "d-none"; box.textContent = ""; return; }
    box.className = `alert alert-${type} py-2 small`;
    box.textContent = text;
}

// ---------- validation ----------
function validMobile(m) { return /^[6-9]\d{9}$/.test(m); }

function errorText(code) {
    switch (code) {
        case "auth/email-already-in-use": return "This mobile number is already registered. Please login.";
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found": return "Incorrect mobile number or password.";
        case "auth/weak-password": return "Password must be at least 6 characters.";
        case "auth/too-many-requests": return "Too many attempts. Please try again later.";
        case "auth/network-request-failed": return "Network error. Check your internet connection.";
        default: return "Something went wrong. Please try again.";
    }
}

function busy(btn, on, label) {
    btn.disabled = on;
    btn.innerHTML = on
        ? '<span class="spinner-border spinner-border-sm me-2"></span>Please wait...'
        : label;
}

// ---------- LOGIN ----------
$("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const mobile = $("loginMobile").value.trim();
    const password = $("loginPassword").value;
    const btn = $("loginBtn");
    const label = btn.innerHTML;

    if (!validMobile(mobile)) return msg("Enter a valid 10-digit mobile number.");
    if (!password) return msg("Enter your password.");

    busy(btn, true);
    try {
        await signInWithEmailAndPassword(auth, toEmail(mobile), password);
        msg("Login successful! Opening your dashboard...", "success");
        setTimeout(() => (location.href = "user-dashboard.html"), 700);
    } catch (err) {
        console.error(err);
        msg(errorText(err.code));
        busy(btn, false, label);
    }
});

// ---------- REGISTER ----------
$("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("regName").value.trim();
    const mobile = $("regMobile").value.trim();
    const password = $("regPassword").value;
    const confirm = $("regConfirm").value;
    const btn = $("registerBtn");
    const label = btn.innerHTML;

    if (name.length < 2 || !/^[A-Za-z .]+$/.test(name)) return msg("Enter your full name (letters only).");
    if (!validMobile(mobile)) return msg("Enter a valid 10-digit mobile number (starts with 6-9).");
    if (password.length < 6) return msg("Password must be at least 6 characters.");
    if (password !== confirm) return msg("Password and confirm password do not match.");

    busy(btn, true);
    try {
        const cred = await createUserWithEmailAndPassword(auth, toEmail(mobile), password);
        await updateProfile(cred.user, { displayName: name });
        msg("Account created! Opening your dashboard...", "success");
        setTimeout(() => (location.href = "user-dashboard.html"), 700);
    } catch (err) {
        console.error(err);
        msg(errorText(err.code));
        busy(btn, false, label);
    }
});

// ---------- already logged in? ----------
onAuthStateChanged(auth, (user) => {
    if (user && String(user.email).endsWith("@" + DOMAIN) && !$("registerBtn").disabled && !$("loginBtn").disabled) {
        location.replace("user-dashboard.html");
    }
});
