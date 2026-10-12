
/* =========================================================
   SHREE ELECTRICAL SERVICE
   QR.JS
========================================================= */


/*
   IMPORTANT:
   Change this only if your real UPI ID is different.
*/

const UPI_ID =
    "shreeelectrical@upi";

const BUSINESS_NAME =
    "Shree Electrical Service";


/* =========================
   GENERATE QR
========================= */

function generateQR(amount) {

    const qrContainer =
        document.getElementById(
            "qrcode"
        );

    if (!qrContainer) {
        return;
    }


    qrContainer.innerHTML = "";


    amount =
        Number(amount || 0);


    if (amount <= 0) {

        qrContainer.innerHTML = `
            <div style="
                font-size:12px;
                color:#777;
                text-align:center;
            ">
                Amount not available
            </div>
        `;

        return;

    }


    /*
       UPI Payment URL
    */

    const upiURL =
        "upi://pay" +
        "?pa=" +
        encodeURIComponent(UPI_ID) +
        "&pn=" +
        encodeURIComponent(BUSINESS_NAME) +
        "&am=" +
        amount.toFixed(2) +
        "&cu=INR";


    /*
       Generate QR
    */

    new QRCode(
        qrContainer,
        {
            text: upiURL,

            width: 120,

            height: 120,

            colorDark: "#000000",

            colorLight: "#ffffff",

            correctLevel:
                QRCode.CorrectLevel.H
        }
    );


    /*
       Store payment information
       for debugging / future use.
    */

    localStorage.setItem(
        "upiPaymentData",
        JSON.stringify({
            upiId: UPI_ID,
            businessName: BUSINESS_NAME,
            amount: amount,
            upiURL: upiURL
        })
    );

}


/* =========================
   UPDATE QR WHEN BILL CHANGES
========================= */

window.addEventListener(
    "billUpdated",
    function(event) {

        if (
            event.detail &&
            event.detail.total
        ) {

            generateQR(
                event.detail.total
            );

        }

    }
);


/* =========================
   EXPOSE FUNCTION
========================= */

window.generateQR =
    generateQR;
