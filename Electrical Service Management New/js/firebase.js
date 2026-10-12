// ===========================================
// Shree Electrical Service
// firebase.js
// ===========================================


// ===========================================
// Firebase App
// ===========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


// ===========================================
// Firestore
// ===========================================

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===========================================
// Firebase Authentication
// ===========================================

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ===========================================
// Firebase Configuration
// ===========================================

const firebaseConfig = {

    apiKey:
        "AIzaSyCkduLj7wBJYlyIZR7O7iTdxdIgvN2q5q0",

    authDomain:
        "shree-electrical-service-2.firebaseapp.com",

    projectId:
        "shree-electrical-service-2",

    storageBucket:
        "shree-electrical-service-2.firebasestorage.app",

    messagingSenderId:
        "1061594540803",

    appId:
        "1:1061594540803:web:4136a5fbba1368e157d736"

};


// ===========================================
// Initialize Firebase App
// ===========================================

const app = initializeApp(firebaseConfig);


// ===========================================
// Initialize Firestore
// ===========================================

const db = getFirestore(app);


// ===========================================
// Initialize Firebase Authentication
// ===========================================

const auth = getAuth(app);


// ===========================================
// Export Firebase Services
// ===========================================

export {
    app,
    db,
    auth
};


// ===========================================
// Keep customer accounts out of OWNER pages
// (customer accounts end with @customer.shree.local)
// ===========================================

const OWNER_PAGES = [
    "dashboard", "dashboard-data", "customers",
    "orders", "pending", "revenue", "history"
];

const currentPage =
    location.pathname.split("/").pop().replace(".html", "");

onAuthStateChanged(auth, (user) => {

    if (
        user &&
        String(user.email || "").endsWith("@customer.shree.local") &&
        OWNER_PAGES.includes(currentPage)
    ) {

        location.replace("user-dashboard.html");

    }

});
