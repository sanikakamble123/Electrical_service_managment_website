// ======================================================
// HISTORY.JS
// Shree Electrical Service
// CUSTOMER DETAILS + SERVICES + SERVICE STATUS
// ======================================================

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    db,
    auth
} from "./firebase.js";


// ======================================================
// ELEMENTS
// ======================================================

const searchBox =
    document.getElementById("searchBox");

const statusFilter =
    document.getElementById("statusFilter");

const dateFilter =
    document.getElementById("dateFilter");

const refreshBtn =
    document.getElementById("refreshBtn");

const historyTable =
    document.getElementById("historyTable");

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================================
// MODAL ELEMENTS
// ======================================================

const customerDetailsModalElement =
    document.getElementById("customerDetailsModal");

const customerDetailsModal =
    customerDetailsModalElement
        ? new bootstrap.Modal(customerDetailsModalElement)
        : null;


// ======================================================
// ALL ORDERS
// ======================================================

let allOrders = [];


// ======================================================
// START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "History page started."
        );

        loadAllOrders();

    }
);


// ======================================================
// LOAD ALL ORDERS
// ======================================================

async function loadAllOrders() {

    if (!historyTable) {

        console.error(
            "historyTable was not found."
        );

        return;

    }


    showLoading();


    try {

        console.log(
            "Connecting to Firestore..."
        );


        const ordersCollection =
            collection(
                db,
                "orders"
            );


        const snapshot =
            await getDocs(
                ordersCollection
            );


        console.log(
            "Total Firestore records:",
            snapshot.size
        );


        allOrders = [];


        snapshot.forEach(
            function (documentSnapshot) {

                const data =
                    documentSnapshot.data();


                allOrders.push({

                    id:
                        documentSnapshot.id,

                    ...data

                });


                console.log(
                    "Order loaded:",
                    documentSnapshot.id,
                    data
                );

            }
        );


        console.log(
            "All history:",
            allOrders
        );


        renderOrders(
            allOrders
        );


    } catch (error) {

        console.error(
            "Firestore error:",
            error
        );


        showError(
            error
        );

    }

}


// ======================================================
// RENDER ORDERS
// ======================================================

