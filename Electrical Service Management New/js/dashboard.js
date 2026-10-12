// ======================================================
// DASHBOARD.JS
// Shree Electrical Service
// FIRESTORE REAL-TIME DASHBOARD
// ======================================================

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    db,
    auth
} from "./firebase.js";


// ======================================================
// ELEMENTS
// ======================================================

const totalCustomers =
    document.getElementById("totalCustomers");

const totalOrders =
    document.getElementById("totalOrders");

const totalRevenue =
    document.getElementById("totalRevenue");

const pendingPayments =
    document.getElementById("pendingPayments");

const recentOrders =
    document.getElementById("recentOrders");

const liveActivityFeed =
    document.getElementById("liveActivityFeed");

const graphOrders =
    document.getElementById("graphOrders");

const graphRevenue =
    document.getElementById("graphRevenue");

const graphPending =
    document.getElementById("graphPending");

const activityOrderCount =
    document.getElementById("activityOrderCount");

const activityRevenue =
    document.getElementById("activityRevenue");

const activityActionCount =
    document.getElementById("activityActionCount");

const lastActionTime =
    document.getElementById("lastActionTime");

const activityFeedCount =
    document.getElementById("activityFeedCount");

const activityRange =
    document.getElementById("activityRange");

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================================
// VARIABLES
// ======================================================

let allCustomers = [];

let allOrders = [];

let activityChart = null;


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    console.log(
        "Dashboard logged in:",
        user.email
    );

    loadCustomers();

    loadOrders();

});


// ======================================================
// LOAD CUSTOMERS
// ======================================================
// IMPORTANT:
// Dashboard customer count comes directly from
// Firestore "customers" collection.
// Therefore Yuvi will be counted even when Yuvi
// has 0 orders.
// ======================================================

function customerKey(c) {

    const mobile = String(
        c.mobile || c.phone || c.customerMobile || c.customer_mobile ||
        (c.customer && c.customer.mobile) || ""
    ).replace(/\s+/g, "").trim();

    const name = String(
        c.name || c.customerName || c.customer_name || ""
    ).trim().toLowerCase();

    return mobile && mobile !== "-" ? "mobile:" + mobile : "name:" + name;

}

// Unique customers = customers collection + customers who ordered
function updateCustomerCount() {

    if (!totalCustomers) return;

    const keys = new Set();

    allCustomers.forEach((c) => keys.add(customerKey(c)));
    allOrders.forEach((o) => keys.add(customerKey(o)));

    totalCustomers.textContent = keys.size;

}

function loadCustomers() {

    onSnapshot(
        collection(db, "customers"),

        (snapshot) => {

            allCustomers = [];

            snapshot.forEach((docSnap) => {

                allCustomers.push({

                    id: docSnap.id,

                    ...docSnap.data()

                });

            });


            console.log(
                "CUSTOMERS:",
                allCustomers
            );


            // ------------------------------------------
            // CORRECT CUSTOMER COUNT
            // ------------------------------------------

            if (totalCustomers) {

                updateCustomerCount();

            }


            console.log(
                "TOTAL CUSTOMERS:",
                allCustomers.length
            );

        },

        (error) => {

            console.error(
                "Customers Firestore Error:",
                error
            );

            if (totalCustomers) {

                totalCustomers.textContent =
                    "0";

            }

        }
    );

}


// ======================================================
// LOAD ORDERS
// ======================================================

function loadOrders() {

    onSnapshot(
        collection(db, "orders"),

        (snapshot) => {

            allOrders = [];

            snapshot.forEach((docSnap) => {

                allOrders.push({

                    id: docSnap.id,

                    ...docSnap.data()

                });

            });


            console.log(
                "ORDERS:",
                allOrders
            );


            updateDashboard();

            updateCustomerCount();

        },

        (error) => {

            console.error(
                "Orders Firestore Error:",
                error
            );


            showOrderError(error);

        }
    );

}


// ======================================================
// UPDATE DASHBOARD
// ======================================================

function updateDashboard() {

    updateStatistics();

    renderRecentOrders();

    renderActivity();

}


// ======================================================
// STATISTICS
// ======================================================

function updateStatistics() {

    // ----------------------------------------------
    // TOTAL ORDERS
    // ----------------------------------------------

    if (totalOrders) {

        totalOrders.textContent =
            allOrders.length;

    }


    // ----------------------------------------------
    // REVENUE
    // ----------------------------------------------

    let revenue = 0;

    let pendingAmount = 0;

    let pendingCount = 0;


    allOrders.forEach((order) => {

        const amount =
            getAmount(order);


        if (isPaid(order)) {

            revenue += amount;

        } else {

            pendingAmount += amount;

            pendingCount++;

        }

    });


    // ----------------------------------------------
    // TOTAL REVENUE
    // ----------------------------------------------

    if (totalRevenue) {

        totalRevenue.textContent =
            formatCurrency(revenue);

    }


    // ----------------------------------------------
    // PENDING BILLS
    // ----------------------------------------------

    if (pendingPayments) {

        pendingPayments.textContent =
            pendingCount;

    }


    console.log(
        "Dashboard Stats:",
        {

            customers:
                allCustomers.length,

            orders:
                allOrders.length,

            revenue:
                revenue,

            pendingBills:
                pendingCount,

            pendingAmount:
                pendingAmount

        }
    );

}


