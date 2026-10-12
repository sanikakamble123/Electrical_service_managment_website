// ======================================================
// PENDING.JS
// Shree Electrical Service
// Shows ONLY unpaid/pending orders
// ======================================================

import { db, auth } from "./firebase.js";

import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ======================================================
// VARIABLES
// ======================================================

let pendingOrders = [];
let unsubscribeOrders = null;


// ======================================================
// DOM
// ======================================================

const table =
    document.getElementById("pendingTable");

const count =
    document.getElementById("pendingCount");

const amount =
    document.getElementById("pendingAmount");

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
        loadPending();
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
// LOAD PENDING
// ======================================================

function loadPending() {

    unsubscribeOrders = onSnapshot(
        collection(db, "orders"),

        snapshot => {

            pendingOrders =
                snapshot.docs
                    .map(docSnap => ({
                        id: docSnap.id,
                        ...docSnap.data()
                    }))
                    .filter(order => !isPaid(order));


            pendingOrders.sort((a, b) => {

                const dateA =
                    getDate(
                        a.createdAt ||
                        a.updatedAt
                    );

                const dateB =
                    getDate(
                        b.createdAt ||
                        b.updatedAt
                    );

                return (
                    (dateB?.getTime() || 0) -
                    (dateA?.getTime() || 0)
                );

            });


            renderPending(pendingOrders);

        },

        error => {

            console.error(
                "Firestore pending error:",
                error
            );

            table.innerHTML = `
                <tr>
                    <td colspan="8"
                        class="text-center text-danger py-5">

                        Failed to load pending bills.

                        <br>

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

function renderPending(orders) {

    count.textContent =
        orders.length;


    const total =
        orders.reduce(
            (sum, order) =>
                sum + getAmount(order),
            0
        );


    amount.textContent =
        currency(total);


    if (!orders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="8"
                    class="text-center py-5">

                    <i class="bi bi-check-circle-fill
                              text-success fs-1"></i>

                    <h5 class="mt-3">
                        No Pending Bills
                    </h5>

                    <p class="text-muted">
                        All payments are completed.
                    </p>

                </td>
            </tr>
        `;

        return;

    }


    table.innerHTML =
        orders.map((order, index) => {

            const method =
                String(
                    order.paymentMethod || ""
                )
                    .toLowerCase()
                    .trim();


            const isCash =
                method === "cash" ||
                method === "cash payment";


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

                    <td class="amount">

                        <strong>
                            ${currency(
                                getAmount(order)
                            )}
                        </strong>

                    </td>

                    <td>

                        ${escapeHtml(
                            order.paymentMethod ||
                            "Online"
                        )}

                    </td>

                    <td>

                        ${formatDate(
                            order.createdAt ||
                            order.updatedAt
                        )}

                    </td>

                    <td>

                        ${
                            isCash

                            ? `

                                <button
                                    type="button"
                                    class="btn btn-success btn-sm verify-btn"
                                    data-action="cash"
                                    data-id="${escapeHtml(order.id)}">

                                    <i class="bi bi-cash"></i>
                                    Mark Cash Paid

                                </button>

                              `

                            : `

                                <button
                                    type="button"
                                    class="btn btn-primary btn-sm verify-btn"
                                    data-action="online"
                                    data-id="${escapeHtml(order.id)}">

                                    <i class="bi bi-check-circle"></i>
                                    Verify Payment

                                </button>

                              `
                        }

                    </td>

                </tr>

            `;

        }).join("");

}


// ======================================================
// PAYMENT UPDATE
// ======================================================

async function markPaymentAsPaid(orderId, method) {

    const order =
        pendingOrders.find(
            item => item.id === orderId
        );


    if (!order) {

        alert("Order not found.");
        return;

    }


    const orderAmount =
        getAmount(order);


    const message =
        method === "cash"

            ? `Confirm cash payment of ${currency(orderAmount)} has been received?`

            : `Confirm that online payment of ${currency(orderAmount)} has been received?`;


    const confirmed =
        window.confirm(message);


    if (!confirmed) {
        return;
    }


    try {

        await updateDoc(
            doc(db, "orders", orderId),
            {

                paymentStatus: "success",

                status: "success",

                paidAmount:
                    orderAmount,

                amountPaid:
                    orderAmount,

                paidAt:
                    serverTimestamp(),

                paymentVerified:
                    true,

                verifiedAt:
                    serverTimestamp(),

                verifiedBy:
                    auth.currentUser?.email ||
                    "Owner",

                updatedAt:
                    serverTimestamp()

            }
        );


        alert(
            method === "cash"
                ? "Cash payment marked as paid."
                : "Online payment verified successfully."
        );

        // onSnapshot automatically removes
        // the order from pending list.

    }

    catch (error) {

        console.error(
            "Payment update error:",
            error
        );

        alert(
            "Payment update failed.\n\n" +
            error.message
        );

    }

}


// ======================================================
// BUTTON EVENTS
// ======================================================

table.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {
            return;
        }


        const orderId =
            button.dataset.id;

        const action =
            button.dataset.action;


        if (!orderId) {
            return;
        }


        markPaymentAsPaid(
            orderId,
            action
        );

    }
);


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
                pendingOrders.filter(order => {

                    const text = [

                        order.invoiceNumber,

                        order.customerName,

                        order.mobile,

                        order.address,

                        order.paymentMethod,

                        order.paymentStatus

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return text.includes(value);

                });


            renderPending(filtered);

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