// ======================================================
// SHREE ELECTRICAL SERVICE
// DASHBOARD-DATA.JS
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
// ELEMENTS
// ======================================================

const tableContainer =
    document.getElementById("tableContainer");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const recordCount =
    document.getElementById("recordCount");

const displayValue =
    document.getElementById("displayValue");

const lastUpdated =
    document.getElementById("lastUpdated");

const pageTitle =
    document.getElementById("pageTitle");

const pageDescription =
    document.getElementById("pageDescription");

const pageIcon =
    document.getElementById("pageIcon");

const modalElement =
    document.getElementById("detailsModal");

const detailsModal =
    new bootstrap.Modal(modalElement);

const modalTitle =
    document.getElementById("modalTitle");

const modalSubtitle =
    document.getElementById("modalSubtitle");

const modalContent =
    document.getElementById("modalContent");


// ======================================================
// DATA
// ======================================================

let allOrders = [];

let currentRows = [];


// ======================================================
// CURRENT PAGE
// ======================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const currentView =
    params.get("view") || "orders";


// ======================================================
// PAGE SETTINGS
// ======================================================

const pageConfig = {

    customers: {

        title: "All Customers",

        description:
            "View all customers and their complete service history.",

        icon: "bi-people-fill"

    },


    orders: {

        title: "All Orders",

        description:
            "View every order stored in your electrical service system.",

        icon: "bi-receipt-cutoff"

    },


    revenue: {

        title: "Revenue Details",

        description:
            "View all paid orders contributing to your business revenue.",

        icon: "bi-currency-rupee"

    },


    pending: {

        title: "Pending Bills",

        description:
            "View all unpaid and pending customer bills.",

        icon: "bi-wallet2"

    }

};


// ======================================================
// PAGE SETUP
// ======================================================

function setupPage() {

    const config =
        pageConfig[currentView] ||
        pageConfig.orders;


    pageTitle.textContent =
        config.title;


    pageDescription.textContent =
        config.description;


    pageIcon.className =
        "bi " + config.icon;


    if (
        currentView === "customers"
    ) {

        statusFilter.style.display =
            "none";

        searchInput.placeholder =
            "Search customer name, mobile or address...";

    }


    if (
        currentView === "orders"
    ) {

        statusFilter.style.display =
            "block";

        searchInput.placeholder =
            "Search customer, mobile, order ID...";

    }


    if (
        currentView === "revenue"
    ) {

        statusFilter.style.display =
            "none";

        searchInput.placeholder =
            "Search customer or mobile...";

    }


    if (
        currentView === "pending"
    ) {

        statusFilter.style.display =
            "none";

        searchInput.placeholder =
            "Search pending customer or mobile...";

    }

}


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
    auth,
    function (user) {

        /*
         * If your dashboard is accessible without
         * Firebase login, remove this redirect.
         */

        if (!user) {

            console.log(
                "No authenticated Firebase user."
            );

            startOrders();

            return;

        }


        startOrders();

    }
);


// ======================================================
// FIRESTORE
// ======================================================

function startOrders() {

    showLoading();


    onSnapshot(

        collection(
            db,
            "orders"
        ),

        function (snapshot) {

            allOrders =
                snapshot.docs.map(
                    function (doc) {

                        return {

                            id: doc.id,

                            ...doc.data()

                        };

                    }
                );


            console.log(
                "Orders loaded:",
                allOrders
            );


            renderPage();


            lastUpdated.textContent =
                new Date().toLocaleTimeString(
                    "en-IN"
                );

        },

        function (error) {

            console.error(
                "Firestore error:",
                error
            );


            showError(
                error
            );

        }

    );

}


// ======================================================
// RENDER PAGE
// ======================================================

function renderPage() {

    if (
        currentView === "customers"
    ) {

        renderCustomers();

        return;

    }


    if (
        currentView === "orders"
    ) {

        renderOrders(
            allOrders
        );

        return;

    }


    if (
        currentView === "revenue"
    ) {

        renderRevenue();

        return;

    }


    if (
        currentView === "pending"
    ) {

        renderPending();

        return;

    }


    renderOrders(
        allOrders
    );

}


