const PER_PAGE = 6;
let filter = "all", query = "", page = 1;

const routeQ = new URLSearchParams(location.search).get("route");   // e.g. "Route A"

// ---- demo data: replace with GET /api/deliveries?date=&status=&q=&page= ----
const routes = ["Route A · Purok 1–2", "Route B · Purok 3–4", "Route C · Purok 5–6"];
const riders = [{ name:"Mark Santos", available:true }, { name:"Carlo Reyes", available:true }, { name:"Ana Cruz", available:true }];

let deliveries = [
  { id:"DEL-048", order:"WR-1048", customer:"Maria Dela Cruz", dest:"Purok 2, Brgy. 10", rider:"Mark Santos", route:"Route A · Purok 1–2", time:"11:00 AM", status:"On route"  },
  { id:"DEL-047", order:"WR-1047", customer:"Jose Mendoza",    dest:"Purok 1, Brgy. 10", rider:"Mark Santos", route:"Route A · Purok 1–2", time:"10:30 AM", status:"Delivered" },
  { id:"DEL-046", order:"WR-1046", customer:"Rosa Garcia",     dest:"Purok 4, Brgy. 10", rider:null,          route:"Route B · Purok 3–4", time:"11:30 AM", status:"Pending"   },
  { id:"DEL-045", order:"WR-1045", customer:"Benjie Ramos",    dest:"Purok 3, Brgy. 10", rider:"Carlo Reyes", route:"Route B · Purok 3–4", time:"10:00 AM", status:"Delivered" },
  { id:"DEL-044", order:"WR-1044", customer:"Lita Fernandez",  dest:"Purok 5, Brgy. 10", rider:"Ana Cruz",    route:"Route C · Purok 5–6", time:"11:00 AM", status:"On route"  },
  { id:"DEL-043", order:"WR-1043", customer:"Ana Villanueva",  dest:"Purok 6, Brgy. 10", rider:"Ana Cruz",    route:"Route C · Purok 5–6", time:"9:30 AM",  status:"Delivered" },
];

const $ = id => document.getElementById(id);
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const tagFor = { "Pending":"amber", "On route":"blue", "Delivered":"green" };
const two = (a, b) => { const td = el("td", null, "cust"); td.append(el("strong", a), el("small", b)); return td; };

// ---- date button ----
let day = new Date();
const showDay = () => $("dateBtn").textContent = day.toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" });
$("dateBtn").onclick = () => $("dateInput").showPicker?.();
$("dateInput").onchange = e => { if (e.target.value) { day = new Date(e.target.value + "T00:00"); showDay(); /* then refetch for this date */ } };
showDay();

function filtered() {
  const q = query.toLowerCase();
  return deliveries.filter(d =>
    (filter === "all" || d.status === filter) &&
    (!q || d.id.toLowerCase().includes(q) || d.order.toLowerCase().includes(q) ||
           (d.rider || "").toLowerCase().includes(q) || d.customer.toLowerCase().includes(q)));
}

function render() {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  page = Math.min(page, pages);
  const slice = list.slice((page-1)*PER_PAGE, page*PER_PAGE);

  $("rows").replaceChildren(...slice.map(d => {
    const tr = el("tr");
    const st = el("td"); st.append(el("span", d.status, "tag " + tagFor[d.status]));
    const act = el("td");
    const a = el("a", d.rider ? "View delivery" : "Assign rider");
    a.href = "#";
    a.onclick = ev => { ev.preventDefault(); d.rider ? (location.href = "delivery.html?id=" + encodeURIComponent(d.id)) : openAssign(d.id); };
    act.append(a);
    tr.append(two(d.id, "#" + d.order), two(d.customer, d.dest),
              two(d.rider || "Not assigned", d.route), el("td", d.time), st, act);
    return tr;
  }));

  const from = list.length ? (page-1)*PER_PAGE + 1 : 0;
  $("showing").textContent = `Showing ${from}-${list.length ? from + slice.length - 1 : 0} of ${list.length} records`;
  $("pg").textContent = page;
  $("prev").disabled = page === 1;
  $("next").disabled = page === pages;

  const done = deliveries.filter(d => d.status === "Delivered").length;
  const out  = deliveries.filter(d => d.status === "On route");
  $("dTotal").textContent   = deliveries.length;
  $("dRoutes").textContent  = `Across ${new Set(deliveries.map(d => d.route)).size} delivery routes`;
  $("dPending").textContent = deliveries.filter(d => d.status === "Pending").length;
  $("dRoute").textContent   = out.length;
  $("dRiders").textContent  = [...new Set(out.map(d => d.rider.split(" ")[0]))].join(", ") || "No riders out";
  $("dDone").textContent    = done;
  $("dPct").textContent     = Math.round(done / (deliveries.length || 1) * 100) + "% of today's deliveries";
}

$("chips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  document.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b));
  filter = b.dataset.f; page = 1; render();
});
$("q").addEventListener("input", e => { query = e.target.value.trim(); page = 1; render(); });
$("prev").onclick = () => { page--; render(); };
$("next").onclick = () => { page++; render(); };

// ---- Assign modal ----
riders.filter(r => r.available).forEach(r => $("riderSel").append(new Option(r.name, r.name)));
routes.forEach(r => $("routeSel").append(new Option(r, r)));

function openAssign(deliveryId) {
  const waiting = deliveries.filter(d => !d.rider);
  if (!waiting.length) { alert("Every delivery already has a rider."); return; }
  $("orderSel").replaceChildren(...waiting.map(d => new Option(`#${d.order} · ${d.customer}`, d.id)));
  if (deliveryId) $("orderSel").value = deliveryId;
  fillFrom($("orderSel").value);
  $("formErr").hidden = true;
  $("dlg").showModal();
}
function fillFrom(id) {   // preselect the route that matches the order's purok
  const d = deliveries.find(x => x.id === id);
  if (!d) return;
  $("routeSel").value = d.route;
  const [t, ap] = d.time.split(" "); let [h, m] = t.split(":").map(Number);
  if (ap === "PM" && h < 12) h += 12; if (ap === "AM" && h === 12) h = 0;
  $("timeInp").value = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
$("orderSel").onchange = e => fillFrom(e.target.value);
$("assignBtn").onclick = () => openAssign();
$("cancel").onclick = () => $("dlg").close();

$("assignForm").addEventListener("submit", async e => {
  const d = deliveries.find(x => x.id === $("orderSel").value);
  try {
    // const res = await fetch(`/api/deliveries/${d.id}/assign`, { method:"PATCH", credentials:"same-origin",
    //   headers:{ "Content-Type":"application/json" },
    //   body: JSON.stringify({ rider_id:..., route_id:..., scheduled_time:$("timeInp").value }) });
    // if (!res.ok) throw new Error((await res.json()).message);
    d.rider = $("riderSel").value;
    d.route = $("routeSel").value;
    const [h, m] = $("timeInp").value.split(":").map(Number);
    d.time = `${((h + 11) % 12) + 1}:${String(m).padStart(2,"0")} ${h < 12 ? "AM" : "PM"}`;
    render();
  } catch (err) {
    e.preventDefault(); $("formErr").textContent = err.message; $("formErr").hidden = false;
  }
});

render();