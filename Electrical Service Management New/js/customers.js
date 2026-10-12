// ======================================================
// CUSTOMERS.JS
// Shree Electrical Service
// COMPLETE FIRESTORE CUSTOMER RECORDS
// ======================================================

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    db,
    auth
} from "./firebase.js";


// ======================================================
// HTML ELEMENTS
// ======================================================

const customerCount =
    document.getElementById("customerCount");

const customerTable =
    document.getElementById("customerTable");

const searchInput =
    document.getElementById("searchInput");


// ======================================================
// DATA
// ======================================================

let customers = [];

let orders = [];


// ======================================================
// AUTHENTICATION
// ======================================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    console.log(
        "Customer page logged in:",
        user.email
    );

    loadCustomers();

});


// ======================================================
// LOAD CUSTOMERS
// ======================================================

function loadCustomers() {

    showLoading();

    onSnapshot(
        collection(db, "customers"),

        (customerSnapshot) => {

            customers = [];

            customerSnapshot.forEach((docSnap) => {

                customers.push({

                    id: docSnap.id,

                    ...docSnap.data()

                });

            });


            console.log(
                "CUSTOMERS COLLECTION:",
                customers
            );


            // After customers load,
            // listen to orders
            loadOrders();

        },

        (error) => {

            console.error(
                "Customers Firestore Error:",
                error
            );

            showError(error);

        }
    );

}


// ======================================================
// LOAD ORDERS
// ======================================================

function loadOrders() {

    onSnapshot(
        collection(db, "orders"),

        (orderSnapshot) => {

            orders = [];

            orderSnapshot.forEach((docSnap) => {

                orders.push({

                    id: docSnap.id,

                    ...docSnap.data()

                });

            });


            console.log(
                "ORDERS COLLECTION:",
                orders
            );


            buildCustomerRecords();

        },

        (error) => {

            console.error(
                "Orders Firestore Error:",
                error
            );

            showError(error);

        }
    );

}


// ======================================================
// BUILD CUSTOMER RECORDS
// ======================================================

function buildCustomerRecords() {

    const customerMap = new Map();


    // ==================================================
    // FIRST: CUSTOMERS COLLECTION
    // ==================================================

    customers.forEach((customer) => {

        const name =
            String(
                customer.name ||
                customer.customerName ||
                ""
            ).trim();


        const mobile =
            String(
                customer.mobile ||
                customer.phone ||
                customer.customerMobile ||
                ""
            ).trim();


        const address =
            String(
                customer.address ||
                ""
            ).trim();


        const city =
            String(
                customer.city ||
                ""
            ).trim();


        const village =
            String(
                customer.village ||
                ""
            ).trim();


        const pincode =
            String(
                customer.pincode ||
                ""
            ).trim();


        const key =
            createCustomerKey(
                name,
                mobile,
                address
            );


        if (!customerMap.has(key)) {

            customerMap.set(
                key,
                {

                    id:
                        customer.id,

                    name:
                        name || "Unknown Customer",

                    mobile:
                        mobile || "-",

                    address:
                        buildAddress(
                            address,
                            village,
                            city,
                            pincode
                        ),

                    orders: 0,

                    paid: 0,

                    pending: 0,

                    totalValue: 0,

                    lastOrder: null

                }
            );

        }

    });


    // ==================================================
    // SECOND: ADD ORDER INFORMATION
    // ==================================================

    orders.forEach((order) => {

        const name =
            getCustomerName(order);


        const mobile =
            getMobile(order);


        const address =
            String(
                order.address ||
                ""
            ).trim();


        const key =
            createCustomerKey(
                name,
                mobile,
                address
            );


        // ----------------------------------------------
        // If customer exists, use it
        // ----------------------------------------------

        let customer =
            customerMap.get(key);


        // ----------------------------------------------
        // If customer doesn't exist in customers
        // collection, create it from order
        // ----------------------------------------------

        if (!customer) {

            customer = {

                id:
                    order.id,

                name:
                    name || "Unknown Customer",

                mobile:
                    mobile || "-",

                address:
                    address || "-",

                orders: 0,

                paid: 0,

                pending: 0,

                totalValue: 0,

                lastOrder: null

            };


            customerMap.set(
                key,
                customer
            );

        }


        // ----------------------------------------------
        // ORDER COUNT
        // ----------------------------------------------

        customer.orders++;


        // ----------------------------------------------
        // AMOUNT
        // ----------------------------------------------

        const amount =
            getBillAmount(order);


        customer.totalValue +=
            amount;


        // ----------------------------------------------
        // PAYMENT STATUS
        // ----------------------------------------------

        if (isPaid(order)) {

            customer.paid +=
                amount;

        } else {

            customer.pending +=
                amount;

        }


        // ----------------------------------------------
        // LAST ORDER
        // ----------------------------------------------

        const orderDate =
            getDate(
                order.createdAt ||
                order.date
            );


        if (
            orderDate &&
            (
                !customer.lastOrder ||
                orderDate >
                customer.lastOrder
            )
        ) {

            customer.lastOrder =
                orderDate;

        }

    });


    // ==================================================
    // FINAL ARRAY
    // ==================================================

    const finalCustomers =
        Array.from(
            customerMap.values()
        );


    // ==================================================
    // SORT NEWEST FIRST
    // ==================================================

    finalCustomers.sort((a, b) => {

        if (!a.lastOrder) return 1;

        if (!b.lastOrder) return -1;

        return (
            b.lastOrder.getTime() -
            a.lastOrder.getTime()
        );

    });


    console.log(
        "FINAL CUSTOMER RECORDS:",
        finalCustomers
    );


    window.allCustomerRecords =
        finalCustomers;


    renderCustomers(
        finalCustomers
    );

}