function renderOrders(
    orders
) {

    if (!historyTable) {
        return;
    }


    let filtered =
        [...orders];


    // ==================================================
    // SEARCH
    // ==================================================

    const search =
        searchBox
            ? searchBox.value
                .trim()
                .toLowerCase()
            : "";


    if (search) {

        filtered =
            filtered.filter(
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


                    return (

                        name.includes(
                            search
                        ) ||

                        mobile.includes(
                            search
                        )

                    );

                }
            );

    }


    // ==================================================
    // STATUS
    // ==================================================

    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .trim()
                .toLowerCase()
            : "";


    if (selectedStatus) {

        filtered =
            filtered.filter(
                function (order) {

                    const status =
                        getStatus(
                            order
                        );


                    if (
                        selectedStatus ===
                        "success"
                    ) {

                        return (

                            status === "success" ||

                            status === "successful" ||

                            status === "paid" ||

                            status === "completed" ||

                            status === "complete"

                        );

                    }


                    if (
                        selectedStatus ===
                        "pending"
                    ) {

                        return (
                            status === "pending"
                        );

                    }


                    return (
                        status ===
                        selectedStatus
                    );

                }
            );

    }


    // ==================================================
    // DATE
    // ==================================================

    if (
        dateFilter &&
        dateFilter.value
    ) {

        const selectedDate =
            dateFilter.value;


        filtered =
            filtered.filter(
                function (order) {

                    const date =
                        getOrderDate(
                            order
                        );


                    if (!date) {
                        return false;
                    }


                    const year =
                        date.getFullYear();


                    const month =
                        String(
                            date.getMonth() + 1
                        )
                        .padStart(
                            2,
                            "0"
                        );


                    const day =
                        String(
                            date.getDate()
                        )
                        .padStart(
                            2,
                            "0"
                        );


                    const formatted =
                        `${year}-${month}-${day}`;


                    return (
                        formatted ===
                        selectedDate
                    );

                }
            );

    }


    // ==================================================
    // SORT NEWEST FIRST
    // ==================================================

    filtered.sort(
        function (a, b) {

            const dateA =
                getOrderDate(a);

            const dateB =
                getOrderDate(b);


            if (!dateA && !dateB) {
                return 0;
            }

            if (!dateA) {
                return 1;
            }

            if (!dateB) {
                return -1;
            }


            return (
                dateB.getTime() -
                dateA.getTime()
            );

        }
    );


    // ==================================================
    // NO DATA
    // ==================================================

    if (
        filtered.length === 0
    ) {

        historyTable.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="loading-box">

                        <i class="bi bi-inbox empty-icon"></i>

                        <div>
                            No Orders Found
                        </div>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    // ==================================================
    // CLEAR TABLE
    // ==================================================

    historyTable.innerHTML = "";


    // ==================================================
    // DISPLAY RECORDS
    // ==================================================

    filtered.forEach(
        function (order, index) {

            const name =
                getCustomerName(
                    order
                );


            const mobile =
                getMobile(
                    order
                );


            const amount =
                getBillAmount(
                    order
                );


            const status =
                getStatus(
                    order
                );


            const date =
                getOrderDate(
                    order
                );


            const dateText =
                date
                    ? formatDate(date)
                    : getRawDate(order);


            const statusHTML =
                createStatusBadge(
                    status
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>


                <td>

                    <button
                        type="button"
                        class="customer-name-btn customer-details-btn"
                        data-id="${escapeHTML(order.id)}">

                        <i class="bi bi-person-circle me-1"></i>

                        ${escapeHTML(name)}

                    </button>

                </td>


                <td>
                    ${escapeHTML(mobile)}
                </td>


                <td class="amount">

                    ₹${formatMoney(amount)}

                </td>


                <td>

                    ${statusHTML}

                </td>


                <td>

                    ${escapeHTML(dateText)}

                </td>


                <td>

                    <button
                        type="button"
                        class="btn btn-primary btn-sm action-btn customer-details-btn"
                        data-id="${escapeHTML(order.id)}">

                        <i class="bi bi-eye"></i>
                        View

                    </button>


                    <button
                        type="button"
                        class="btn btn-danger btn-sm action-btn delete-btn"
                        data-id="${escapeHTML(order.id)}">

                        <i class="bi bi-trash"></i>
                        Delete

                    </button>

                </td>

            `;


            historyTable.appendChild(
                row
            );

        }
    );


    // ==================================================
    // DETAILS EVENTS
    // ==================================================

    const detailButtons =
        document.querySelectorAll(
            ".customer-details-btn"
        );


    detailButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const orderId =
                        button.dataset.id;


                    openCustomerDetails(
                        orderId
                    );

                }
            );

        }
    );


    // ==================================================
    // DELETE EVENTS
    // ==================================================

    const deleteButtons =
        document.querySelectorAll(
            ".delete-btn"
        );


    deleteButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    deleteOrder(
                        button.dataset.id
                    );

                }
            );

        }
    );

}


// ======================================================
// OPEN CUSTOMER DETAILS
// ======================================================

function openCustomerDetails(
    orderId
) {

    const order =
        allOrders.find(
            function (item) {

                return (
                    item.id ===
                    orderId
                );

            }
        );


    if (!order) {

        alert(
            "Customer record not found."
        );

        return;

    }


    console.log(
        "Selected customer:",
        order
    );


    // ==================================================
    // BASIC INFORMATION
    // ==================================================

    const name =
        getCustomerName(order);

    const mobile =
        getMobile(order);

    const address =
        getAddress(order);

    const amount =
        getBillAmount(order);

    const paymentStatus =
        getStatus(order);

    const date =
        getOrderDate(order);


    setText(
        "modalCustomerName",
        name
    );


    setText(
        "modalCustomerSubtitle",
        `${mobile} • Customer Order`
    );


    setText(
        "modalName",
        name
    );


    setText(
        "modalMobile",
        mobile
    );


    setText(
        "modalAddress",
        address
    );


    setText(
        "modalOrderId",
        order.invoiceNumber ||
        order.invoice ||
        order.orderNumber ||
        order.id ||
        "-"
    );


    setText(
        "modalDate",
        date
            ? formatDate(date)
            : getRawDate(order)
    );


    document.getElementById(
        "modalPaymentStatus"
    ).innerHTML =
        createStatusBadge(
            paymentStatus
        );


    setText(
        "modalTotal",
        `₹${formatMoney(amount)}`
    );


    // ==================================================
    // SERVICES
    // ==================================================

    renderServices(
        order
    );


    // ==================================================
    // SHOW MODAL
    // ==================================================

    if (customerDetailsModal) {

        customerDetailsModal.show();

    }

}


// ======================================================
// RENDER SERVICES
// ======================================================

function renderServices(
    order
) {

    const container =
        document.getElementById(
            "modalServices"
        );


    if (!container) {
        return;
    }


    const services =
        getServices(
            order
        );


    if (
        !services ||
        services.length === 0
    ) {

        container.innerHTML = `

            <div class="text-center text-muted py-4">

                <i
                    class="bi bi-tools"
                    style="font-size:40px;">
                </i>

                <div class="mt-2">
                    No service details found for this order.
                </div>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    services.forEach(
        function (service, index) {

            const serviceData =
                normalizeService(
                    service,
                    order
                );


            const serviceStatus =
                normalizeServiceStatus(
                    serviceData.status
                );


            const statusClass =
                getServiceStatusClass(
                    serviceStatus
                );


            const serviceHTML = `

                <div class="service-card">

                    <div
                        class="d-flex align-items-center justify-content-between gap-3 flex-wrap">

                        <div
                            class="d-flex align-items-center gap-3">

                            <div class="service-icon">

                                <i class="bi bi-lightning-charge-fill"></i>

                            </div>


                            <div>

                                <div class="service-name">

                                    ${escapeHTML(
                                        serviceData.name ||
                                        `Service ${index + 1}`
                                    )}

                                </div>


                                <div class="service-qty">

                                    Quantity:
                                    ${escapeHTML(
                                        String(
                                            serviceData.quantity
                                        )
                                    )}

                                </div>

                            </div>

                        </div>


                        <div class="text-end">

                            <div class="service-price">

                                ₹${formatMoney(
                                    serviceData.price
                                )}

                            </div>


                            <span
                                class="service-status ${statusClass}">

                                ${getStatusIcon(
                                    serviceStatus
                                )}

                                ${escapeHTML(
                                    capitalizeWords(
                                        serviceStatus
                                    )
                                )}

                            </span>

                        </div>

                    </div>

                </div>

            `;


            container.insertAdjacentHTML(
                "beforeend",
                serviceHTML
            );

        }
    );

}


// ======================================================
// GET SERVICES
// ======================================================

function getServices(
    order
) {

    const possibleServices = [

        order.services,

        order.selectedServices,

        order.serviceData,

        order.serviceDetails,

        order.items,

        order.serviceItems

    ];


    for (
        const value of possibleServices
    ) {

        if (!value) {
            continue;
        }


        // Array

        if (
            Array.isArray(value)
        ) {

            return value;

        }


        // Object

        if (
            typeof value === "object"
        ) {

            return Object.entries(
                value
            ).map(
                function ([key, item]) {

                    if (
                        typeof item === "object" &&
                        item !== null
                    ) {

                        return {
                            ...item,
                            _serviceKey: key
                        };

                    }


                    return {

                        name: key,

                        quantity: item

                    };

                }
            );

        }

    }


    // ==================================================
    // FALLBACK
    // ==================================================

    // Supports records where individual services
    // are stored directly on the order document.

    const fallback = [];


    const serviceNames = [

        "Light Fan",
        "Power Plug",
        "AC",
        "Geyser",
        "Earthing",
        "MCB Installation"

    ];


    serviceNames.forEach(
        function (serviceName) {

            const key =
                serviceName
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9]+/g,
                        "_"
                    );


            const quantity =
                order[key] ??
                order[
                    serviceName
                ];


            if (
                quantity !== undefined &&
                quantity !== null &&
                quantity !== ""
            ) {

                fallback.push({

                    name:
                        serviceName,

                    quantity:
                        quantity,

                    price:
                        0,

                    status:
                        order[
                            `${key}Status`
                        ] ||
                        order.serviceStatus ||
                        order.status

                });

            }

        }
    );


    return fallback;

}


// ======================================================
// NORMALIZE SERVICE
// ======================================================

function normalizeService(
    service,
    order
) {

    // Primitive service

    if (
        typeof service !== "object" ||
        service === null
    ) {

        return {

            name:
                String(service),

            quantity:
                1,

            price:
                0,

            status:
                order.serviceStatus ||
                order.status ||
                "Pending"

        };

    }


    const name =
        service.name ||

        service.serviceName ||

        service.title ||

        service.service ||

        service.label ||

        service._serviceKey ||

        "Electrical Service";


    const quantity =
        service.quantity ??

        service.qty ??

        service.count ??

        service.points ??

        service.units ??

        1;


    const price =
        service.price ??

        service.amount ??

        service.total ??

        service.serviceAmount ??

        0;


    const status =
        service.status ||

        service.serviceStatus ||

        service.progress ||

        order.serviceStatus ||

        order.service_status ||

        "Pending";


    return {

        name:
            name,

        quantity:
            quantity,

        price:
            Number(
                String(price)
                    .replace(
                        /[₹,\s]/g,
                        ""
                    )
            ) || 0,

        status:
            status

    };

}


// ======================================================
// SERVICE STATUS
// ======================================================

function normalizeServiceStatus(
    status
) {

    if (
        status === undefined ||
        status === null ||
        status === ""
    ) {

        return "Pending";

    }


    return String(
        status
    )
        .trim()
        .toLowerCase();

}


// ======================================================
// SERVICE STATUS CLASS
// ======================================================

function getServiceStatusClass(
    status
) {

    const value =
        String(status)
            .toLowerCase();


    if (
        value.includes("complete") ||
        value.includes("success") ||
        value.includes("done") ||
        value.includes("finished")
    ) {

        return "completed";

    }


    if (
        value.includes("progress") ||
        value.includes("working") ||
        value.includes("started")
    ) {

        return "progress";

    }


    if (
        value.includes("cancel") ||
        value.includes("reject")
    ) {

        return "cancelled";

    }


    return "pending";

}


// ======================================================
// SERVICE STATUS ICON
// ======================================================

function getStatusIcon(
    status
) {

    const value =
        String(status)
            .toLowerCase();


    if (
        value.includes("complete") ||
        value.includes("success") ||
        value.includes("done") ||
        value.includes("finished")
    ) {

        return `<i class="bi bi-check-circle-fill"></i>`;

    }


    if (
        value.includes("progress") ||
        value.includes("working") ||
        value.includes("started")
    ) {

        return `<i class="bi bi-arrow-repeat"></i>`;

    }


    if (
        value.includes("cancel") ||
        value.includes("reject")
    ) {

        return `<i class="bi bi-x-circle-fill"></i>`;

    }


    return `<i class="bi bi-clock-fill"></i>`;

}


// ======================================================
// CUSTOMER NAME
// ======================================================

function getCustomerName(
    order
) {

    return String(

        order.customerName ||

        order.name ||

        order.customer_name ||

        (
            order.customer &&
            order.customer.name
        ) ||

        "-"

    );

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

        (
            order.customer &&
            order.customer.mobile
        ) ||

        "-"

    );

}


