// ---- demo data: replace loadReport() with fetch(`/api/reports?days=${days}&end=${yyyy-mm-dd}`) ----
// Order volume, oldest -> newest (the last item is "today"). [delivered, in progress]
const volume = [[29,5],[24,4],[33,6],[26,5],[36,6],[37,6],[32,16]];
const today = { delivered:32, road:10, waiting:6, gallons:186, collected:6480, paidOrders:32, ordersToday:48 };
const outstanding = { amount:1240, customers:8 };
const perRoute = [
  { route:"Route A · Purok 1–2", rider:"Mark Santos", delivered:12, onRoute:4, collections:2430 },
  { route:"Route B · Purok 3–4", rider:"Carlo Reyes", delivered:11, onRoute:3, collections:2160 },
  { route:"Route C · Purok 5–6", rider:"Ana Cruz",    delivered:9,  onRoute:3, collections:1890 },
];

const $ = id => document.getElementById(id);
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const peso = n => "₱" + n.toLocaleString("en-PH");
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const short = d => d.toLocaleDateString("en-US", { month:"short", day:"numeric" });

let endDate = new Date(); endDate.setHours(0,0,0,0);

function render() {
  const days = volume.length;
  const start = new Date(endDate); start.setDate(start.getDate() - (days - 1));
  const label = `${short(start)} – ${endDate.getDate()}, ${endDate.getFullYear()}`
                .replace(/^(\w+ \d+) – (\d+)/, (m, a, b) => start.getMonth() === endDate.getMonth() ? `${a}–${b}` : m);
  $("rangeBtn").textContent = label;
  $("chartRange").textContent = `${short(start)} – ${short(endDate)} ${endDate.getFullYear()}`;

  // stat cards
  const totals = volume.map(([d, p]) => d + p);
  $("kOrders").textContent = totals.reduce((a, b) => a + b, 0);
  $("kOrdersNote").textContent = totals.join(" · ");
  $("kCollected").textContent = peso(today.collected);
  $("kCollectedNote").textContent = `${today.paidOrders} fully paid orders`;
  $("kBalance").textContent = peso(outstanding.amount);
  $("kBalanceNote").textContent = `${outstanding.customers} customer accounts`;
  $("kRate").textContent = pct(today.delivered, today.ordersToday) + "%";
  $("kRateNote").textContent = `${today.delivered} of ${today.ordersToday} orders delivered`;

  // chart
  const max = Math.max(...totals);
  $("chart").replaceChildren(...volume.map(([done, prog], i) => {
    const day = new Date(endDate); day.setDate(day.getDate() - (days - 1 - i));
    const col = el("div", null, "bar-col" + (i === days - 1 ? " today" : ""));
    const bar = el("div", null, "bar"); bar.style.height = ((done + prog) / max * 150) + "px";
    bar.title = `${short(day)}: ${done} delivered, ${prog} in progress`;
    const d = el("div", null, "d"); d.style.height = pct(done, done + prog) + "%";
    const p = el("div", null, "p"); p.style.height = pct(prog, done + prog) + "%";
    bar.append(d, p);
    col.append(el("span", done + prog), bar, el("span", day.toLocaleDateString("en-US", { weekday:"short" })));
    return col;
  }));
  $("chartSummary").textContent = `${today.delivered} delivered / ${today.road} on the road / ${today.waiting} awaiting dispatch`;

  // today at a glance
  $("gDelivered").textContent = today.delivered;
  $("gRoad").textContent = today.road;
  $("gWait").textContent = today.waiting;
  $("gGallons").textContent = today.gallons;
  $("updated").textContent = "Updated " + endDate.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });

  // per-route table (completion is derived: delivered ÷ (delivered + on route))
  $("rows").replaceChildren(...perRoute.map(r => {
    const tr = el("tr");
    [r.route, r.rider, r.delivered, r.onRoute, pct(r.delivered, r.delivered + r.onRoute) + "%", peso(r.collections)]
      .forEach((v, i) => tr.append(el("td", v, i === 0 ? "strong-cell" : null)));
    return tr;
  }));
}

// ---- date + range controls ----
$("rangeBtn").onclick = () => { $("rangeEnd").max = new Date().toISOString().slice(0,10); $("rangeEnd").showPicker?.(); };
$("rangeEnd").onchange = e => { if (e.target.value) { endDate = new Date(e.target.value + "T00:00"); render(); /* refetch for this end date */ } };
$("range").onchange = () => { /* refetch with ?days=7 or 30, then render() */ render(); };

// ---- Export report (CSV, everything on the page) ----
$("exportBtn").onclick = () => {
  const lines = [
    ["AguaVita report", $("rangeBtn").textContent],
    [],
    ["Order volume"], ["Date","Delivered","In progress","Total"],
    ...volume.map(([d, p], i) => { const day = new Date(endDate); day.setDate(day.getDate() - (volume.length - 1 - i));
                                    return [day.toISOString().slice(0,10), d, p, d + p]; }),
    [],
    ["Daily delivery performance"], ["Route","Rider","Delivered","On route","Completion %","Collections"],
    ...perRoute.map(r => [r.route, r.rider, r.delivered, r.onRoute, pct(r.delivered, r.delivered + r.onRoute), r.collections]),
    [],
    ["Collections today", today.collected], ["Outstanding balances", outstanding.amount],
  ];
  const csv = lines.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  Object.assign(document.createElement("a"),
    { href: URL.createObjectURL(new Blob([csv], { type:"text/csv" })), download:"aguavita-report.csv" }).click();
};

render();