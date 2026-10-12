// ======================================================
// ORDERS.JS
// Shree Electrical Service
// Shows ALL orders from Firestore
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

let allOrders = [];
let unsubscribeOrders = null;


// ======================================================
// DOM
// ======================================================

const table =
    document.getElementById("orderTable");

const count =
    document.getElementById("orderCount");

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
        loadOrders();
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

    const fields = [
        "total",
        "grandTotal",
        "totalAmount",
        "amount",
        "billAmount"
    ];

    for (const field of fields) {

        const value = Number(order[field]);

        if (Number.isFinite(value) && value >= 0) {
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
// TIME
// ======================================================

function getTime(order) {

    const date =
        getDate(
            order.updatedAt ||
            order.createdAt
        );

    return date
        ? date.getTime()
        : 0;

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
// SERVICES
// ======================================================

function getServices(order) {

    if (Array.isArray(order.services)) {

        return order.services
            .map(service => {

                if (typeof service === "string") {
                    return service;
                }

                if (
                    service &&
                    typeof service === "object"
                ) {

                    return (
                        service.name ||
                        service.serviceName ||
                        service.title ||
                        "Service"
                    );

                }

                return "Service";

            })
            .filter(Boolean)
            .join(", ");

    }


    if (
        typeof order.services === "string" &&
        order.services.trim()
    ) {

        return order.services;

    }


    return "-";

}


// ======================================================
// LOAD ORDERS
// ======================================================

function loadOrders() {

    unsubscribeOrders = onSnapshot(
        collection(db, "orders"),

        snapshot => {

            allOrders =
                snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                }));


            allOrders.sort(
                (a, b) =>
                    getTime(b) - getTime(a)
            );


            renderOrders(allOrders);

        },

        error => {

            console.error(
                "Firestore order error:",
                error
            );

            table.innerHTML = `
                <tr>
                    <td colspan="9"
                        class="text-center text-danger py-5">

                        <i class="bi bi-exclamation-triangle-fill fs-3"></i>

                        <div class="mt-2">
                            Failed to load orders.
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
// RENDER
// ======================================================

function renderOrders(orders) {

    count.textContent =
        orders.length;


    if (!orders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="9"
                    class="text-center text-muted py-5">

                    <i class="bi bi-receipt fs-1"></i>

                    <h5 class="mt-3">
                        No Orders Found
                    </h5>

                </td>
            </tr>
        `;

        return;

    }


    table.innerHTML =
        orders.map((order, index) => {

            const paid =
                isPaid(order);


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

                        ${escapeHtml(
                            getServices(order)
                        )}

                    </td>

                    <td>

                        <strong>
                            ${currency(
                                getAmount(order)
                            )}
                        </strong>

                    </td>

                    <td>

                        ${
                            paid

                                ? `
                                    <span class="badge badge-paid">
                                        Paid
                                    </span>
                                  `

                                : `
                                    <span class="badge badge-pending">
                                        Pending
                                    </span>
                                  `
                        }

                    </td>

                    <td>

                        ${escapeHtml(
                            order.paymentMethod ||
                            "-"
                        )}

                    </td>

                    <td>

                        ${formatDate(
                            order.createdAt ||
                            order.updatedAt
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
                allOrders.filter(order => {

                    const searchableText = [

                        order.invoiceNumber,

                        order.customerName,

                        order.mobile,

                        order.address,

                        order.paymentMethod,

                        order.paymentStatus,

                        getServices(order)

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return searchableText
                        .includes(value);

                });


            renderOrders(filtered);

        }
    );

}


// ======================================================
// ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}