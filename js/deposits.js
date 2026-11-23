const PER_PAGE = 6;
let filter = "all", query = "", page = 1;

// ---- demo data: replace with GET /api/deposits?status=&q=&page= and GET /api/deposits/summary ----
const RATE = 150;                                  // from a settings table, not hard-coded in real life
const customers = ["Maria Dela Cruz","Jose Mendoza","Rosa Garcia","Benjie Ramos","Lita Fernandez","Ana Villanueva"];
let deposits = [
  { id:"DEP-024", customer:"Maria Dela Cruz", qty:4, date:"2026-11-18", status:"Held" },
  { id:"DEP-023", customer:"Jose Mendoza",    qty:2, date:"2026-11-17", status:"Held" },
  { id:"DEP-022", customer:"Rosa Garcia",     qty:3, date:"2026-11-16", status:"Held" },
  { id:"DEP-021", customer:"Benjie Ramos",    qty:2, date:"2026-11-15", status:"Held" },
  { id:"DEP-020", customer:"Lita Fernandez",  qty:1, date:"2026-11-14", status:"Held" },
  { id:"DEP-019", customer:"Ana Villanueva",  qty:2, date:"2026-11-13", status:"Refunded", refunded:"2026-11-20" },
];
// The demo only has 6 of the 28 records, so the summary cards start from API-style totals
// and are adjusted as you record deposits/returns. A real backend returns these from SQL.
const summary = { held:24, returnedMonth:18, accounts:10 };

const $ = id => document.getElementById(id);
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const peso = n => "₱" + n.toLocaleString("en-PH");
const fmt = iso => new Date(iso + "T00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
const today = () => new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const nextId = () => "DEP-" + String(Math.max(...deposits.map(d => +d.id.slice(4))) + 1).padStart(3, "0");
const two = (a, b) => { const td = el("td", null, "cust"); td.append(el("strong", a), el("small", b)); return td; };

function filtered() {
  const q = query.toLowerCase();
  return deposits.filter(d =>
    (filter === "all" || d.status === filter) &&
    (!q || d.id.toLowerCase().includes(q) || d.customer.toLowerCase().includes(q)));
}

function render() {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  page = Math.min(page, pages);
  const slice = list.slice((page-1)*PER_PAGE, page*PER_PAGE);

  $("rows").replaceChildren(...slice.map(d => {
    const tr = el("tr");
    const st = el("td"); st.append(el("span", d.status, "tag " + (d.status === "Held" ? "amber" : "green")));
    const a = el("a", d.status === "Held" ? "Record return" : "View record"); a.href = "#";
    a.onclick = ev => { ev.preventDefault(); d.status === "Held" ? openReturn(d.id) : openView(d); };
    const act = el("td"); act.append(a);
    tr.append(two(d.id, d.customer), el("td", d.qty), el("td", peso(d.qty * RATE)), el("td", fmt(d.date)), st, act);
    return tr;
  }));

  const from = list.length ? (page-1)*PER_PAGE + 1 : 0;
  $("showing").textContent = `Showing ${from}-${list.length ? from + slice.length - 1 : 0} of ${list.length} records`;
  $("pg").textContent = page; $("prev").disabled = page === 1; $("next").disabled = page === pages;

  $("sHeld").textContent = summary.held;
  $("sAccounts").textContent = `Across ${summary.accounts} customer accounts`;
  $("sFunds").textContent = peso(summary.held * RATE);
  $("sFundsNote").textContent = `${summary.held} containers × ${peso(RATE)}`;
  $("sReturned").textContent = summary.returnedMonth;
  $("sRefunded").textContent = `${peso(summary.returnedMonth * RATE)} refunded`;
  $("sRate").textContent = peso(RATE);
}

$("chips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  document.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b));
  filter = b.dataset.f; page = 1; render();
});
$("q").addEventListener("input", e => { query = e.target.value.trim(); page = 1; render(); });
$("prev").onclick = () => { page--; render(); };
$("next").onclick = () => { page++; render(); };
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => $(b.dataset.close).close());