// ======================================================
// RENDER CUSTOMERS
// ======================================================

function renderCustomers(
    data
) {

    if (!customerTable) {

        console.error(
            "customerTable not found in HTML."
        );

        return;

    }


    if (customerCount) {

        customerCount.textContent =
            data.length;

    }


    // ==================================================
    // NO DATA
    // ==================================================

    if (data.length === 0) {

        customerTable.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="text-center py-5">

                    <i
                        class="bi bi-people fs-1 text-secondary">
                    </i>

                    <div
                        class="mt-3 fw-semibold">

                        No customer records found

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    // ==================================================
    // CLEAR TABLE
    // ==================================================

    customerTable.innerHTML = "";


    // ==================================================
    // CREATE ROWS
    // ==================================================

    data.forEach((customer, index) => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <!-- # -->
            <td>

                <span class="row-number">

                    ${index + 1}

                </span>

            </td>


            <!-- CUSTOMER -->
            <td>

                <div class="customer-name-cell">

                    <div class="customer-avatar">

                        ${getInitial(
                            customer.name
                        )}

                    </div>

                    <div>

                        <strong>

                            ${escapeHTML(
                                customer.name
                            )}

                        </strong>

                    </div>

                </div>

            </td>


            <!-- MOBILE -->
            <td>

                <a
                    href="tel:${escapeHTML(
                        customer.mobile
                    )}"
                    class="mobile-link">

                    ${escapeHTML(
                        customer.mobile
                    )}

                </a>

            </td>


            <!-- ADDRESS -->
            <td>

                <div class="address-cell">

                    ${escapeHTML(
                        customer.address || "-"
                    )}

                </div>

            </td>


            <!-- ORDERS -->
            <td>

                <span class="count-badge">

                    ${customer.orders}

                </span>

            </td>


            <!-- PAID -->
            <td>

                <span class="paid-amount">

                    ₹${formatMoney(
                        customer.paid
                    )}

                </span>

            </td>


            <!-- PENDING -->
            <td>

                ${
                    customer.pending > 0

                    ? `

                        <span class="pending-amount">

                            ₹${formatMoney(
                                customer.pending
                            )}

                        </span>

                      `

                    : `

                        <span class="no-pending">

                            ₹0.00

                        </span>

                      `
                }

            </td>


            <!-- TOTAL VALUE -->
            <td>

                <strong class="total-value">

                    ₹${formatMoney(
                        customer.totalValue
                    )}

                </strong>

            </td>


            <!-- LAST ORDER -->
            <td>

                ${
                    customer.lastOrder

                    ? formatDate(
                        customer.lastOrder
                    )

                    : "-"
                }

            </td>

        `;


        customerTable.appendChild(
            row
        );

    });

}


// ======================================================
// SEARCH
// ======================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const search =
                searchInput.value
                    .trim()
                    .toLowerCase();


            const all =
                window.allCustomerRecords ||
                [];


            if (!search) {

                renderCustomers(all);

                return;

            }


            const filtered =
                all.filter(
                    (customer) => {

                        return (

                            customer.name
                                .toLowerCase()
                                .includes(search)

                            ||

                            customer.mobile
                                .toLowerCase()
                                .includes(search)

                            ||

                            customer.address
                                .toLowerCase()
                                .includes(search)

                        );

                    }
                );


            renderCustomers(
                filtered
            );

        }
    );

}


// ======================================================
// CUSTOMER KEY
// ======================================================

function createCustomerKey(
    name,
    mobile,
    address
) {

    const cleanMobile =
        String(
            mobile || ""
        )
            .replace(/\s+/g, "")
            .trim();


    if (cleanMobile) {

        return (
            "mobile:" +
            cleanMobile
        );

    }


    return (

        "name:" +

        String(
            name || ""
        )
            .trim()
            .toLowerCase()

        +

        "|address:" +

        String(
            address || ""
        )
            .trim()
            .toLowerCase()

    );

}


// ======================================================
// CUSTOMER NAME
// ======================================================

function getCustomerName(
    order
) {

    return String(

        order.customerName ||

        order.customer_name ||

        order.name ||

        order.customer?.name ||

        "Unknown Customer"

    ).trim();

}


// ======================================================
// MOBILE
// ======================================================

function getMobile(
    order
) {

    return String(

        order.mobile ||

        order.customerMobile ||

        order.customer_mobile ||

        order.phone ||

        order.customer?.mobile ||

        "-"

    ).trim();

}


// ======================================================
// AMOUNT
// ======================================================

function getBillAmount(
    order
) {

    const values = [

        order.grandTotal,

        order.totalAmount,

        order.total,

        order.amount,

        order.billAmount,

        order.invoiceAmount

    ];


    for (
        const value
        of values
    ) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            const amount =
                Number(
                    String(value)
                        .replace(
                            /[₹,\s]/g,
                            ""
                        )
                );


            if (
                Number.isFinite(
                    amount
                )
            ) {

                return amount;

            }

        }

    }


    return 0;

}


// ======================================================
// PAYMENT STATUS
// ======================================================

function isPaid(
    order
) {

    if (
        order.paymentVerified === true
    ) {

        return true;

    }


    const status =
        String(

            order.paymentStatus ||

            order.status ||

            "pending"

        )
            .trim()
            .toLowerCase();


    return [

        "paid",

        "success",

        "successful",

        "completed",

        "complete"

    ].includes(
        status
    );

}


// ======================================================
// ADDRESS
// ======================================================

function buildAddress(
    address,
    village,
    city,
    pincode
) {

    return [

        address,

        village,

        city,

        pincode

    ]
        .map(
            value =>
                String(
                    value || ""
                ).trim()
        )
        .filter(Boolean)
        .join(", ");

}


// ======================================================
// DATE
// ======================================================

function getDate(
    value
) {

    if (!value) {

        return null;

    }


    // Firebase Timestamp
    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }


    // Firestore timestamp object
    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return new Date(
            value.seconds * 1000
        );

    }


    // YYYY-MM-DD
    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/
            .test(value)
    ) {

        const parts =
            value.split("-");


        return new Date(

            Number(parts[0]),

            Number(parts[1]) - 1,

            Number(parts[2])

        );

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
    value
) {

    const date =
        getDate(value);


    if (!date) {

        return "-";

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            day: "2-digit",

            month: "short",

            year: "numeric"

        }
    );

}


// ======================================================
// FORMAT MONEY
// ======================================================

function formatMoney(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }
    );

}


// ======================================================
// INITIAL
// ======================================================

function getInitial(
    name
) {

    const text =
        String(
            name || "?"
        ).trim();


    return escapeHTML(
        text
            .charAt(0)
            .toUpperCase()
    );

}


// ======================================================
// LOADING
// ======================================================

function showLoading() {

    if (!customerTable) return;


    customerTable.innerHTML = `

        <tr>

            <td
                colspan="9"
                class="text-center py-5">

                <div
                    class="spinner-border text-primary">
                </div>

                <div
                    class="mt-3">

                    Loading customer records...

                </div>

            </td>

        </tr>

    `;

}


// ======================================================
// ERROR
// ======================================================

function showError(
    error
) {

    if (!customerTable) return;


    customerTable.innerHTML = `

        <tr>

            <td
                colspan="9"
                class="text-center text-danger py-5">

                <i
                    class="bi bi-database-x fs-1">
                </i>

                <div
                    class="mt-3 fw-semibold">

                    Firestore Error

                </div>

                <small>

                    ${escapeHTML(
                        error.message
                    )}

                </small>

            </td>

        </tr>

    `;

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}