// ======================================================
// ADDRESS
// ======================================================

function getAddress(
    order
) {

    if (
        order.address
    ) {

        return String(
            order.address
        );

    }


    if (
        order.customerAddress
    ) {

        return String(
            order.customerAddress
        );

    }


    if (
        order.customer_address
    ) {

        return String(
            order.customer_address
        );

    }


    if (
        order.customer &&
        order.customer.address
    ) {

        return String(
            order.customer.address
        );

    }


    return "-";

}


// ======================================================
// BILL AMOUNT
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
        const value of values
    ) {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            continue;

        }


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


    return 0;

}


// ======================================================
// PAYMENT STATUS
// ======================================================

function getStatus(
    order
) {

    return String(

        order.paymentStatus ??

        order.status ??

        "Pending"

    )
        .trim()
        .toLowerCase();

}


// ======================================================
// PAYMENT STATUS BADGE
// ======================================================

function createStatusBadge(
    status
) {

    const paid =
        status === "success" ||
        status === "successful" ||
        status === "paid" ||
        status === "completed" ||
        status === "complete";


    if (paid) {

        return `

            <span
                class="status-badge bg-success text-white">

                <i class="bi bi-check-circle"></i>

                Success

            </span>

        `;

    }


    return `

        <span
            class="status-badge bg-warning text-dark">

            <i class="bi bi-clock"></i>

            Pending

        </span>

    `;

}