// ======================================================
// CUSTOMER LIST
// ======================================================

function createCustomers(
    orders
) {

    const map =
        new Map();


    orders.forEach(
        function (order) {

            const name =
                getCustomerName(
                    order
                );

            const mobile =
                getMobile(
                    order
                );

            const address =
                getAddress(
                    order
                );


            const key =
                mobile !== "-"
                    ? mobile
                    : name
                        .toLowerCase()
                        .trim();


            if (
                !map.has(key)
            ) {

                map.set(
                    key,
                    {

                        key: key,

                        name: name,

                        mobile: mobile,

                        address: address,

                        orders: [],

                        total: 0,

                        lastOrder: null

                    }
                );

            }


            const customer =
                map.get(key);


            customer.orders.push(
                order
            );


            customer.total +=
                getAmount(
                    order
                );


            const date =
                getDate(
                    order
                );


            if (
                date &&
                (
                    !customer.lastOrder ||
                    date >
                    customer.lastOrder
                )
            ) {

                customer.lastOrder =
                    date;

            }


            if (
                customer.address === "-" &&
                address !== "-"
            ) {

                customer.address =
                    address;

            }

        }
    );


    return Array.from(
        map.values()
    );

}


// ======================================================
// RENDER CUSTOMERS
// ======================================================

function renderCustomers() {

    let customers =
        createCustomers(
            allOrders
        );


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    if (search) {

        customers =
            customers.filter(
                function (customer) {

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

    }


    currentRows =
        customers;


    const total =
        customers.reduce(
            function (
                sum,
                customer
            ) {

                return (
                    sum +
                    customer.total
                );

            },
            0
        );


    updateSummary(
        customers.length,
        total
    );


    if (
        customers.length === 0
    ) {

        showEmpty(
            "bi-people",
            "No Customers Found",
            "No customer matches your search."
        );

        return;

    }


    tableContainer.innerHTML = `

        <div class="table-responsive">

            <table class="table">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Customer</th>

                        <th>Mobile</th>

                        <th>Address</th>

                        <th>Orders</th>

                        <th>Total</th>

                        <th>Last Order</th>

                        <th>Action</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        customers.map(
                            function (
                                customer,
                                index
                            ) {

                                return `

                                    <tr>

                                        <td>
                                            ${index + 1}
                                        </td>


                                        <td>

                                            <button
                                                class="customer-btn customer-view"
                                                data-key="${escapeHTML(customer.key)}">

                                                <i class="bi bi-person-circle"></i>

                                                ${escapeHTML(customer.name)}

                                            </button>

                                        </td>


                                        <td>

                                            ${escapeHTML(
                                                customer.mobile
                                            )}

                                        </td>


                                        <td>

                                            ${escapeHTML(
                                                customer.address
                                            )}

                                        </td>


                                        <td>

                                            <span class="service-badge">

                                                ${customer.orders.length}

                                                Orders

                                            </span>

                                        </td>


                                        <td class="amount">

                                            ₹${money(
                                                customer.total
                                            )}

                                        </td>


                                        <td>

                                            ${
                                                customer.lastOrder
                                                    ? formatDate(
                                                        customer.lastOrder
                                                    )
                                                    : "-"
                                            }

                                        </td>


                                        <td>

                                            <button
                                                class="btn btn-primary btn-sm customer-view"
                                                data-key="${escapeHTML(customer.key)}">

                                                <i class="bi bi-eye"></i>

                                                View

                                            </button>

                                        </td>

                                    </tr>

                                `;

                            }
                        ).join("")
                    }

                </tbody>

            </table>

        </div>

    `;


    document
        .querySelectorAll(
            ".customer-view"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const customer =
                            currentRows.find(
                                function (item) {

                                    return (
                                        item.key ===
                                        button.dataset.key
                                    );

                                }
                            );


                        if (
                            customer
                        ) {

                            showCustomer(
                                customer
                            );

                        }

                    }
                );

            }
        );

}


