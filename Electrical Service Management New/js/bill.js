// ======================================================
// BILL.JS
// Shree Electrical Service
// READY TO RUN
// ======================================================

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    db,
    auth
} from "./firebase.js";


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentBillAmount = 0;
let currentOrderId = null;


// ======================================================
// DOM READY
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    loadBill();

    setupPaymentMethods();

    const saveButton =
        document.getElementById("saveBillBtn");

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveOrder
        );

    }

});


// ======================================================
// CUSTOMER DATA
// ======================================================

function getCustomerData() {

    const keys = [
        "customerData",
        "customer",
        "customerDetails",
        "customerInfo"
    ];

    let customer = null;

    for (const key of keys) {

        const data = localStorage.getItem(key);

        if (!data) continue;

        try {

            const parsed = JSON.parse(data);

            if (parsed && typeof parsed === "object") {

                customer = parsed;
                break;

            }

        } catch (error) {

            console.warn(
                "Invalid customer data:",
                key
            );

        }

    }


    if (!customer) {

        customer = {};

    }


    return {

        name:
            customer.name ||
            customer.customerName ||
            localStorage.getItem("customerName") ||
            "",

        mobile:
            customer.mobile ||
            customer.phone ||
            customer.customerMobile ||
            localStorage.getItem("customerMobile") ||
            "",

        address:
            customer.address ||
            customer.customerAddress ||
            localStorage.getItem("customerAddress") ||
            ""

    };

}


// ======================================================
// GET SELECTED SERVICES
// ======================================================

function getSelectedServices() {

    let data =
        sessionStorage.getItem("selectedServices");

    if (!data) {

        data =
            sessionStorage.getItem("currentBill");

    }


    if (!data) {

        data =
            localStorage.getItem("selectedServices");

    }


    if (!data) {

        return [];

    }


    try {

        const parsed =
            JSON.parse(data);


        if (Array.isArray(parsed)) {

            return normalizeServices(parsed);

        }


        if (
            parsed &&
            Array.isArray(parsed.services)
        ) {

            return normalizeServices(
                parsed.services
            );

        }


        if (
            parsed &&
            typeof parsed === "object"
        ) {

            if (
                parsed.service ||
                parsed.name ||
                parsed.serviceName
            ) {

                return normalizeServices(
                    [parsed]
                );

            }

        }

    } catch (error) {

        console.error(
            "Unable to read services:",
            error
        );

    }


    return [];

}


// ======================================================
// NORMALIZE SERVICES
// ======================================================

function normalizeServices(services) {

    return services.map(service => {

        const name =
            service.name ||
            service.service ||
            service.serviceName ||
            "Electrical Service";


        const quantity =
            Number(
                service.quantity ??
                service.qty ??
                service.count ??
                1
            ) || 1;


        const rate =
            Number(
                service.rate ??
                service.price ??
                service.amount ??
                service.unitPrice ??
                0
            ) || 0;


        let amount =
            Number(
                service.total ??
                service.totalAmount
            );


        if (!Number.isFinite(amount)) {

            amount =
                quantity * rate;

        }


        return {

            name,
            quantity,
            rate,
            amount

        };

    });

}


// ======================================================
// CALCULATE TOTAL
// ======================================================

function calculateTotal(services) {

    return services.reduce(
        (sum, service) =>
            sum +
            (
                Number(service.amount) || 0
            ),
        0
    );

}


// ======================================================
// LOAD BILL
// ======================================================

function loadBill() {

    const customer =
        getCustomerData();


    const services =
        getSelectedServices();


    const total =
        calculateTotal(services);


    currentBillAmount =
        total;


    // Customer

    setText(
        "customerName",
        customer.name || "Not Available"
    );

    setText(
        "customerMobile",
        customer.mobile || "Not Available"
    );

    setText(
        "customerAddress",
        customer.address || "Not Available"
    );


    // Invoice

    const invoiceNumber =
        generateInvoiceNumber();

    setText(
        "invoiceNumber",
        invoiceNumber
    );


    setText(
        "invoiceDate",
        formatDate(new Date())
    );


    // Services

    displayServices(services);


    // Total

    setText(
        "grandTotal",
        total.toFixed(2)
    );


    // UPI

    updateUPIPayment(total);

}