// ======================================================
// DATE
// ======================================================

function getOrderDate(
    order
) {

    const values = [

        order.createdAt,

        order.date,

        order.orderDate,

        order.billDate

    ];


    for (
        const value of values
    ) {

        if (!value) {
            continue;
        }


        // Firestore Timestamp

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
            /^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {

            const parts =
                value.split("-");


            return new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
            );

        }


        // DD/MM/YYYY

        if (
            typeof value === "string" &&
            /^\d{2}\/\d{2}\/\d{4}$/.test(value)
        ) {

            const parts =
                value.split("/");


            return new Date(
                Number(parts[2]),
                Number(parts[1]) - 1,
                Number(parts[0])
            );

        }


        const date =
            new Date(value);


        if (
            !isNaN(
                date.getTime()
            )
        ) {

            return date;

        }

    }


    return null;

}


// ======================================================
// RAW DATE
// ======================================================

function getRawDate(
    order
) {

    return String(

        order.date ||

        order.billDate ||

        order.orderDate ||

        "-"

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
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// ======================================================
// FORMAT MONEY
// ======================================================

function formatMoney(
    amount
) {

    return Number(
        amount || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


// ======================================================
// DELETE ORDER
// ======================================================

async function deleteOrder(
    orderId
) {

    if (!orderId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Delete this order?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "orders",
                orderId
            )
        );


        allOrders =
            allOrders.filter(
                function (order) {

                    return (
                        order.id !==
                        orderId
                    );

                }
            );


        renderOrders(
            allOrders
        );


        alert(
            "Order deleted successfully."
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        window.alert(
            "Unable to delete order.\n\n" +
            error.message
        );

    }

}


// ======================================================
// SEARCH
// ======================================================

if (searchBox) {

    searchBox.addEventListener(
        "input",
        function () {

            renderOrders(
                allOrders
            );

        }
    );

}


// ======================================================
// STATUS FILTER
// ======================================================

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        function () {

            renderOrders(
                allOrders
            );

        }
    );

}


// ======================================================
// DATE FILTER
// ======================================================

if (dateFilter) {

    dateFilter.addEventListener(
        "change",
        function () {

            renderOrders(
                allOrders
            );

        }
    );

}


// ======================================================
// REFRESH
// ======================================================

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        function () {

            loadAllOrders();

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            try {

                await signOut(
                    auth
                );


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


// ======================================================
// LOADING
// ======================================================

function showLoading() {

    historyTable.innerHTML = `

        <tr>

            <td colspan="7">

                <div class="loading-box">

                    <div class="spinner-border text-primary"></div>

                    <div class="mt-3">
                        Loading Orders...
                    </div>

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

    historyTable.innerHTML = `

        <tr>

            <td colspan="7">

                <div class="error-box">

                    <i class="bi bi-exclamation-triangle"></i>

                    <h5 class="mt-3">
                        Unable to Load History
                    </h5>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="location.reload()">

                        Try Again

                    </button>

                </div>

            </td>

        </tr>

    `;

}


// ======================================================
// SET TEXT
// ======================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value ?? "-";

    }

}


// ======================================================
// CAPITALIZE
// ======================================================

function capitalizeWords(
    value
) {

    return String(value)
        .replace(
            /\b\w/g,
            function (char) {
                return char.toUpperCase();
            }
        );

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