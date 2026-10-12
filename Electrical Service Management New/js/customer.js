// ==========================================
// Shree Electrical Service
// customer.js
// ==========================================

import { db } from "./firebase.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("customer.js loaded");

const customerForm = document.getElementById("customerForm");

if (customerForm) {

    // Set today's date
    const dateInput = document.getElementById("date");

    if (dateInput) {
        dateInput.value = new Date().toISOString().split("T")[0];
    }

    customerForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const customer = {
            name: document.getElementById("customerName").value.trim(),
            mobile: document.getElementById("mobile").value.trim(),
            address: document.getElementById("address").value.trim(),
            village: document.getElementById("village").value.trim(),
            city: document.getElementById("city").value.trim(),
            pincode: document.getElementById("pincode").value.trim(),
            date: document.getElementById("date").value
        };

        // Validation
        if (customer.name === "") {
            alert("Please enter customer name.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(customer.mobile)) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }

        if (!/^\d{6}$/.test(customer.pincode)) {
            alert("Please enter a valid 6-digit PIN code.");
            return;
        }

        // Save locally
        customer.id = Date.now().toString();

        localStorage.setItem(
            "customer",
            JSON.stringify(customer)
        );

        // Try saving to Firebase
        try {

            if (db) {

                // Document id = mobile number, so the same customer
                // placing another order UPDATES the record instead of
                // creating a duplicate.
                const customerId = customer.mobile;

                await setDoc(
                    doc(db, "customers", customerId),
                    customer,
                    { merge: true }
                );

                customer.id = customerId;

                localStorage.setItem(
                    "customer",
                    JSON.stringify(customer)
                );

                console.log("Customer saved to Firestore.");

            }

        } catch (error) {

            console.error("Firestore Error:", error);

            // Continue even if Firebase fails
            alert("Customer saved locally.\nFirebase sync failed.");

        }

        // Always continue to Services page
        window.location.href = "services.html";

    });

}