// ---- Record deposit ----
customers.forEach(n => $("custSel").append(new Option(n, n)));
const syncDep = () => $("depAmt").textContent = peso((parseInt($("depQty").value) || 0) * RATE);
$("depQty").oninput = syncDep;
$("depositBtn").onclick = () => { $("depQty").value = 1; $("depErr").hidden = true; syncDep(); $("depDlg").showModal(); };

$("depForm").addEventListener("submit", async e => {
  const qty = parseInt($("depQty").value);
  if (!(qty >= 1)) { e.preventDefault(); $("depErr").textContent = "Enter at least 1 container."; $("depErr").hidden = false; return; }
  try {
    // await fetch("/api/deposits", { method:"POST", credentials:"same-origin",
    //   headers:{ "Content-Type":"application/json" },
    //   body: JSON.stringify({ customer_id:..., containers:qty }) });     // server sets amount = containers × rate
    deposits.unshift({ id:nextId(), customer:$("custSel").value, qty, date:today(), status:"Held" });
    summary.held += qty; render();
  } catch (ex) { e.preventDefault(); $("depErr").textContent = ex.message; $("depErr").hidden = false; }
});

// ---- Record return (full or partial) ----
function syncRet() {
  const d = deposits.find(x => x.id === $("heldSel").value);
  $("retQty").max = d.qty;
  if (+$("retQty").value > d.qty) $("retQty").value = d.qty;
  $("refAmt").textContent = peso((parseInt($("retQty").value) || 0) * RATE);
}
function openReturn(id) {
  const held = deposits.filter(d => d.status === "Held");
  if (!held.length) { alert("No containers are currently held."); return; }
  $("heldSel").replaceChildren(...held.map(d => new Option(`${d.id} · ${d.customer} · ${d.qty} container${d.qty > 1 ? "s" : ""}`, d.id)));
  if (id) $("heldSel").value = id;
  const d = deposits.find(x => x.id === $("heldSel").value);
  $("retQty").value = d.qty; $("retErr").hidden = true; syncRet();
  $("retDlg").showModal();
}
$("heldSel").onchange = () => { $("retQty").value = deposits.find(x => x.id === $("heldSel").value).qty; syncRet(); };
$("retQty").oninput = syncRet;
$("returnBtn").onclick = () => openReturn();

$("retForm").addEventListener("submit", async e => {
  const d = deposits.find(x => x.id === $("heldSel").value);
  const n = parseInt($("retQty").value);
  if (!(n >= 1) || n > d.qty) {
    e.preventDefault(); $("retErr").textContent = `Enter 1 to ${d.qty} containers.`; $("retErr").hidden = false; return;
  }
  try {
    // await fetch(`/api/deposits/${d.id}/return`, { method:"POST", credentials:"same-origin",
    //   headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ containers:n }) });
    if (n === d.qty) { d.status = "Refunded"; d.refunded = today(); }
    else {                                   // partial return: shrink the held row, log the refunded part as its own record
      d.qty -= n;
      deposits.splice(deposits.indexOf(d), 0,
        { id:nextId(), customer:d.customer, qty:n, date:d.date, status:"Refunded", refunded:today() });
    }
    summary.held -= n; summary.returnedMonth += n; render();
  } catch (ex) { e.preventDefault(); $("retErr").textContent = ex.message; $("retErr").hidden = false; }
});

// ---- View record ----
function openView(d) {
  const rows = [["Deposit", d.id], ["Customer", d.customer], ["Containers", d.qty],
                ["Amount refunded", peso(d.qty * RATE)], ["Deposit recorded", fmt(d.date)], ["Refunded on", d.refunded ? fmt(d.refunded) : "—"]];
  $("viewBody").replaceChildren(...rows.map(([k, v]) => {
    const row = el("div"); row.append(el("dt", k), el("dd", v)); return row;
  }));
  $("viewDlg").showModal();
}

render();