// ======================================================
// CUSTOMER DETAILS
// ======================================================

function showCustomer(
    customer
) {

    modalTitle.textContent =
        customer.name;


    modalSubtitle.textContent =
        customer.mobile;


    modalContent.innerHTML = `

        <h5 class="fw-bold mb-3">

            <i class="bi bi-person-vcard text-primary"></i>

            Personal Information

        </h5>


        <div class="row g-3 mb-4">


            <div class="col-md-6">

                <div class="info-card">

                    <div class="info-label">
                        Customer Name
                    </div>

                    <div class="info-value">

                        ${escapeHTML(
                            customer.name
                        )}

                    </div>

                </div>

            </div>


            <div class="col-md-6">

                <div class="info-card">

                    <div class="info-label">
                        Mobile
                    </div>

                    <div class="info-value">

                        ${escapeHTML(
                            customer.mobile
                        )}

                    </div>

                </div>

            </div>


            <div class="col-12">

                <div class="info-card">

                    <div class="info-label">
                        Address
                    </div>

                    <div class="info-value">

                        ${escapeHTML(
                            customer.address
                        )}

                    </div>

                </div>

            </div>

        </div>



        <h5 class="fw-bold mb-3">

            <i class="bi bi-tools text-primary"></i>

            Services & Order History

        </h5>


        ${
            customer.orders.map(
                function (
                    order,
                    index
                ) {

                    return `

                        <div class="order-box">

                            <div class="d-flex justify-content-between">

                                <div>

                                    <strong>

                                        Order #${index + 1}

                                    </strong>


                                    <div class="small text-muted">

                                        ID:
                                        ${escapeHTML(
                                            order.id
                                        )}

                                    </div>


                                    <div class="small text-muted">

                                        ${
                                            getDate(order)
                                                ? formatDate(
                                                    getDate(order)
                                                )
                                                : "-"
                                        }

                                    </div>

                                </div>


                                <div>

                                    ${statusBadge(
                                        getStatus(
                                            order
                                        )
                                    )}

                                </div>

                            </div>


                            <hr>


                            <strong>

                                Services Required:

                            </strong>


                            <div class="mt-2">

                                ${
                                    getServices(
                                        order
                                    ).length

                                    ?

                                    getServices(
                                        order
                                    )
                                    .map(
                                        function (
                                            service
                                        ) {

                                            return `

                                                <span class="service-badge">

                                                    ${escapeHTML(
                                                        service.name
                                                    )}

                                                    ${
                                                        service.quantity
                                                            ? " × " +
                                                              service.quantity
                                                            : ""
                                                    }

                                                </span>

                                            `;

                                        }
                                    )
                                    .join("")

                                    :

                                    `<span class="text-muted">
                                        No service details
                                    </span>`

                                }

                            </div>


                            <div class="row g-3 mt-2">


                                <div class="col-md-6">

                                    <div class="info-card">

                                        <div class="info-label">

                                            Payment / Service Status

                                        </div>

                                        <div>

                                            ${statusBadge(
                                                getStatus(
                                                    order
                                                )
                                            )}

                                        </div>

                                    </div>

                                </div>


                                <div class="col-md-6">

                                    <div class="info-card">

                                        <div class="info-label">

                                            Bill Amount

                                        </div>

                                        <div class="info-value">

                                            ₹${money(
                                                getAmount(
                                                    order
                                                )
                                            )}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    `;

                }
            ).join("")
        }


        <div class="total-box">

            <div class="d-flex justify-content-between">

                <div>

                    <div class="text-muted">

                        TOTAL CUSTOMER VALUE

                    </div>

                    <strong>

                        ₹${money(
                            customer.total
                        )}

                    </strong>

                </div>


                <div class="text-end">

                    <div class="text-muted">

                        TOTAL ORDERS

                    </div>

                    <strong>

                        ${customer.orders.length}

                    </strong>

                </div>

            </div>

        </div>

    `;


    detailsModal.show();

}