// ======================================================
// RECENT ORDERS
// ======================================================

function renderRecentOrders() {

    if (!recentOrders) {

        return;

    }


    if (allOrders.length === 0) {

        recentOrders.innerHTML = `

            <div class="text-center py-5">

                <i class="bi bi-receipt fs-1 text-secondary"></i>

                <p class="mt-3 mb-0">

                    No orders found.

                </p>

            </div>

        `;

        return;

    }


    const sortedOrders =
        [...allOrders]
            .sort(
                (a, b) => {

                    return (
                        getDate(
                            b.createdAt ||
                            b.date
                        )?.getTime() || 0
                    )
                    -
                    (
                        getDate(
                            a.createdAt ||
                            a.date
                        )?.getTime() || 0
                    );

                }
            )
            .slice(0, 8);


    recentOrders.innerHTML = "";


    sortedOrders.forEach((order) => {

        const amount =
            getAmount(order);

        const paid =
            isPaid(order);

        const name =
            getCustomerName(order);

        const mobile =
            getMobile(order);

        const invoice =
            order.invoiceNumber ||
            order.invoice ||
            order.id;

        const date =
            getDate(
                order.createdAt ||
                order.date
            );


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <strong>

                    ${escapeHTML(
                        name
                    )}

                </strong>

                <br>

                <small class="text-muted">

                    ${escapeHTML(
                        mobile
                    )}

                </small>

            </td>


            <td>

                <span class="invoice-badge">

                    ${escapeHTML(
                        invoice
                    )}

                </span>

            </td>


            <td>

                <strong>

                    ₹${formatNumber(
                        amount
                    )}

                </strong>

            </td>


            <td>

                <span
                    class="status-badge
                    ${paid
                        ? "status-paid"
                        : "status-pending"
                    }">

                    ${paid
                        ? "Paid"
                        : "Pending"
                    }

                </span>

            </td>


            <td>

                <span class="method-badge">

                    ${escapeHTML(
                        order.paymentMethod ||
                        "-"
                    )}

                </span>

            </td>


            <td>

                ${date
                    ? formatDate(date)
                    : "-"
                }

            </td>

        `;


        recentOrders.appendChild(row);

    });

}


// ======================================================
// ACTIVITY
// ======================================================

function renderActivity() {

    const range =
        getActivityRange();


    const now =
        new Date();


    const start =
        new Date(now);


    start.setDate(
        now.getDate() - range
    );


    const filteredOrders =
        allOrders.filter(
            (order) => {

                const date =
                    getDate(
                        order.createdAt ||
                        order.date
                    );


                return (
                    date &&
                    date >= start
                );

            }
        );


    let revenue = 0;

    let pending = 0;


    filteredOrders.forEach(
        (order) => {

            const amount =
                getAmount(order);


            if (isPaid(order)) {

                revenue += amount;

            } else {

                pending++;

            }

        }
    );


    // ----------------------------------------------
    // ACTIVITY COUNTERS
    // ----------------------------------------------

    if (activityOrderCount) {

        activityOrderCount.textContent =
            filteredOrders.length;

    }


    if (activityRevenue) {

        activityRevenue.textContent =
            formatCurrency(revenue);

    }


    if (activityActionCount) {

        activityActionCount.textContent =
            pending;

    }


    if (activityFeedCount) {

        activityFeedCount.textContent =
            filteredOrders.length;

    }


    if (lastActionTime) {

        lastActionTime.textContent =
            new Date().toLocaleTimeString(
                "en-IN",
                {

                    hour: "2-digit",

                    minute: "2-digit"

                }
            );

    }


    renderChart(
        filteredOrders
    );


    renderActivityFeed(
        filteredOrders
    );

}


// ======================================================
// ACTIVITY RANGE
// ======================================================

if (activityRange) {

    activityRange.addEventListener(
        "change",
        renderActivity
    );

}


// ======================================================
// RANGE
// ======================================================

function getActivityRange() {

    if (!activityRange) {

        return 30;

    }


    const value =
        Number(
            activityRange.value
        );


    return Number.isFinite(value)
        ? value
        : 30;

}


// ======================================================
// CHART
// ======================================================

function renderChart(
    orders
) {

    const canvas =
        document.getElementById(
            "serviceActivityChart"
        );


    if (!canvas) {

        return;

    }


    const range =
        getActivityRange();


    const labels = [];

    const orderData = [];

    const revenueData = [];

    const pendingData = [];


    for (
        let i = range - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date();


        date.setHours(
            0,
            0,
            0,
            0
        );


        date.setDate(
            date.getDate() - i
        );


        labels.push(
            date.toLocaleDateString(
                "en-IN",
                {

                    day: "2-digit",

                    month: "short"

                }
            )
        );


        let dailyOrders = 0;

        let dailyRevenue = 0;

        let dailyPending = 0;


        orders.forEach((order) => {

            const orderDate =
                getDate(
                    order.createdAt ||
                    order.date
                );


            if (!orderDate) {

                return;

            }


            if (
                orderDate.getFullYear()
                ===
                date.getFullYear()
                &&
                orderDate.getMonth()
                ===
                date.getMonth()
                &&
                orderDate.getDate()
                ===
                date.getDate()
            ) {

                dailyOrders++;


                const amount =
                    getAmount(order);


                if (isPaid(order)) {

                    dailyRevenue +=
                        amount;

                } else {

                    dailyPending++;

                }

            }

        });


        orderData.push(
            dailyOrders
        );

        revenueData.push(
            dailyRevenue
        );

        pendingData.push(
            dailyPending
        );

    }


    if (activityChart) {

        activityChart.destroy();

    }


    activityChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels,

                    datasets: [

                        {

                            label: "Orders",

                            data: orderData,

                            borderWidth: 1,

                            yAxisID: "y"

                        },

                        {

                            type: "line",

                            label: "Revenue",

                            data: revenueData,

                            borderWidth: 3,

                            tension: 0.35,

                            yAxisID:
                                "revenue"

                        },

                        {

                            type: "line",

                            label: "Pending Bills",

                            data: pendingData,

                            borderWidth: 2,

                            tension: 0.35,

                            yAxisID: "y"

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {

                        mode: "index",

                        intersect: false

                    },

                    plugins: {

                        legend: {

                            display: true

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            title: {

                                display: true,

                                text: "Orders"

                            }

                        },

                        revenue: {

                            beginAtZero: true,

                            position: "right",

                            grid: {

                                drawOnChartArea:
                                    false

                            },

                            title: {

                                display: true,

                                text: "Revenue (₹)"

                            }

                        }

                    }

                }

            }
        );

}


// ======================================================
// ACTIVITY FEED
// ======================================================

function renderActivityFeed(
    orders
) {

    if (!liveActivityFeed) {

        return;

    }


    const sorted =
        [...orders]
            .sort(
                (a, b) => {

                    return (
                        getDate(
                            b.createdAt ||
                            b.date
                        )?.getTime() || 0
                    )
                    -
                    (
                        getDate(
                            a.createdAt ||
                            a.date
                        )?.getTime() || 0
                    );

                }
            )
            .slice(0, 8);


    if (sorted.length === 0) {

        liveActivityFeed.innerHTML = `

            <div class="text-center py-4">

                No recent activity.

            </div>

        `;

        return;

    }


    liveActivityFeed.innerHTML = "";


    sorted.forEach((order) => {

        const name =
            getCustomerName(order);

        const amount =
            getAmount(order);

        const paid =
            isPaid(order);

        const date =
            getDate(
                order.createdAt ||
                order.date
            );


        const item =
            document.createElement("div");


        item.className =
            "activity-feed-item";


        item.innerHTML = `

            <div>

                <strong>

                    ${escapeHTML(
                        name
                    )}

                </strong>

                <div class="small text-muted">

                    ${paid
                        ? "Payment verified"
                        : "Payment pending"
                    }

                    •

                    ₹${formatNumber(
                        amount
                    )}

                </div>

            </div>


            <small class="text-muted">

                ${date
                    ? formatDate(date)
                    : "-"
                }

            </small>

        `;


        liveActivityFeed.appendChild(
            item
        );

    });

}


// ======================================================
// PAYMENT CHECK
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
// AMOUNT
// ======================================================

function getAmount(
    order
) {

    const fields = [

        order.grandTotal,

        order.totalAmount,

        order.amount,

        order.billAmount,

        order.total,

        order.invoiceAmount

    ];


    for (
        const value
        of fields
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

    ).trim();

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


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return new Date(
            value.seconds * 1000
        );

    }


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


    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

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

            month: "short",

            year: "numeric"

        }
    );

}


// ======================================================
// FORMAT NUMBER
// ======================================================

function formatNumber(
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
// FORMAT CURRENCY
// ======================================================

function formatCurrency(
    value
) {

    return "₹" +
        formatNumber(value);

}


// ======================================================
// ERROR
// ======================================================

function showOrderError(
    error
) {

    if (!recentOrders) {

        return;

    }


    recentOrders.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="text-center text-danger py-4">

                <i class="bi bi-database-x"></i>

                <br>

                Firestore Error:

                ${escapeHTML(
                    error.message
                )}

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


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

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