// ======================================================
// DISPLAY SERVICES
// ======================================================

function displayServices(services) {

    const tbody =
        document.getElementById("billItems");


    if (!tbody) return;


    tbody.innerHTML = "";


    if (!services.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5"
                    class="text-center text-muted">
                    No services selected
                </td>
            </tr>
        `;

        return;

    }


    services.forEach(
        (service, index) => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(service.name)}
                </td>

                <td>
                    ${service.quantity}
                </td>

                <td>
                    ₹${service.rate.toFixed(2)}
                </td>

                <td>
                    ₹${service.amount.toFixed(2)}
                </td>

            `;


            tbody.appendChild(row);

        }
    );

}


// ======================================================
// PAYMENT METHODS
// ======================================================

function setupPaymentMethods() {

    const radios =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );


    radios.forEach(radio => {

        radio.addEventListener(
            "change",
            updatePaymentUI
        );

    });

}


// ======================================================
// UPDATE PAYMENT UI
// ======================================================

function updatePaymentUI() {

    const selected =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    const cashInfo =
        document.getElementById(
            "cashPaymentInfo"
        );


    const onlineInfo =
        document.getElementById(
            "onlinePaymentInfo"
        );


    const cashCard =
        document.getElementById(
            "cashMethodCard"
        );


    const onlineCard =
        document.getElementById(
            "onlineMethodCard"
        );


    if (cashInfo) {

        cashInfo.style.display =
            selected?.value === "cash"
                ? "block"
                : "none";

    }


    if (onlineInfo) {

        onlineInfo.style.display =
            selected?.value === "online"
                ? "block"
                : "none";

    }


    cashCard?.classList.toggle(
        "selected",
        selected?.value === "cash"
    );


    onlineCard?.classList.toggle(
        "selected",
        selected?.value === "online"
    );


    if (
        selected?.value === "online"
    ) {

        updateUPIPayment(
            currentBillAmount
        );

    }

}


// ======================================================
// UPI PAYMENT
// ======================================================

function updateUPIPayment(amount) {

    const upiId =
        "shreeelectrical@upi";


    const payeeName =
        "Shree Electrical Service";


    const cleanAmount =
        Number(amount || 0).toFixed(2);


    const upiLink =
        `upi://pay?pa=${encodeURIComponent(upiId)}` +
        `&pn=${encodeURIComponent(payeeName)}` +
        `&am=${cleanAmount}` +
        `&cu=INR`;


    const payButton =
        document.getElementById(
            "upiPayButton"
        );


    if (payButton) {

        payButton.href =
            upiLink;

    }


    const qrContainer =
        document.getElementById(
            "qrcode"
        );


    if (!qrContainer) return;


    qrContainer.innerHTML = "";


    if (
        typeof QRCode !== "undefined" &&
        amount > 0
    ) {

        new QRCode(
            qrContainer,
            {
                text: upiLink,
                width: 200,
                height: 200,
                correctLevel:
                    QRCode.CorrectLevel.M
            }
        );

    }

}


// ======================================================
// SAVE ORDER
// ======================================================