// ======================================================
// ORDERS
// ======================================================

function renderOrders(
    orders
) {

    let filtered =
        filterOrders(
            orders
        );


    currentRows =
        filtered;


    const total =
        filtered.reduce(
            function (
                sum,
                order
            ) {

                return (
                    sum +
                    getAmount(
                        order
                    )
                );

            },
            0
        );


    updateSummary(
        filtered.length,
        total
    );


    if (
        filtered.length === 0
    ) {

        showEmpty(
            "bi-receipt",
            "No Orders Found",
            "No orders match your search."
        );

        return;

    }


    tableContainer.innerHTML = `

        <div class="table-responsive">

            <table class="table">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Customer</th>

                        <th>Mobile</th>

                        <th>Services</th>

                        <th>Amount</th>

                        <th>Status</th>

                        <th>Date</th>

                        <th>Action</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        filtered.map(
                            function (
                                order,
                                index
                            ) {

                                return `

                                    <tr>

                                        <td>
                                            ${index + 1}
                                        </td>


                                        <td>

                                            <strong>

                                                ${escapeHTML(
                                                    getCustomerName(
                                                        order
                                                    )
                                                )}

                                            </strong>

                                        </td>


                                        <td>

                                            ${escapeHTML(
                                                getMobile(
                                                    order
                                                )
                                            )}

                                        </td>


                                        <td>

                                            ${renderServices(
                                                order
                                            )}

                                        </td>


                                        <td class="amount">

                                            ₹${money(
                                                getAmount(
                                                    order
                                                )
                                            )}

                                        </td>


                                        <td>

                                            ${statusBadge(
                                                getStatus(
                                                    order
                                                )
                                            )}

                                        </td>


                                        <td>

                                            ${
                                                getDate(order)
                                                    ? formatDate(
                                                        getDate(order)
                                                    )
                                                    : "-"
                                            }

                                        </td>


                                        <td>

                                            <button
                                                class="btn btn-primary btn-sm order-view"
                                                data-id="${escapeHTML(order.id)}">

                                                <i class="bi bi-eye"></i>

                                                View

                                            </button>

                                        </td>

                                    </tr>

                                `;

                            }
                        ).join("")
                    }

                </tbody>

            </table>

        </div>

    `;


    attachOrderButtons();

}


// ======================================================
// REVENUE
// ======================================================

function renderRevenue() {

    let orders =
        allOrders.filter(
            function (order) {

                return isPaid(
                    order
                );

            }
        );


    orders =
        filterOrdersWithoutStatus(
            orders
        );


    currentRows =
        orders;


    const revenue =
        orders.reduce(
            function (
                sum,
                order
            ) {

                return (
                    sum +
                    getPaidAmount(
                        order
                    )
                );

            },
            0
        );


    updateSummary(
        orders.length,
        revenue
    );


    if (
        orders.length === 0
    ) {

        showEmpty(
            "bi-cash-stack",
            "No Revenue Found",
            "No paid orders are available."
        );

        return;

    }


    tableContainer.innerHTML = `

        <div class="table-responsive">

            <table class="table">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Customer</th>

                        <th>Mobile</th>

                        <th>Bill</th>

                        <th>Paid</th>

                        <th>Status</th>

                        <th>Date</th>

                        <th>Action</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        orders.map(
                            function (
                                order,
                                index
                            ) {

                                return `

                                    <tr>

                                        <td>
                                            ${index + 1}
                                        </td>


                                        <td>

                                            <strong>

                                                ${escapeHTML(
                                                    getCustomerName(
                                                        order
                                                    )
                                                )}

                                            </strong>

                                        </td>


                                        <td>

                                            ${escapeHTML(
                                                getMobile(
                                                    order
                                                )
                                            )}

                                        </td>


                                        <td>

                                            ₹${money(
                                                getAmount(
                                                    order
                                                )
                                            )}

                                        </td>


                                        <td class="amount">

                                            ₹${money(
                                                getPaidAmount(
                                                    order
                                                )
                                            )}

                                        </td>


                                        <td>

                                            ${statusBadge(
                                                getStatus(
                                                    order
                                                )
                                            )}

                                        </td>


                                        <td>

                                            ${
                                                getDate(order)
                                                    ? formatDate(
                                                        getDate(order)
                                                    )
                                                    : "-"
                                            }

                                        </td>


                                        <td>

                                            <button
                                                class="btn btn-primary btn-sm order-view"
                                                data-id="${escapeHTML(order.id)}">

                                                <i class="bi bi-eye"></i>

                                                View

                                            </button>

                                        </td>

                                    </tr>

                                `;

                            }
                        ).join("")
                    }

                </tbody>

            </table>

        </div>

    `;


    attachOrderButtons();

}


