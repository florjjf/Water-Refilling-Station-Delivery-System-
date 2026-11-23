const PER_PAGE = 6;
let page = 1, editing = null;

// ---- demo data: replace with GET /api/riders (with today's counts) ----
const routes = ["Route A · Purok 1–2", "Route B · Purok 3–4", "Route C · Purok 5–6"];
let riders = [
  { id:"RID-001", name:"Mark Santos", phone:"0917 800 1001", route:"Route A · Purok 1–2", active:4, done:12, off:false },
  { id:"RID-002", name:"Carlo Reyes", phone:"0918 800 1002", route:"Route B · Purok 3–4", active:3, done:11, off:false },
  { id:"RID-003", name:"Ana Cruz",    phone:"0919 800 1003", route:"Route C · Purok 5–6", active:3, done:9,  off:false },
  { id:"RID-004", name:"Paolo Lim",   phone:"0920 800 1004", route:null,                  active:0, done:0,  off:true  },
];
const unassignedDeliveries = 6;    // from the Deliveries table

const $ = id => document.getElementById(id);
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const two = (a, b) => { const td = el("td", null, "cust"); td.append(el("strong", a), el("small", b)); return td; };
const statusOf = r => r.off ? "Off duty" : r.active > 0 ? "On route" : "Available";   // derived, not typed in
const tagOf = { "On route":"blue", "Available":"green", "Off duty":"gray" };
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const assignmentsUrl = r => "deliveries.html?rider=" + encodeURIComponent(r.id);

function render() {
  // stats
  const onDuty = riders.filter(r => !r.off).length;
  $("rTotal").textContent = riders.length;
  $("rNote").textContent = `${onDuty} active · ${riders.length - onDuty} off duty`;
  $("rProgress").textContent = riders.reduce((s, r) => s + r.active, 0);
  $("rDone").textContent = riders.reduce((s, r) => s + r.done, 0);   // API: all of today's, incl. removed riders
  $("rUnassigned").textContent = unassignedDeliveries;

  // cards: riders who are on duty
  $("cards").replaceChildren(...riders.filter(r => !r.off).map(r => {
    const c = el("article", null, "card product");
    const top = el("div", null, "top");
    top.append(el("h3", r.name), el("span", statusOf(r), "tag " + tagOf[statusOf(r)]));
    const view = el("a", "View assignments", "btn"); view.href = assignmentsUrl(r);
    const edit = el("button", "Edit rider", "btn-outline"); edit.onclick = () => openForm(r);
    const btns = el("div", null, "row-btns"); btns.append(view, edit);
    c.append(top, el("small", r.route || "Not assigned"), el("div", plural(r.active, "active delivery").replace("deliverys","deliveries"), "accent"),
             el("small", r.phone), btns);
    return c;
  }));

  // table
  const pages = Math.max(1, Math.ceil(riders.length / PER_PAGE));
  page = Math.min(page, pages);
  const slice = riders.slice((page-1)*PER_PAGE, page*PER_PAGE);
  $("rows").replaceChildren(...slice.map(r => {
    const tr = el("tr");
    const st = el("td"); st.append(el("span", statusOf(r), "tag " + tagOf[statusOf(r)]));
    const a = el("a", "View rider"); a.href = "#"; a.onclick = ev => { ev.preventDefault(); openView(r); };
    const act = el("td"); act.append(a);
    tr.append(two(r.name, r.id), el("td", r.phone), el("td", r.route || "Not assigned"),
              el("td", r.active ? `${r.active} in progress · ${r.done} done` : `${r.active} deliveries`), st, act);
    return tr;
  }));
  const from = riders.length ? (page-1)*PER_PAGE + 1 : 0;
  $("showing").textContent = `Showing ${from}-${riders.length ? from + slice.length - 1 : 0} of ${riders.length} records`;
  $("pg").textContent = page; $("prev").disabled = page === 1; $("next").disabled = page === pages;
}
$("prev").onclick = () => { page--; render(); };
$("next").onclick = () => { page++; render(); };
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => $(b.dataset.close).close());

// ---- Add / edit ----
$("rRoute").append(new Option("Not assigned", ""));
routes.forEach(r => $("rRoute").append(new Option(r, r)));

function openForm(rider) {
  editing = rider || null;
  $("riderForm").reset(); $("formErr").hidden = true;
  $("dlgTitle").textContent = rider ? "Edit rider" : "Add rider";
  $("accountBox").hidden = !!rider;               // account fields only when creating
  $("rUser").required = $("rPass").required = !rider;
  if (rider) { $("rName").value = rider.name; $("rPhone").value = rider.phone; $("rRoute").value = rider.route || ""; $("rOff").checked = rider.off; }
  $("riderDlg").showModal();
}
$("addBtn").onclick = () => openForm();

$("riderForm").addEventListener("submit", async e => {
  const f = { name:$("rName").value.trim(), phone:$("rPhone").value.trim(), route:$("rRoute").value || null, off:$("rOff").checked };
  const err = $("formErr");
  const dupe = riders.some(r => r !== editing && r.name.toLowerCase() === f.name.toLowerCase());
  if (dupe) { e.preventDefault(); err.textContent = "A rider with that name already exists."; err.hidden = false; return; }
  if (f.off && editing && editing.active) {
    e.preventDefault(); err.textContent = "Reassign this rider's active deliveries before marking off duty."; err.hidden = false; return;
  }
  try {
    if (editing) {
      // await fetch(`/api/riders/${editing.id}`, { method:"PATCH", credentials:"same-origin", headers:{...}, body: JSON.stringify(f) });
      Object.assign(editing, f);
    } else {
      // await fetch("/api/riders", { method:"POST", ..., body: JSON.stringify({ ...f, username:$("rUser").value, temp_password:$("rPass").value }) });
      riders.push({ id:"RID-" + String(riders.length + 1).padStart(3, "0"), ...f, active:0, done:0 });
    }
    render();
  } catch (ex) { e.preventDefault(); err.textContent = ex.message; err.hidden = false; }
});

// ---- View rider ----
function openView(r) {
  $("vTitle").textContent = r.name;
  $("vLink").href = assignmentsUrl(r);
  const rows = [["Rider ID", r.id], ["Contact", r.phone], ["Assigned route", r.route || "Not assigned"],
                ["Availability", statusOf(r)], ["In progress", r.active], ["Completed today", r.done]];
  $("vBody").replaceChildren(...rows.map(([k, v]) => { const d = el("div"); d.append(el("dt", k), el("dd", v)); return d; }));
  $("viewDlg").showModal();
}

// ---- Export ----
$("exportBtn").onclick = () => {
  const rows = [["ID","Name","Contact","Route","Status","In progress","Done today"],
    ...riders.map(r => [r.id, r.name, r.phone, r.route || "", statusOf(r), r.active, r.done])];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  Object.assign(document.createElement("a"),
    { href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download:"riders.csv" }).click();
};

render();