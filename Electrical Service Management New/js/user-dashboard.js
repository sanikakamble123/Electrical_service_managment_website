// ================================================
// USER-DASHBOARD.JS
// Customer sees own orders: items, qty, amount,
// paid / pending status and payment type.
// ================================================
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase.js";

const DOMAIN = "customer.shree.local";
const $ = (id) => document.getElementById(id);
let allOrders = [];

// ---------- helpers ----------
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function toDate(v) {
    if (!v) return null;
    if (typeof v.toDate === "function") return v.toDate();
    if (v.seconds !== undefined) return new Date(v.seconds * 1000);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}
const fmtDate = (d) => d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

function itemsOf(order, total) {
    const list = Array.isArray(order.services) ? order.services : (order.items || order.selectedServices);
    if (Array.isArray(list) && list.length) {
        return list.map((s) => {
            if (typeof s === "string") return { name: s, qty: 1, rate: 0, amount: 0 };
            const qty = Number(s.quantity ?? s.qty ?? s.count ?? 1) || 1;
            const rate = Number(s.rate ?? s.price ?? s.unitPrice ?? 0) || 0;
            let amount = Number(s.total ?? s.totalAmount);
            if (!Number.isFinite(amount)) amount = qty * rate;
            return { name: s.name || s.serviceName || s.service || s.title || "Service", qty, rate, amount };
        });
    }
    if (typeof order.services === "string" && order.services.trim()) {
        return [{ name: order.services.trim(), qty: 1, rate: total, amount: total }];
    }
    return [];
}

function normalize(id, o) {
    const total = Number(o.grandTotal ?? o.total ?? o.totalAmount ?? o.amount ?? o.billAmount ?? 0) || 0;
    const paidAmt = Number(o.paidAmount ?? o.amountPaid ?? 0) || 0;
    const st = String(o.paymentStatus || o.status || "pending").trim().toLowerCase();
    const isPaid = o.paymentVerified === true || ["paid", "success", "successful", "completed", "complete"].includes(st);
    const status = isPaid ? "paid" : (paidAmt > 0 && paidAmt < total ? "partial" : "pending");
    const paid = isPaid ? total : Math.min(paidAmt, total);
    const m = String(o.paymentMethod || "").toLowerCase();
    const method = m === "cash" ? "cash" : (m ? "online" : "other");
    return {
        id,
        invoice: o.invoiceNumber || id.slice(0, 8).toUpperCase(),
        date: toDate(o.createdAt) || toDate(o.date),
        items: itemsOf(o, total),
        total, paid, due: Math.max(total - paid, 0), status, method
    };
}

// ---------- load ----------
async function loadOrders(user, mobile) {
    const ref = collection(db, "orders");
    const results = await Promise.allSettled([
        getDocs(query(ref, where("userId", "==", user.uid))),
        getDocs(query(ref, where("mobile", "==", mobile)))
    ]);
    if (results.every((r) => r.status === "rejected")) throw results[0].reason;

    const map = new Map();
    results.forEach((r) => {
        if (r.status === "fulfilled") r.value.forEach((d) => map.set(d.id, normalize(d.id, d.data())));
    });
    allOrders = [...map.values()].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
}

// ---------- render ----------
const BADGE = { paid: "success", pending: "warning text-dark", partial: "info text-dark" };
const METHOD = { cash: ["bi-cash-coin", "Cash"], online: ["bi-qr-code", "Online / UPI"], other: ["bi-question-circle", "Not set"] };

function renderStats() {
    $("stOrders").textContent = allOrders.length;
    $("stBilled").textContent = "₹" + money(allOrders.reduce((s, o) => s + o.total, 0));
    $("stPaid").textContent = "₹" + money(allOrders.reduce((s, o) => s + o.paid, 0));
    $("stDue").textContent = "₹" + money(allOrders.reduce((s, o) => s + o.due, 0));
}

function renderOrders() {
    const fs = $("fStatus").value, fm = $("fMethod").value, q = $("fSearch").value.trim().toLowerCase();
    const list = allOrders.filter((o) =>
        (fs === "all" || o.status === fs) &&
        (fm === "all" || o.method === fm) &&
        (!q || o.invoice.toLowerCase().includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q)))
    );
    $("count").textContent = `${list.length} of ${allOrders.length} orders`;

    if (!list.length) {
        $("orders").innerHTML = `<div class="empty"><i class="bi bi-inbox"></i><p>${allOrders.length ? "No orders match your filters." : "You have no orders yet."}</p>
            ${allOrders.length ? "" : '<a href="customer.html" class="btn btn-warning fw-bold">Create your first order</a>'}</div>`;
        return;
    }

    $("orders").innerHTML = list.map((o) => {
        const [icon, label] = METHOD[o.method];
        const rows = o.items.length ? o.items.map((i) => `
            <tr><td>${esc(i.name)}</td><td class="text-center">${i.qty}</td>
            <td class="text-end">₹${money(i.rate)}</td><td class="text-end fw-semibold">₹${money(i.amount)}</td></tr>`).join("")
            : `<tr><td colspan="4" class="text-muted text-center">No item details saved</td></tr>`;
        return `
        <div class="order">
          <div class="order-head">
            <div><div class="inv">${esc(o.invoice)}</div><div class="text-muted small"><i class="bi bi-calendar3"></i> ${fmtDate(o.date)}</div></div>
            <div class="text-end">
              <span class="badge bg-${BADGE[o.status]} text-uppercase">${o.status}</span>
              <span class="badge bg-light text-dark border"><i class="bi ${icon}"></i> ${label}</span>
            </div>
          </div>
          <div class="table-responsive"><table class="table table-sm mb-2">
            <thead><tr><th>Service</th><th class="text-center">Qty</th><th class="text-end">Rate</th><th class="text-end">Amount</th></tr></thead>
            <tbody>${rows}</tbody></table></div>
          <div class="order-foot">
            <span>Total: <b>₹${money(o.total)}</b></span>
            <span class="text-success">Paid: <b>₹${money(o.paid)}</b></span>
            <span class="${o.due ? "text-danger" : "text-muted"}">Due: <b>₹${money(o.due)}</b></span>
          </div>
        </div>`;
    }).join("");
}

// ---------- events ----------
["fStatus", "fMethod"].forEach((id) => $(id).addEventListener("change", renderOrders));
$("fSearch").addEventListener("input", renderOrders);
$("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    location.href = "user-login.html";
});

// ---------- auth guard ----------
onAuthStateChanged(auth, async (user) => {
    if (!user) { location.replace("user-login.html"); return; }

    const email = String(user.email || "");
    if (!email.endsWith("@" + DOMAIN)) { // owner account
        location.replace("dashboard.html");
        return;
    }

    const mobile = email.split("@")[0];
    $("uName").textContent = user.displayName || "Customer";
    $("uMobile").textContent = mobile;
    $("welcome").textContent = (user.displayName || "Customer").split(" ")[0];

    try {
        await loadOrders(user, mobile);
        renderStats();
        renderOrders();
    } catch (err) {
        console.error(err);
        $("orders").innerHTML = `<div class="alert alert-danger">Could not load your orders. Please check your internet connection and try again.</div>`;
    }
    $("loader").classList.add("d-none");
    $("content").classList.remove("d-none");
});