// ======================================================
// PENDING
// ======================================================

function renderPending() {

    let orders =
        allOrders.filter(
            function (order) {

                return !isPaid(
                    order
                );

            }
        );


    orders =
        filterOrdersWithoutStatus(
            orders
        );


    currentRows =
        orders;


    const total =
        orders.reduce(
            function (
                sum,
                order
            ) {

                return (
                    sum +
                    getAmount(
                        order
                    )
                );

            },
            0
        );


    updateSummary(
        orders.length,
        total
    );


    if (
        orders.length === 0
    ) {

        showEmpty(
            "bi-check-circle",
            "No Pending Bills",
            "There are no pending bills."
        );

        return;

    }


    tableContainer.innerHTML = `

        <div class="table-responsive">

            <table class="table">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Customer</th>

                        <th>Mobile</th>

                        <th>Services</th>

                        <th>Pending Bill</th>

                        <th>Status</th>

                        <th>Date</th>

                        <th>Action</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        orders.map(
                            function (
                                order,
                                index
                            ) {

                                return `

                                    <tr>

                                        <td>
                                            ${index + 1}
                                        </td>


                                        <td>

                                            <strong>

                                                ${escapeHTML(
                                                    getCustomerName(
                                                        order
                                                    )
                                                )}

                                            </strong>

                                        </td>


                                        <td>

                                            ${escapeHTML(
                                                getMobile(
                                                    order
                                                )
                                            )}

                                        </td>


                                        <td>

                                            ${renderServices(
                                                order
                                            )}

                                        </td>


                                        <td class="pending-amount">

                                            ₹${money(
                                                getAmount(
                                                    order
                                                )
                                            )}

                                        </td>


                                        <td>

                                            ${statusBadge(
                                                getStatus(
                                                    order
                                                )
                                            )}

                                        </td>


                                        <td>

                                            ${
                                                getDate(order)
                                                    ? formatDate(
                                                        getDate(order)
                                                    )
                                                    : "-"
                                            }

                                        </td>


                                        <td>

                                            <button
                                                class="btn btn-primary btn-sm order-view"
                                                data-id="${escapeHTML(order.id)}">

                                                <i class="bi bi-eye"></i>

                                                View

                                            </button>

                                        </td>

                                    </tr>

                                `;

                            }
                        ).join("")
                    }

                </tbody>

            </table>

        </div>

    `;


    attachOrderButtons();

}


// ======================================================
// ORDER BUTTONS
// ======================================================

function attachOrderButtons() {

    document
        .querySelectorAll(
            ".order-view"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const order =
                            currentRows.find(
                                function (
                                    item
                                ) {

                                    return (
                                        item.id ===
                                        button.dataset.id
                                    );

                                }
                            );


                        if (
                            order
                        ) {

                            showOrder(
                                order
                            );

                        }

                    }
                );

            }
        );

}


// ======================================================
// ORDER DETAILS
// ======================================================

