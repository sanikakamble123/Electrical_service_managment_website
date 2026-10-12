// ======================================================
// REVENUE.JS
// Shree Electrical Service
// Shows ONLY successfully paid orders
// ======================================================

import { db, auth } from "./firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ======================================================
// VARIABLES
// ======================================================

let revenueOrders = [];
let unsubscribeOrders = null;


// ======================================================
// DOM
// ======================================================

const table =
    document.getElementById("revenueTable");

const count =
    document.getElementById("revenueCount");

const totalRevenue =
    document.getElementById("totalRevenue");

const search =
    document.getElementById("searchInput");


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(auth, user => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    if (!unsubscribeOrders) {
        loadRevenue();
    }

});


// ======================================================
// PAYMENT STATUS
// ======================================================

function isPaid(order) {

    const paymentStatus =
        String(order.paymentStatus || "")
            .toLowerCase()
            .trim();

    const status =
        String(order.status || "")
            .toLowerCase()
            .trim();

    const paidStatuses = [
        "paid",
        "success",
        "successful",
        "completed",
        "complete"
    ];

    return (
        paidStatuses.includes(paymentStatus) ||
        paidStatuses.includes(status)
    );

}


// ======================================================
// AMOUNT
// ======================================================

function getAmount(order) {

    // For paid orders, use the actual paid amount
    const paidFields = [
        "paidAmount",
        "amountPaid"
    ];

    for (const field of paidFields) {

        const value =
            Number(order[field]);

        if (
            Number.isFinite(value) &&
            value > 0
        ) {

            return value;

        }

    }


    // Fallback to original bill amount
    const billFields = [
        "total",
        "grandTotal",
        "totalAmount",
        "amount",
        "billAmount"
    ];

    for (const field of billFields) {

        const value =
            Number(order[field]);

        if (
            Number.isFinite(value) &&
            value >= 0
        ) {

            return value;

        }

    }


    return 0;

}


// ======================================================
// DATE
// ======================================================

function getDate(value) {

    if (!value) {
        return null;
    }

    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    if (value instanceof Date) {
        return value;
    }

    const date = new Date(value);

    return isNaN(date.getTime())
        ? null
        : date;

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(value) {

    const date = getDate(value);

    if (!date) {
        return "-";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}


// ======================================================
// CURRENCY
// ======================================================

function currency(value) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(value) || 0);

}


// ======================================================
// LOAD REVENUE
// ======================================================

function loadRevenue() {

    unsubscribeOrders = onSnapshot(
        collection(db, "orders"),

        snapshot => {

            revenueOrders =
                snapshot.docs
                    .map(docSnap => ({
                        id: docSnap.id,
                        ...docSnap.data()
                    }))
                    .filter(order =>
                        isPaid(order)
                    );


            // Newest paid records first
            revenueOrders.sort((a, b) => {

                const dateA =
                    getDate(
                        a.paidAt ||
                        a.verifiedAt ||
                        a.updatedAt ||
                        a.createdAt
                    );

                const dateB =
                    getDate(
                        b.paidAt ||
                        b.verifiedAt ||
                        b.updatedAt ||
                        b.createdAt
                    );

                return (
                    (dateB?.getTime() || 0) -
                    (dateA?.getTime() || 0)
                );

            });


            renderRevenue(
                revenueOrders
            );

        },

        error => {

            console.error(
                "Firestore revenue error:",
                error
            );

            table.innerHTML = `
                <tr>
                    <td colspan="8"
                        class="text-center text-danger py-5">

                        <i class="bi bi-exclamation-triangle-fill fs-3"></i>

                        <div class="mt-2">
                            Failed to load revenue records.
                        </div>

                        <small>
                            ${escapeHtml(error.message)}
                        </small>

                    </td>
                </tr>
            `;

        }
    );

}


// ======================================================
// RENDER REVENUE
// ======================================================

function renderRevenue(orders) {

    count.textContent =
        orders.length;


    const total =
        orders.reduce(
            (sum, order) =>
                sum + getAmount(order),
            0
        );


    totalRevenue.textContent =
        currency(total);


    if (!orders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="8"
                    class="text-center text-muted py-5">

                    <i class="bi bi-cash-stack fs-1"></i>

                    <h5 class="mt-3">
                        No Paid Revenue
                    </h5>

                    <p>
                        Successfully verified payments
                        will appear here.
                    </p>

                </td>
            </tr>
        `;

        return;

    }


    table.innerHTML =
        orders.map((order, index) => {

            return `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>

                        <strong>
                            ${escapeHtml(
                                order.invoiceNumber ||
                                order.id
                            )}
                        </strong>

                    </td>

                    <td>

                        ${escapeHtml(
                            order.customerName ||
                            "-"
                        )}

                    </td>

                    <td>

                        ${escapeHtml(
                            order.mobile ||
                            "-"
                        )}

                    </td>

                    <td>

                        <strong class="text-success">

                            ${currency(
                                getAmount(order)
                            )}

                        </strong>

                    </td>

                    <td>

                        ${escapeHtml(
                            order.paymentMethod ||
                            "-"
                        )}

                    </td>

                    <td>

                        ${formatDate(
                            order.paidAt ||
                            order.verifiedAt ||
                            order.updatedAt ||
                            order.createdAt
                        )}

                    </td>

                    <td>

                        ${escapeHtml(
                            order.verifiedBy ||
                            "Owner"
                        )}

                    </td>

                </tr>

            `;

        }).join("");

}


// ======================================================
// SEARCH
// ======================================================

if (search) {

    search.addEventListener(
        "input",
        () => {

            const value =
                search.value
                    .toLowerCase()
                    .trim();


            const filtered =
                revenueOrders.filter(order => {

                    const text = [

                        order.invoiceNumber,

                        order.customerName,

                        order.mobile,

                        order.address,

                        order.paymentMethod,

                        order.verifiedBy

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return text.includes(value);

                });


            renderRevenue(filtered);

        }
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}