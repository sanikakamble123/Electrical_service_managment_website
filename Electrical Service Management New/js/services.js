/* =========================================================
   SHREE ELECTRICAL SERVICE
   SERVICES.JS
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const quantityInputs =
        document.querySelectorAll(".quantity");

    const serviceCount =
        document.getElementById("serviceCount");

    const pointCount =
        document.getElementById("pointCount");

    const subTotal =
        document.getElementById("subTotal");

    const grandTotalElement =
        document.getElementById("grandTotal");

    const resetBtn =
        document.getElementById("resetBtn");

    const billBtn =
        document.getElementById("billBtn");


    /* =====================================================
       SAVE SELECTED SERVICES
    ===================================================== */

    function saveServices() {

        const selectedServices = [];


        quantityInputs.forEach(function (input) {

            const quantity =
                Number(input.value) || 0;

            const rate =
                Number(input.dataset.rate) || 0;

            const serviceName =
                input.dataset.service ||
                input.dataset.name ||
                "Electrical Service";


            if (quantity > 0) {

                selectedServices.push({

                    name: serviceName,

                    service: serviceName,

                    rate: rate,

                    quantity: quantity,

                    qty: quantity,

                    total:
                        quantity * rate

                });
            }

        });


        const total =
            selectedServices.reduce(
                function (sum, service) {

                    return sum +
                        Number(service.total || 0);

                },
                0
            );


        sessionStorage.setItem(
            "selectedServices",
            JSON.stringify(selectedServices)
        );


        sessionStorage.setItem(
            "grandTotal",
            total.toString()
        );


        return selectedServices;
    }


    /* =====================================================
       CALCULATE BILL
    ===================================================== */

    function calculateBill() {

        let total = 0;

        let totalPoints = 0;

        let selectedServiceTypes = 0;


        quantityInputs.forEach(function (input) {

            let quantity =
                Number(input.value) || 0;


            const rate =
                Number(input.dataset.rate) || 0;


            if (quantity < 0) {

                quantity = 0;

                input.value = 0;
            }


            const amount =
                quantity * rate;


            const row =
                input.closest("tr");


            if (row) {

                const totalCell =
                    row.querySelector(".total");


                if (totalCell) {

                    totalCell.textContent =
                        "₹" + amount.toFixed(2);
                }


                if (quantity > 0) {

                    row.classList.add(
                        "selected-row"
                    );

                } else {

                    row.classList.remove(
                        "selected-row"
                    );
                }
            }


            total += amount;

            totalPoints += quantity;


            if (quantity > 0) {

                selectedServiceTypes++;
            }

        });


        if (serviceCount) {

            serviceCount.textContent =
                selectedServiceTypes;
        }


        if (pointCount) {

            pointCount.textContent =
                totalPoints;
        }


        if (subTotal) {

            subTotal.textContent =
                "₹" + total.toFixed(2);
        }


        if (grandTotalElement) {

            grandTotalElement.textContent =
                "₹" + total.toFixed(2);
        }


        saveServices();


        return {

            total: total,

            totalPoints: totalPoints,

            selectedServices:
                selectedServiceTypes

        };
    }


    /* =====================================================
       INPUT EVENTS
    ===================================================== */

    quantityInputs.forEach(function (input) {

        input.addEventListener(
            "input",
            calculateBill
        );


        input.addEventListener(
            "change",
            calculateBill
        );

    });


    /* =====================================================
       RESET
    ===================================================== */

    if (resetBtn) {

        resetBtn.addEventListener(
            "click",
            function () {

                quantityInputs.forEach(
                    function (input) {

                        input.value = 0;

                        const row =
                            input.closest("tr");

                        if (row) {

                            row.classList.remove(
                                "selected-row"
                            );
                        }

                    }
                );


                sessionStorage.removeItem(
                    "selectedServices"
                );

                sessionStorage.removeItem(
                    "grandTotal"
                );

                sessionStorage.removeItem(
                    "currentBill"
                );

                sessionStorage.removeItem(
                    "currentBillId"
                );


                calculateBill();

            }
        );
    }


    /* =====================================================
       CONTINUE TO BILL
    ===================================================== */

    if (billBtn) {

        billBtn.addEventListener(
            "click",
            function () {

                const result =
                    calculateBill();


                if (
                    result.totalPoints <= 0
                ) {

                    alert(
                        "Please select at least one service point."
                    );

                    return;
                }


                const selectedServices =
                    JSON.parse(
                        sessionStorage.getItem(
                            "selectedServices"
                        ) || "[]"
                    );


                const billData = {

                    services:
                        selectedServices,

                    grandTotal:
                        result.total,

                    totalAmount:
                        result.total,

                    amount:
                        result.total,

                    totalPoints:
                        result.totalPoints,

                    date:
                        new Date().toISOString()

                };


                sessionStorage.setItem(
                    "currentBill",
                    JSON.stringify(billData)
                );


                sessionStorage.setItem(
                    "grandTotal",
                    result.total.toString()
                );


                sessionStorage.setItem(
                    "currentBillId",
                    "bill-" + Date.now()
                );


                window.location.href =
                    "bill.html";

            }
        );
    }


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    quantityInputs.forEach(
        function (input) {

            input.value = 0;

        }
    );


    calculateBill();

});