function showOrder(
    order
) {

    modalTitle.textContent =
        getCustomerName(
            order
        );


    modalSubtitle.textContent =
        "Complete Order Details";


    modalContent.innerHTML = `

        <h5 class="fw-bold mb-3">

            <i class="bi bi-person-vcard text-primary"></i>

            Customer Information

        </h5>


        <div class="row g-3 mb-4">


            <div class="col-md-6">

                <div class="info-card">

                    <div class="info-label">
                        Customer Name
                    </div>

                    <div class="info-value">

                        ${escapeHTML(
                            getCustomerName(
                                order
                            )
                        )}

                    </div>

                </div>

            </div>


            <div class="col-md-6">

                <div class="info-card">

                    <div class="info-label">
                        Mobile
                    </div>

                    <div class="info-value">

                        ${escapeHTML(
                            getMobile(
                                order
                            )
                        )}

                    </div>

                </div>

            </div>


            <div class="col-12">

                <div class="info-card">

                    <div class="info-label">
                        Address
                    </div>

                    <div class="info-value">

                        ${escapeHTML(
                            getAddress(
                                order
                            )
                        )}

                    </div>

                </div>

            </div>

        </div>



        <h5 class="fw-bold mb-3">

            <i class="bi bi-tools text-primary"></i>

            Services

        </h5>


        <div class="mb-4">

            ${
                getServices(
                    order
                ).length

                ?

                getServices(
                    order
                )
                .map(
                    function (
                        service
                    ) {

                        return `

                            <div class="order-box">

                                <div
                                    class="d-flex justify-content-between">

                                    <div>

                                        <strong>

                                            ${escapeHTML(
                                                service.name
                                            )}

                                        </strong>


                                        ${
                                            service.quantity
                                                ? `
                                                    <div class="small text-muted">

                                                        Quantity:
                                                        ${service.quantity}

                                                    </div>
                                                  `
                                                : ""
                                        }

                                    </div>


                                    ${
                                        service.amount
                                            ? `

                                                <strong class="amount">

                                                    ₹${money(
                                                        service.amount
                                                    )}

                                                </strong>

                                              `
                                            : ""
                                    }

                                </div>

                            </div>

                        `;

                    }
                ).join("")

                :

                `

                    <div class="alert alert-light">

                        No individual service information found.

                    </div>

                `

            }

        </div>



        <h5 class="fw-bold mb-3">

            <i class="bi bi-credit-card text-primary"></i>

            Payment & Status

        </h5>


        <div class="row g-3 mb-4">


            <div class="col-md-4">

                <div class="info-card">

                    <div class="info-label">
                        Status
                    </div>

                    <div>

                        ${statusBadge(
                            getStatus(
                                order
                            )
                        )}

                    </div>

                </div>

            </div>


            <div class="col-md-4">

                <div class="info-card">

                    <div class="info-label">
                        Order Date
                    </div>

                    <div class="info-value">

                        ${
                            getDate(order)
                                ? formatDate(
                                    getDate(order)
                                )
                                : "-"
                        }

                    </div>

                </div>

            </div>


            <div class="col-md-4">

                <div class="info-card">

                    <div class="info-label">
                        Order ID
                    </div>

                    <div class="info-value">

                        ${escapeHTML(
                            order.id
                        )}

                    </div>

                </div>

            </div>

        </div>



        <div class="total-box">

            <div class="d-flex justify-content-between">

                <div>

                    <div class="text-muted">

                        TOTAL BILL

                    </div>

                    <strong>

                        ₹${money(
                            getAmount(
                                order
                            )
                        )}

                    </strong>

                </div>


                <div>

                    ${statusBadge(
                        getStatus(
                            order
                        )
                    )}

                </div>

            </div>

        </div>

    `;


    detailsModal.show();

}


// ======================================================
// SEARCH
// ======================================================

