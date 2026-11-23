const PER_PAGE = 6;
let filter = "all", query = "", page = 1;

// ---- demo data: replace with fetch("/api/orders?...") ----
const gallons = [ { id:1, name:"Purified", price:35 }, { id:2, name:"Mineral", price:40 } ];
const customerList = ["Maria Dela Cruz","Jose Mendoza","Rosa Garcia","Benjie Ramos","Lita Fernandez","Ana Villanueva"];
const riderList = ["Mark Santos","Carlo Reyes","Ana Cruz"];

let orders = [
  { id:"WR-1048", time:"Today, 10:42 AM", customer:"Maria Dela Cruz", qty:4, gallon:"Purified", total:140, delivery:"On route",  payment:"Unpaid"  },
  { id:"WR-1047", time:"Today, 10:30 AM", customer:"Jose Mendoza",    qty:6, gallon:"Purified", total:210, delivery:"Delivered", payment:"Paid"    },
  { id:"WR-1046", time:"Today, 10:15 AM", customer:"Rosa Garcia",     qty:3, gallon:"Purified", total:105, delivery:"Pending",   payment:"Unpaid"  },
  { id:"WR-1045", time:"Today, 9:58 AM",  customer:"Benjie Ramos",    qty:8, gallon:"Purified", total:280, delivery:"Delivered", payment:"Paid"    },
  { id:"WR-1044", time:"Today, 9:45 AM",  customer:"Lita Fernandez",  qty:5, gallon:"Purified", total:175, delivery:"On route",  payment:"Partial" },
  { id:"WR-1043", time:"Today, 9:30 AM",  customer:"Ana Villanueva",  qty:2, gallon:"Purified", total:70,  delivery:"Delivered", payment:"Paid"    },
];

const $ = id => document.getElementById(id);
const peso = n => "₱" + n.toLocaleString("en-PH");
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const delivTag = { "Pending":"amber", "On route":"blue", "Delivered":"green" };
const payTag   = { "Unpaid":"amber",  "Partial":"amber", "Paid":"green" };

function filtered() {
  const q = query.toLowerCase();
  return orders.filter(o =>
    (filter === "all" || o.delivery === filter) &&
    (!q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)));
}

function render() {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  page = Math.min(page, pages);
  const slice = list.slice((page-1)*PER_PAGE, page*PER_PAGE);

  $("rows").replaceChildren(...slice.map(o => {
    const tr = el("tr");
    const id = el("td", null, "cust"); id.append(el("strong", "#" + o.id), el("small", o.time));
    const d = el("td"); d.append(el("span", o.delivery, "tag " + delivTag[o.delivery]));
    const p = el("td"); p.append(el("span", o.payment,  "tag " + payTag[o.payment]));
    const a = el("a", "View order"); a.href = "order.html?id=" + encodeURIComponent(o.id);
    const act = el("td"); act.append(a);
    tr.append(id, el("td", o.customer), el("td", `${o.qty} × ${o.gallon}`), el("td", peso(o.total)), d, p, act);
    return tr;
  }));

  const from = list.length ? (page-1)*PER_PAGE + 1 : 0;
  $("showing").textContent = `Showing ${from}-${list.length ? from + slice.length - 1 : 0} of ${list.length} records`;
  $("pg").textContent = page;
  $("prev").disabled = page === 1;
  $("next").disabled = page === pages;

  $("oToday").textContent   = orders.length;
  $("oPending").textContent = orders.filter(o => o.delivery === "Pending").length;
  $("oRoute").textContent   = orders.filter(o => o.delivery === "On route").length;
  $("oDone").textContent    = orders.filter(o => o.delivery === "Delivered").length;
}

// ---- filters / paging ----
$("chips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  document.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b));
  filter = b.dataset.f; page = 1; render();
});
$("q").addEventListener("input", e => { query = e.target.value.trim(); page = 1; render(); });
$("prev").onclick = () => { page--; render(); };
$("next").onclick = () => { page++; render(); };

// ---- New order modal ----
customerList.forEach(n => $("custSel").append(new Option(n, n)));
riderList.forEach(n => $("riderSel").append(new Option(n, n)));
gallons.forEach(g => $("gallonSel").append(new Option(`${g.name} (${peso(g.price)})`, g.id)));

function updateTotal() {
  const g = gallons.find(x => x.id == $("gallonSel").value);
  const qty = Math.max(0, parseInt($("qty").value) || 0);
  $("total").textContent = peso(g ? g.price * qty : 0);   // preview only; server recalculates
}
$("gallonSel").onchange = updateTotal;
$("qty").oninput = updateTotal;

function openNew() { $("orderForm").reset(); $("formErr").hidden = true; updateTotal(); $("dlg").showModal(); }
$("newBtn").onclick = openNew;
$("cancel").onclick = () => $("dlg").close();
if (new URLSearchParams(location.search).get("new")) openNew();   // dashboard "+ New order" link

$("orderForm").addEventListener("submit", async e => {
  const f = e.target;
  const g = gallons.find(x => x.id == f.gallon.value);
  const qty = parseInt(f.qty.value);
  try {
    // const res = await fetch("/api/orders", { method:"POST", credentials:"same-origin",
    //   headers:{ "Content-Type":"application/json" },
    //   body: JSON.stringify({ customer:f.customer.value, gallon_id:g.id, quantity:qty, rider:f.rider.value || null }) });
    // if (!res.ok) throw new Error((await res.json()).message);
    // const saved = await res.json();      // use saved.id and saved.total from the server
    const next = "WR-" + (1049 + orders.length - 6);
    orders.unshift({ id:next, time:"Today, " + new Date().toLocaleTimeString("en-PH",{hour:"numeric",minute:"2-digit"}),
      customer:f.customer.value, qty, gallon:g.name, total:g.price * qty,
      delivery:f.rider.value ? "On route" : "Pending", payment:"Unpaid" });
    render();
  } catch (err) {
    e.preventDefault(); $("formErr").textContent = err.message; $("formErr").hidden = false;
  }
});

// ---- Export ----
$("exportBtn").onclick = () => {
  const rows = [["Order","Time","Customer","Gallons","Total","Delivery","Payment"],
    ...filtered().map(o => [o.id,o.time,o.customer,`${o.qty} x ${o.gallon}`,o.total,o.delivery,o.payment])];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  Object.assign(document.createElement("a"),
    { href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download:"orders.csv" }).click();
};

render();