async function saveOrder() {

    try {

        const paymentRadio =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            );


        if (!paymentRadio) {

            alert(
                "Please select Cash or Online / UPI payment method."
            );

            return;

        }


        const paymentMethod =
            paymentRadio.value;


        const customer =
            getCustomerData();


        const services =
            getSelectedServices();


        const amount =
            calculateTotal(services);


        if (!services.length) {

            alert(
                "No services selected."
            );

            return;

        }


        if (amount <= 0) {

            alert(
                "Bill amount must be greater than ₹0."
            );

            return;

        }


        const invoiceNumber =
            document.getElementById(
                "invoiceNumber"
            )?.textContent ||
            generateInvoiceNumber();


        const orderData = {

            invoiceNumber,

            customerName:
                customer.name,

            mobile:
                customer.mobile,

            address:
                customer.address,


            services,


            total:
                amount,

            grandTotal:
                amount,

            totalAmount:
                amount,

            amount:
                amount,

            billAmount:
                amount,


            paidAmount:
                0,

            amountPaid:
                0,


            paymentMethod:
                paymentMethod,

            paymentStatus:
                "pending",


            status:
                "pending",


            // Link order to logged-in customer account (if any)
            userId:
                (
                    auth.currentUser &&
                    String(auth.currentUser.email || "")
                        .endsWith("@customer.shree.local")
                )
                    ? auth.currentUser.uid
                    : null,


            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        const docRef =
            await addDoc(
                collection(db, "orders"),
                orderData
            );


        currentOrderId =
            docRef.id;


        sessionStorage.setItem(
            "firestoreOrderId",
            docRef.id
        );


        sessionStorage.setItem(
            "orderId",
            docRef.id
        );


        localStorage.setItem(
            "grandTotal",
            amount.toString()
        );


        localStorage.setItem(
            "totalAmount",
            amount.toString()
        );


        sessionStorage.setItem(
            "grandTotal",
            amount.toString()
        );


        sessionStorage.setItem(
            "currentBill",
            JSON.stringify({
                ...orderData,
                id: docRef.id
            })
        );


        alert(
            "Bill saved successfully.\n\n" +
            "Payment status: Pending"
        );


        if (paymentMethod === "online") {

            const openPayment =
                confirm(
                    "Bill saved successfully.\n\n" +
                    "Do you want to open the UPI payment app now?"
                );


            if (openPayment) {

                openUPIPayment();

            }

        }


    } catch (error) {

        console.error(
            "Save order error:",
            error
        );


        alert(
            "Unable to save bill.\n\n" +
            error.message
        );

    }

}


// ======================================================
// OPEN UPI PAYMENT
// ======================================================

function openUPIPayment() {

    const button =
        document.getElementById(
            "upiPayButton"
        );


    if (!button) {

        alert(
            "UPI payment button not found."
        );

        return;

    }


    window.location.href =
        button.href;

}


// ======================================================
// PRINT
// ======================================================

function printBill() {

    window.print();

}


// ======================================================
// DOWNLOAD PDF
// ======================================================

async function downloadPDF() {

    const element =
        document.getElementById(
            "billArea"
        );


    if (!element) {

        alert(
            "Bill area not found."
        );

        return;

    }


    if (
        typeof html2pdf === "undefined"
    ) {

        alert(
            "PDF library not loaded."
        );

        return;

    }


    const invoiceNumber =
        document.getElementById(
            "invoiceNumber"
        )?.textContent ||
        "Invoice";


    const options = {

        margin: 10,

        filename:
            `Shree_Electrical_${invoiceNumber}.pdf`,

        image: {
            type: "jpeg",
            quality: 0.98
        },

        html2canvas: {
            scale: 2
        },

        jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait"
        }

    };


    await html2pdf()
        .set(options)
        .from(element)
        .save();

}


// ======================================================
// CONTINUE TO SERVICES
// ======================================================

function continueToServices() {

    window.location.href =
        "services.html";

}


// ======================================================
// INVOICE NUMBER
// ======================================================

function generateInvoiceNumber() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    return `SES-${year}${month}${day}-${random}`;

}


// ======================================================
// DATE
// ======================================================

function formatDate(date) {

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const year =
        date.getFullYear();


    return `${day}/${month}/${year}`;

}


// ======================================================
// SET TEXT
// ======================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.saveOrder =
    saveOrder;

window.printBill =
    printBill;

window.downloadPDF =
    downloadPDF;

window.loadBill =
    loadBill;

window.continueToServices =
    continueToServices;

window.openUPIPayment =
    openUPIPayment;