function filterOrders(
    orders
) {

    let result =
        [...orders];


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    if (search) {

        result =
            result.filter(
                function (order) {

                    const name =
                        getCustomerName(
                            order
                        )
                            .toLowerCase();


                    const mobile =
                        getMobile(
                            order
                        )
                            .toLowerCase();


                    const id =
                        String(
                            order.id
                        )
                            .toLowerCase();


                    return (

                        name.includes(search) ||

                        mobile.includes(search) ||

                        id.includes(search)

                    );

                }
            );

    }


    const filter =
        statusFilter.value;


    if (
        filter === "paid"
    ) {

        result =
            result.filter(
                isPaid
            );

    }


    if (
        filter === "pending"
    ) {

        result =
            result.filter(
                function (order) {

                    return !isPaid(
                        order
                    );

                }
            );

    }


    return result;

}


// ======================================================
// SEARCH WITHOUT STATUS
// ======================================================

function filterOrdersWithoutStatus(
    orders
) {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!search) {

        return orders;

    }


    return orders.filter(
        function (order) {

            return (

                getCustomerName(
                    order
                )
                .toLowerCase()
                .includes(search)

                ||

                getMobile(
                    order
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    order.id
                )
                .toLowerCase()
                .includes(search)

            );

        }
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

        order.phone ||

        "-"

    );

}


// ======================================================
// ADDRESS
// ======================================================

function getAddress(
    order
) {

    return String(

        order.address ||

        order.customerAddress ||

        "-"

    );

}


// ======================================================
// AMOUNT
// ======================================================

function getAmount(
    order
) {

    const values = [

        order.grandTotal,

        order.totalAmount,

        order.total,

        order.amount,

        order.billAmount

    ];


    for (
        const value of values
    ) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            const number =
                Number(
                    String(value)
                        .replace(
                            /[₹,\s]/g,
                            ""
                        )
                );


            if (
                Number.isFinite(
                    number
                )
            ) {

                return number;

            }

        }

    }


    return 0;

}


// ======================================================
// PAID AMOUNT
// ======================================================

function getPaidAmount(
    order
) {

    const values = [

        order.paidAmount,

        order.amountPaid,

        order.paymentAmount

    ];


    for (
        const value of values
    ) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            const number =
                Number(
                    String(value)
                        .replace(
                            /[₹,\s]/g,
                            ""
                        )
                );


            if (
                Number.isFinite(
                    number
                )
            ) {

                return number;

            }

        }

    }


    return getAmount(
        order
    );

}


// ======================================================
// STATUS
// ======================================================

function getStatus(
    order
) {

    return String(

        order.paymentStatus ||

        order.payment_status ||

        order.status ||

        "Pending"

    )
        .trim()
        .toLowerCase();

}


// ======================================================
// PAID CHECK
// ======================================================

function isPaid(
    order
) {

    const status =
        getStatus(
            order
        );


    return (

        status === "paid" ||

        status === "success" ||

        status === "successful" ||

        status === "completed" ||

        status === "complete"

    );

}


// ======================================================
// SERVICES
// ======================================================

function getServices(
    order
) {

    const data =

        order.services ||

        order.selectedServices ||

        order.serviceData ||

        [];


    if (
        Array.isArray(data)
    ) {

        return data.map(
            function (
                service
            ) {

                if (
                    typeof service ===
                    "string"
                ) {

                    return {

                        name:
                            service,

                        quantity:
                            "",

                        amount:
                            0

                    };

                }


                return {

                    name:

                        service.name ||

                        service.serviceName ||

                        service.title ||

                        service.service ||

                        "Service",

                    quantity:

                        service.quantity ||

                        service.qty ||

                        "",

                    amount:

                        Number(
                            service.amount ||

                            service.price ||

                            service.total ||

                            0
                        )

                };

            }
        );

    }


    if (
        typeof data ===
        "object" &&
        data !== null
    ) {

        return Object.entries(
            data
        ).map(
            function (
                [key, value]
            ) {

                if (
                    typeof value ===
                    "object" &&
                    value !== null
                ) {

                    return {

                        name:
                            value.name ||
                            key,

                        quantity:
                            value.quantity ||
                            value.qty ||
                            "",

                        amount:
                            Number(
                                value.amount ||
                                value.price ||
                                value.total ||
                                0
                            )

                    };

                }


                return {

                    name:
                        key,

                    quantity:
                        value,

                    amount:
                        0

                };

            }
        );

    }


    return [];

}


