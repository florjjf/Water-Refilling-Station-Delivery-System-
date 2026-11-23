const PER_PAGE = 6, LOW_AT = 20, CAPACITY = 180;   // low-stock threshold and bar scale
let page = 1;

// ---- demo data: replace with GET /api/products and GET /api/stock-movements?page= ----
let products = [
  { id:1, code:"GAL-001", name:"Purified water", size:"5-gallon refill", price:35, stock:142 },
  { id:2, code:"GAL-002", name:"Mineral water",  size:"5-gallon refill", price:45, stock:28  },
  { id:3, code:"GAL-003", name:"Alkaline water", size:"5-gallon refill", price:60, stock:12  },
];
let movements = [
  { when:"Nov 20, 10:42 AM", product:"Purified water", type:"Order allocated",  qty:-4,  by:"Station admin", ref:"#WR-1048" },
  { when:"Nov 20, 10:30 AM", product:"Purified water", type:"Order allocated",  qty:-6,  by:"Station admin", ref:"#WR-1047" },
  { when:"Nov 20, 9:00 AM",  product:"Purified water", type:"Refill completed", qty:80,  by:"Station admin", ref:"STK-021" },
  { when:"Nov 20, 8:30 AM",  product:"Mineral water",  type:"Refill completed", qty:20,  by:"Station admin", ref:"STK-020" },
];
const emptyContainers = 86;     // comes from container records, not this table
const soldToday = 186, ordersToday = 48;

const $ = id => document.getElementById(id);
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const peso = n => "₱" + n.toLocaleString("en-PH");
const isLow = p => p.stock <= LOW_AT;
const nowStr = () => new Date().toLocaleString("en-PH", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }).replace(",", ", ");
let refSeq = 22;

// ---- stats + product cards ----
function renderCards() {
  const low = products.filter(isLow);
  $("gReady").textContent = products.reduce((s,p) => s + p.stock, 0);
  $("gEmpty").textContent = emptyContainers;
  $("gLow").textContent = low.length;
  $("gLowNote").textContent = low.length ? low.map(p => p.name).join(", ") + " needs a refill" : "All products well stocked";
  $("gSold").textContent = soldToday;
  $("gSoldNote").textContent = `Across ${ordersToday} customer orders`;

  $("products").replaceChildren(...products.map(p => {
    const card = el("article", null, "card product");
    const top = el("div", null, "top");
    top.append(el("h3", p.name), el("span", isLow(p) ? "Low stock" : "In stock", "tag " + (isLow(p) ? "amber" : "green")));
    const meter = el("div", null, "meter" + (isLow(p) ? " low" : ""));
    const bar = el("i"); bar.style.width = Math.min(100, p.stock / CAPACITY * 100) + "%"; meter.append(bar);
    const btn = el("button", "Update stock", "btn-outline"); btn.onclick = () => openStock(p.id);
    card.append(top, el("small", `${p.size} · ${p.code}`), el("div", peso(p.price), "price"),
                el("span", `${p.stock} filled gallons available`), meter, btn);
    return card;
  }));
}

// ---- movements table ----
function renderRows() {
  const pages = Math.max(1, Math.ceil(movements.length / PER_PAGE));
  page = Math.min(page, pages);
  const slice = movements.slice((page-1)*PER_PAGE, page*PER_PAGE);
  $("rows").replaceChildren(...slice.map(m => {
    const tr = el("tr");
    const q = el("td", (m.qty > 0 ? "+" : "−") + Math.abs(m.qty), m.qty > 0 ? "qty-in" : "qty-out");
    tr.append(el("td", m.when), el("td", m.product), el("td", m.type), q, el("td", m.by), el("td", m.ref));
    return tr;
  }));
  const from = movements.length ? (page-1)*PER_PAGE + 1 : 0;
  $("showing").textContent = `Showing ${from}-${movements.length ? from + slice.length - 1 : 0} of ${movements.length} records`;
  $("pg").textContent = page; $("prev").disabled = page === 1; $("next").disabled = page === pages;
}
$("prev").onclick = () => { page--; renderRows(); };
$("next").onclick = () => { page++; renderRows(); };
const render = () => { renderCards(); renderRows(); };

// ---- dialogs ----
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => $(b.dataset.close).close());

// Update stock
function openStock(productId) {
  $("prodSel").replaceChildren(...products.map(p => new Option(`${p.name} (${p.stock} in stock)`, p.id)));
  if (productId) $("prodSel").value = productId;
  $("moveSel").value = "in"; $("qty").value = ""; $("note").value = "";
  $("stockErr").hidden = true; syncStock();
  $("stockDlg").showModal();
}
function syncStock() {
  const p = products.find(x => x.id == $("prodSel").value), type = $("moveSel").value;
  const n = parseInt($("qty").value) || 0;
  $("qtyLabel").textContent = type === "fix" ? "Counted quantity" : "Quantity";
  $("preview").textContent = type === "in" ? p.stock + n : type === "out" ? p.stock - n : n;
}
["prodSel","moveSel","qty"].forEach(id => $(id).addEventListener("input", syncStock));
$("adjustBtn").onclick = () => openStock();

$("stockForm").addEventListener("submit", async e => {
  const p = products.find(x => x.id == $("prodSel").value), type = $("moveSel").value;
  const n = parseInt($("qty").value);
  const newLevel = type === "in" ? p.stock + n : type === "out" ? p.stock - n : n;
  if (!(n >= 0) || newLevel < 0) {
    e.preventDefault(); $("stockErr").textContent = "That would take stock below zero."; $("stockErr").hidden = false; return;
  }
  try {
    // await fetch("/api/stock-movements", { method:"POST", credentials:"same-origin",
    //   headers:{ "Content-Type":"application/json" },
    //   body: JSON.stringify({ product_id:p.id, type, quantity:n, note:$("note").value }) });   // server returns the new level
    const delta = newLevel - p.stock;
    if (delta === 0) return;
    p.stock = newLevel;
    movements.unshift({ when:nowStr(), product:p.name,
      type: type === "in" ? "Refill completed" : type === "out" ? "Damaged / lost" : "Count correction",
      qty:delta, by:$("meName")?.textContent || "Station admin", ref:"STK-0" + (refSeq++) });
    render();
  } catch (ex) { e.preventDefault(); $("stockErr").textContent = ex.message; $("stockErr").hidden = false; }
});

// Add product
$("addBtn").onclick = () => { $("addForm").reset(); $("pSize").value = "5-gallon refill"; $("addErr").hidden = true; $("addDlg").showModal(); };
$("addForm").addEventListener("submit", e => {
  const name = $("pName").value.trim();
  if (products.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    e.preventDefault(); $("addErr").textContent = "A product with that name already exists."; $("addErr").hidden = false; return;
  }
  const id = products.length + 1, stock = parseInt($("pStock").value) || 0;
  products.push({ id, code:"GAL-" + String(id).padStart(3,"0"), name, size:$("pSize").value.trim(), price:Number($("pPrice").value), stock });
  if (stock) movements.unshift({ when:nowStr(), product:name, type:"Opening stock", qty:stock, by:"Station admin", ref:"STK-0" + (refSeq++) });
  render();
});

render();