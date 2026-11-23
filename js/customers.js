const PER_PAGE = 6;
let filter = "all", query = "", page = 1;

// Demo data: replace loadCustomers() with fetch("/api/customers?filter=..&q=..&page=..")
let customers = [
  { id:"CUS-001", name:"Maria Dela Cruz", phone:"0917 234 5601", address:"Purok 2, Brgy. 10", orders:24, balance:140, deposits:2 },
  { id:"CUS-002", name:"Jose Mendoza",    phone:"0918 345 6702", address:"Purok 1, Brgy. 10", orders:18, balance:0,   deposits:0 },
  { id:"CUS-003", name:"Rosa Garcia",     phone:"0919 456 7803", address:"Purok 4, Brgy. 10", orders:12, balance:105, deposits:3 },
  { id:"CUS-004", name:"Benjie Ramos",    phone:"0920 567 8904", address:"Purok 3, Brgy. 10", orders:31, balance:0,   deposits:2 },
  { id:"CUS-005", name:"Lita Fernandez",  phone:"0921 678 9005", address:"Purok 5, Brgy. 10", orders:16, balance:75,  deposits:0 },
  { id:"CUS-006", name:"Ana Villanueva",  phone:"0922 789 0106", address:"Purok 6, Brgy. 10", orders:9,  balance:0,   deposits:1 },
];

const $ = id => document.getElementById(id);
const peso = n => "₱" + n.toLocaleString("en-PH");
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };

function filtered() {
  const q = query.toLowerCase();
  return customers.filter(c =>
    (filter === "all" || (filter === "balances" && c.balance > 0) || (filter === "deposits" && c.deposits > 0)) &&
    (!q || c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g,"").includes(q.replace(/\s/g,""))));
}

function render() {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  page = Math.min(page, pages);
  const slice = list.slice((page-1)*PER_PAGE, page*PER_PAGE);

  $("rows").replaceChildren(...slice.map(c => {
    const tr = el("tr");
    const who = el("td", null, "cust"); who.append(el("strong", c.name), el("small", c.id));
    const a = el("a", "View profile"); a.href = "customer.html?id=" + encodeURIComponent(c.id);
    const act = el("td"); act.append(a);
    tr.append(who, el("td", c.phone), el("td", c.address), el("td", c.orders), el("td", peso(c.balance)), act);
    return tr;
  }));

  const from = list.length ? (page-1)*PER_PAGE + 1 : 0;
  $("showing").textContent = `Showing ${from}-${from + slice.length - (list.length ? 1 : 0)} of ${list.length} records`;
  $("pg").textContent = page;
  $("prev").disabled = page === 1;
  $("next").disabled = page === pages;

  // stat cards
  const owing = customers.filter(c => c.balance > 0);
  $("cTotal").textContent = customers.length;
  $("cActive").textContent = customers.length;       // real value comes from the API
  $("cUnpaid").textContent = owing.length;
  $("cUnpaidNote").textContent = peso(owing.reduce((s,c) => s + c.balance, 0)) + " to collect";
  $("cCont").textContent = customers.reduce((s,c) => s + c.deposits, 0);
  $("cContNote").textContent = "in refundable deposits";
}

// tabs, search, paging
$("chips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  document.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b));
  filter = b.dataset.f; page = 1; render();
});
$("q").addEventListener("input", e => { query = e.target.value.trim(); page = 1; render(); });
$("prev").onclick = () => { page--; render(); };
$("next").onclick = () => { page++; render(); };

// add-customer modal
$("addBtn").onclick = () => { $("addForm").reset(); $("formErr").hidden = true; $("dlg").showModal(); };
$("cancel").onclick = () => $("dlg").close();
$("addForm").addEventListener("submit", async e => {
  const f = e.target;
  try {
    // const res = await fetch("/api/customers", { method:"POST", credentials:"same-origin",
    //   headers:{ "Content-Type":"application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(f))) });
    // if (!res.ok) throw new Error((await res.json()).message);
    customers.unshift({ id:"CUS-" + String(customers.length+1).padStart(3,"0"),
      name:f.name.value.trim(), phone:f.phone.value, address:f.address.value.trim(),
      orders:0, balance:0, deposits:0 });
    render();
  } catch (err) {
    e.preventDefault(); $("formErr").textContent = err.message; $("formErr").hidden = false;
  }
});

// Export visible filter as CSV
$("exportBtn").onclick = () => {
  const rows = [["ID","Name","Phone","Address","Orders","Balance"],
    ...filtered().map(c => [c.id,c.name,c.phone,c.address,c.orders,c.balance])];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"),
    { href: URL.createObjectURL(new Blob([csv], {type:"text/csv"})), download:"customers.csv" });
  a.click();
};

render();