// ======================================================
// DATE
// ======================================================

function getDate(
    order
) {

    const value =

        order.createdAt ||

        order.date ||

        order.orderDate ||

        order.billDate;


    if (!value) {

        return null;

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    if (
        typeof value ===
        "object" &&
        value.seconds
    ) {

        return new Date(
            value.seconds * 1000
        );

    }


    if (
        typeof value ===
        "string" &&
        /^\d{2}\/\d{2}\/\d{4}$/.test(
            value
        )
    ) {

        const p =
            value.split("/");


        return new Date(

            Number(p[2]),

            Number(p[1]) - 1,

            Number(p[0])

        );

    }


    const date =
        new Date(
            value
        );


    if (
        !isNaN(
            date.getTime()
        )
    ) {

        return date;

    }


    return null;

}


// ======================================================
// SERVICE HTML
// ======================================================

function renderServices(
    order
) {

    const services =
        getServices(
            order
        );


    if (
        services.length === 0
    ) {

        return "-";

    }


    return services
        .slice(0, 4)
        .map(
            function (
                service
            ) {

                return `

                    <span class="service-badge">

                        ${escapeHTML(
                            service.name
                        )}

                    </span>

                `;

            }
        )
        .join("");

}


// ======================================================
// STATUS BADGE
// ======================================================

function statusBadge(
    status
) {

    const value =
        String(
            status ||
            "pending"
        ).toLowerCase();


    if (
        value === "paid" ||
        value === "success" ||
        value === "successful" ||
        value === "completed" ||
        value === "complete"
    ) {

        return `

            <span class="status paid">

                <i class="bi bi-check-circle-fill"></i>

                Paid

            </span>

        `;

    }


    if (
        value === "cancelled" ||
        value === "canceled"
    ) {

        return `

            <span class="status cancelled">

                <i class="bi bi-x-circle-fill"></i>

                Cancelled

            </span>

        `;

    }


    return `

        <span class="status pending">

            <i class="bi bi-hourglass-split"></i>

            Pending

        </span>

    `;

}


// ======================================================
// FORMAT MONEY
// ======================================================

function money(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2

        }
    );

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
    date
) {

    return date.toLocaleDateString(
        "en-IN",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"

        }
    );

}


// ======================================================
// SUMMARY
// ======================================================

function updateSummary(
    count,
    amount
) {

    recordCount.textContent =
        count;


    displayValue.textContent =
        "₹" +
        money(
            amount
        );

}


// ======================================================
// LOADING
// ======================================================

function showLoading() {

    tableContainer.innerHTML = `

        <div class="loading">

            <div
                class="spinner-border text-primary">
            </div>

            <div class="mt-3">

                Loading Firestore data...

            </div>

        </div>

    `;

}


// ======================================================
// EMPTY
// ======================================================

function showEmpty(
    icon,
    title,
    message
) {

    tableContainer.innerHTML = `

        <div class="empty">

            <i class="bi ${icon}"></i>

            <h5 class="mt-3">

                ${title}

            </h5>

            <p>

                ${message}

            </p>

        </div>

    `;

}


// ======================================================
// ERROR
// ======================================================

function showError(
    error
) {

    tableContainer.innerHTML = `

        <div class="alert alert-danger m-3">

            <h5>

                <i class="bi bi-exclamation-triangle-fill"></i>

                Firebase Error

            </h5>


            <p class="mb-0">

                ${escapeHTML(
                    error.message ||
                    "Unable to load orders."
                )}

            </p>

        </div>

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


// ======================================================
// EVENTS
// ======================================================

searchInput.addEventListener(
    "input",
    renderPage
);


statusFilter.addEventListener(
    "change",
    renderPage
);


// ======================================================
// INITIALIZE
// ======================================================

setupPage();
