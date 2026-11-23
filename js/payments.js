const PER_PAGE = 6;
let filter = "all", query = "", page = 1;

// ---- demo data: replace with GET /api/payments?status=&q=&page= ----
let orders = [
  { id:"WR-1048", customer:"Maria Dela Cruz", total:140, paid:0,   last:null },
  { id:"WR-1047", customer:"Jose Mendoza",    total:210, paid:210, last:"Nov 20, 10:35 AM" },
  { id:"WR-1046", customer:"Rosa Garcia",     total:105, paid:0,   last:null },
  { id:"WR-1045", customer:"Benjie Ramos",    total:280, paid:280, last:"Nov 20, 10:10 AM" },
  { id:"WR-1044", customer:"Lita Fernandez",  total:175, paid:100, last:"Nov 20, 9:50 AM" },
  { id:"WR-1043", customer:"Ana Villanueva",  total:70,  paid:70,  last:"Nov 20, 9:40 AM" },
];
const depositsHeld = 3600;   // from the Container Deposits table, not from sales

const $ = id => document.getElementById(id);
const peso = n => "₱" + n.toLocaleString("en-PH");
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const balance = o => o.total - o.paid;
const status  = o => o.paid <= 0 ? "Unpaid" : o.paid < o.total ? "Partial" : "Paid";   // derived, never typed in
const tagFor  = { Unpaid:"amber", Partial:"amber", Paid:"green" };

function filtered() {
  const q = query.toLowerCase();
  return orders.filter(o =>
    (filter === "all" || status(o) === filter) &&
    (!q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)));
}

function render() {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  page = Math.min(page, pages);
  const slice = list.slice((page-1)*PER_PAGE, page*PER_PAGE);

  $("rows").replaceChildren(...slice.map(o => {
    const tr = el("tr");
    const who = el("td", null, "cust"); who.append(el("strong", "#" + o.id), el("small", o.customer));
    const st = el("td"); st.append(el("span", status(o), "tag " + tagFor[status(o)]));
    const a = el("a", balance(o) > 0 ? "Record payment" : "View receipt"); a.href = "#";
    a.onclick = ev => { ev.preventDefault(); balance(o) > 0 ? openPay(o.id) : showReceipt(o); };
    const act = el("td"); act.append(a);
    tr.append(who, el("td", peso(o.total)), el("td", peso(o.paid)), el("td", peso(balance(o))),
              st, el("td", o.last || "—"), act);
    return tr;
  }));

  const from = list.length ? (page-1)*PER_PAGE + 1 : 0;
  $("showing").textContent = `Showing ${from}-${list.length ? from + slice.length - 1 : 0} of ${list.length} records`;
  $("pg").textContent = page;
  $("prev").disabled = page === 1;
  $("next").disabled = page === pages;

  const owing = orders.filter(o => balance(o) > 0);
  $("pCollected").textContent   = peso(orders.reduce((s,o) => s + o.paid, 0));   // API: today's payments only
  $("pPaidCount").textContent   = `${orders.filter(o => status(o) === "Paid").length} fully paid orders`;
  $("pOutstanding").textContent = peso(owing.reduce((s,o) => s + balance(o), 0));
  $("pCustomers").textContent   = `${new Set(owing.map(o => o.customer)).size} customers to follow up`;
  $("pPartial").textContent     = orders.filter(o => status(o) === "Partial").length;
  $("pDeposits").textContent    = peso(depositsHeld);
}

$("chips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  document.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b));
  filter = b.dataset.f; page = 1; render();
});
$("q").addEventListener("input", e => { query = e.target.value.trim(); page = 1; render(); });
$("prev").onclick = () => { page--; render(); };
$("next").onclick = () => { page++; render(); };

// ---- Record payment (Process 3) ----
const today = () => new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);

function openPay(orderId) {
  const open = orders.filter(o => balance(o) > 0);
  if (!open.length) { alert("All orders are fully paid."); return; }
  $("orderSel").replaceChildren(...open.map(o => new Option(`#${o.id} · ${o.customer}`, o.id)));
  if (orderId) $("orderSel").value = orderId;
  $("payDate").value = today(); $("payDate").max = today();
  syncDue();
  $("formErr").hidden = true;
  $("payDlg").showModal();
}
function syncDue() {
  const o = orders.find(x => x.id === $("orderSel").value);
  $("dueAmt").textContent = peso(balance(o));
  $("amount").max = balance(o);
  $("amount").value = balance(o);          // default to paying in full
}
$("orderSel").onchange = syncDue;
$("recordBtn").onclick = () => openPay();
$("cancelPay").onclick = () => $("payDlg").close();

$("payForm").addEventListener("submit", async e => {
  const o = orders.find(x => x.id === $("orderSel").value);
  const amt = Number($("amount").value);
  const err = $("formErr");
  if (!(amt > 0) || amt > balance(o)) {      // server validates again: positive and not above balance
    e.preventDefault();
    err.textContent = `Enter an amount from ₱1 to ${peso(balance(o))}.`; err.hidden = false; return;
  }
  try {
    // const res = await fetch("/api/payments", { method:"POST", credentials:"same-origin",
    //   headers:{ "Content-Type":"application/json" },
    //   body: JSON.stringify({ order_id:o.id, amount:amt, payment_date:$("payDate").value }) });
    // if (!res.ok) throw new Error((await res.json()).message);
    // Object.assign(o, await res.json());   // server returns updated total paid + balance
    o.paid += amt;
    o.last = new Date($("payDate").value + "T00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric"}) + ", " +
             new Date().toLocaleTimeString("en-PH",{hour:"numeric",minute:"2-digit"});
    render();
    setTimeout(() => showReceipt(o), 0);     // confirmation + updated balance, as in your doc
  } catch (ex) {
    e.preventDefault(); err.textContent = ex.message; err.hidden = false;
  }
});

// ---- Receipt ----
function showReceipt(o) {
  $("rOrder").textContent  = "#" + o.id;
  $("rCust").textContent   = o.customer;
  $("rTotal").textContent  = peso(o.total);
  $("rPaid").textContent   = peso(o.paid);
  $("rBal").textContent    = peso(balance(o));
  $("rStatus").textContent = status(o);
  $("rLast").textContent   = o.last || "—";
  $("rcpDlg").showModal();
}
$("closeRcp").onclick = () => $("rcpDlg").close();

// ---- Export ----
$("exportBtn").onclick = () => {
  const rows = [["Order","Customer","Total","Paid","Balance","Status","Last payment"],
    ...filtered().map(o => [o.id,o.customer,o.total,o.paid,balance(o),status(o),o.last || ""])];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  Object.assign(document.createElement("a"),
    { href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download:"payments.csv" }).click();
};

render();