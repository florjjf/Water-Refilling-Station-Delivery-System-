// ---- demo data: replace with GET /api/customers, /api/products, /api/routes, /api/riders?available=1 ----
const DEPOSIT = 150;                      // per container; should come from a settings table
const customers = [
  { id:1, code:"CUS-001", name:"Maria Dela Cruz", phone:"0917 234 5601", address:"Purok 2, Brgy. 10" },
  { id:2, code:"CUS-002", name:"Jose Mendoza",    phone:"0918 345 6702", address:"Purok 1, Brgy. 10" },
  { id:3, code:"CUS-003", name:"Rosa Garcia",     phone:"0919 456 7803", address:"Purok 4, Brgy. 10" },
  { id:4, code:"CUS-004", name:"Benjie Ramos",    phone:"0920 567 8904", address:"Purok 3, Brgy. 10" },
];
const products = [
  { id:1, name:"Purified water · 5-gallon refill", short:"Purified water", price:35 },
  { id:2, name:"Mineral water · 5-gallon refill",  short:"Mineral water",  price:45 },
  { id:3, name:"Alkaline water · 5-gallon refill", short:"Alkaline water", price:60 },
];
const routes   = [{ id:1, name:"Route A · Purok 1–2" }, { id:2, name:"Route B · Purok 3–4" }, { id:3, name:"Route C · Purok 5–6" }];
const riders   = [{ id:1, name:"Mark Santos", active:4, available:true },
                  { id:2, name:"Carlo Reyes", active:3, available:true },
                  { id:3, name:"Ana Cruz",    active:5, available:false }];

const $ = id => document.getElementById(id);
const peso = n => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits:2, maximumFractionDigits:2 });
const num = id => Math.max(0, parseInt($(id).value) || 0);

// ---- fill dropdowns ----
customers.forEach(c => $("customer").append(new Option(`${c.name} · ${c.code}`, c.id)));
products.forEach(p => $("product").append(new Option(p.name, p.id)));
$("route").append(new Option("Select route…", ""));
routes.forEach(r => $("route").append(new Option(r.name, r.id)));
$("rider").append(new Option("Assign later", ""));
riders.forEach(r => {
  const o = new Option(`${r.name} · ${r.active} active deliveries${r.available ? "" : " (unavailable)"}`, r.id);
  o.disabled = !r.available;
  $("rider").append(o);
});

// default schedule = next full hour
const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0);
$("when").value = new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,16);
$("when").min = new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);

// ---- customer autofill (?customer=CUS-001 preselects) ----
$("customer").onchange = () => {
  const c = customers.find(x => x.id == $("customer").value);
  $("phone").value = c ? c.phone : "";
  $("address").value = c ? c.address : "";
};
const pre = new URLSearchParams(location.search).get("customer");
const preC = customers.find(c => c.code === pre);
if (preC) { $("customer").value = preC.id; $("customer").onchange(); }

// ---- pricing ----
let depTouched = false;
function recalc() {
  const p = products.find(x => x.id == $("product").value);
  const qty = num("qty"), returned = num("returned");
  $("price").value = peso(p.price);

  // suggest new containers = gallons not covered by returns, unless user typed their own value
  if (!depTouched) $("newCont").value = Math.max(0, qty - returned);
  const fresh = num("newCont");

  const itemAmt = p.price * qty, deposit = fresh * DEPOSIT;
  $("sumItem").textContent = `${qty} × ${p.short}`;
  $("sumItemAmt").textContent = peso(itemAmt);
  $("sumDep").textContent = peso(deposit);
  $("sumTotal").textContent = peso(itemAmt + deposit);
  $("depHint").textContent = `${fresh} · ${peso(DEPOSIT)} deposit per container`;
  $("returnMsg").textContent = returned
    ? `Customer will return ${returned} empty container${returned > 1 ? "s" : ""}.` + (fresh ? "" : " No new deposit is needed.")
    : "No empty containers returned.";
}
["product","qty","returned"].forEach(id => $(id).addEventListener("input", () => { depTouched = false; recalc(); }));
$("newCont").addEventListener("input", () => { depTouched = true; recalc(); });
recalc();

// ---- submit ----
$("orderForm").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("formErr"); err.hidden = true;
  const problems = [];
  if (!$("customer").value) problems.push("Select a customer.");
  if (num("qty") < 1) problems.push("Quantity must be at least 1.");
  if (!$("when").value) problems.push("Choose a delivery schedule.");
  if (!$("route").value) problems.push("Choose a delivery route.");
  if (problems.length) { err.textContent = problems.join(" "); err.hidden = false; return; }

  // Never send prices or totals: the server calculates them.
  const payload = {
    customer_id: +$("customer").value,
    delivery_address: $("address").value.trim(),
    product_id: +$("product").value,
    quantity: num("qty"),
    containers_returned: num("returned"),
    new_containers: num("newCont"),
    notes: $("notes").value.trim(),
    scheduled_at: $("when").value,
    route_id: +$("route").value,
    rider_id: $("rider").value ? +$("rider").value : null
  };

  try {
    // const res = await fetch("/api/orders", { method:"POST", credentials:"same-origin",
    //   headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    // if (!res.ok) throw new Error((await res.json()).message);
    // const saved = await res.json();
    // location.href = "orders.html?saved=" + saved.id;
    console.log("Would POST:", payload);
    alert("Order saved (demo). Check the console for the payload.");
    location.href = "orders.html";
  } catch (ex) {
    err.textContent = ex.message || "Could not save the order. Please try again.";
    err.hidden = false;
  }
});