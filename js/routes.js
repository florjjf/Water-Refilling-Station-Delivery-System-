let editing = null;

// ---- demo data: replace with GET /api/routes and GET /api/riders ----
const riderList = [ { name:"Mark Santos", off:false, active:4 }, { name:"Carlo Reyes", off:false, active:3 },
                    { name:"Ana Cruz", off:false, active:3 },    { name:"Paolo Lim", off:true, active:0 } ];
let routes = [
  { id:"RTE-001", name:"Route A", dest:"Purok 1–2", notes:"Residential deliveries, main road",  rider:"Mark Santos", active:true },
  { id:"RTE-002", name:"Route B", dest:"Purok 3–4", notes:"Residential and small businesses",   rider:"Carlo Reyes", active:true },
  { id:"RTE-003", name:"Route C", dest:"Purok 5–6", notes:"Residential deliveries, inner roads", rider:"Ana Cruz",    active:true },
];
const pendingAssignment = 6;      // from the Deliveries table

const $ = id => document.getElementById(id);
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const two = (a, b) => { const td = el("td", null, "cust"); td.append(el("strong", a), el("small", b)); return td; };
const activeOf = rider => (riderList.find(r => r.name === rider) || {}).active || 0;   // API: deliveries in progress on this route
const plural = n => n === 1 ? "1 delivery" : `${n} deliveries`;

// "Purok 1–2" -> [1,2]; "Purok 3" -> [3]
function purokSet(text) {
  const m = text.match(/(\d+)\s*[–-]\s*(\d+)/), one = text.match(/(\d+)/);
  if (m) return Array.from({ length: +m[2] - +m[1] + 1 }, (_, i) => +m[1] + i);
  return one ? [+one[1]] : [];
}

function render() {
  const live = routes.filter(r => r.active);
  $("sRoutes").textContent = live.length;
  $("sPuroks").textContent = new Set(live.flatMap(r => purokSet(r.dest))).size;
  $("sRiders").textContent = new Set(live.map(r => r.rider).filter(Boolean)).size;
  $("sPending").textContent = pendingAssignment;

  // cards
  $("cards").replaceChildren(...routes.map(r => {
    const c = el("article", null, "card product");
    const top = el("div", null, "top");
    top.append(el("h3", r.name), el("span", r.active ? "Active" : "Inactive", "tag " + (r.active ? "green" : "gray")));
    const view = el("a", "View deliveries", "btn"); view.href = "deliveries.html?route=" + encodeURIComponent(r.name);
    const edit = el("button", "Edit route", "btn-outline"); edit.onclick = () => openForm(r);
    const btns = el("div", null, "row-btns"); btns.append(view, edit);
    c.append(top, el("div", r.dest, "price"), el("small", "Barangay 10, Impalambong"),
             el("small", "Assigned rider"), el("strong", r.rider || "Not assigned"),
             el("small", `${plural(activeOf(r.rider))} currently on route`), btns);
    return c;
  }));

  // table
  $("rows").replaceChildren(...routes.map(r => {
    const tr = el("tr");
    const st = el("td"); st.append(el("span", r.active ? "Active" : "Inactive", "tag " + (r.active ? "green" : "gray")));
    const a = el("a", "Edit route"); a.href = "#"; a.onclick = ev => { ev.preventDefault(); openForm(r); };
    const act = el("td"); act.append(a);
    tr.append(two(r.name, r.id), el("td", r.dest), el("td", r.notes || "—"), el("td", r.rider || "Not assigned"), st, act);
    return tr;
  }));
}

// ---- Add / edit ----
function fillRiders(current) {
  // a rider can serve only one active route, so hide riders already taken (and off-duty riders)
  const taken = new Set(routes.filter(r => r.active && r !== editing).map(r => r.rider));
  $("rRider").replaceChildren(new Option("Not assigned", ""));
  riderList.forEach(r => {
    const o = new Option(r.name + (r.off ? " (off duty)" : taken.has(r.name) ? " (on another route)" : ""), r.name);
    o.disabled = (r.off || taken.has(r.name)) && r.name !== current;
    $("rRider").append(o);
  });
  $("rRider").value = current || "";
}
function openForm(route) {
  editing = route || null;
  $("routeForm").reset(); $("formErr").hidden = true;
  $("dlgTitle").textContent = route ? "Edit route" : "Add route";
  if (route) { $("rName").value = route.name; $("rDest").value = route.dest; $("rNotes").value = route.notes; $("rActive").checked = route.active; }
  else $("rName").value = "Route " + String.fromCharCode(65 + routes.length);   // Route D, E, ...
  fillRiders(route && route.rider);
  $("routeDlg").showModal();
}
$("addBtn").onclick = () => openForm();
$("cancel").onclick = () => $("routeDlg").close();

$("routeForm").addEventListener("submit", async e => {
  const f = { name:$("rName").value.trim(), dest:$("rDest").value.trim(), notes:$("rNotes").value.trim(),
              rider:$("rRider").value || null, active:$("rActive").checked };
  const err = $("formErr");
  const fail = msg => { e.preventDefault(); err.textContent = msg; err.hidden = false; };

  if (routes.some(r => r !== editing && r.name.toLowerCase() === f.name.toLowerCase())) return fail("A route with that name already exists.");
  if (!purokSet(f.dest).length) return fail("Enter the puroks it covers, for example “Purok 7–8”.");
  if (!f.active && editing && activeOf(editing.rider) > 0) return fail("This route still has deliveries in progress. Finish or reassign them first.");
  if (f.active && f.rider && routes.some(r => r !== editing && r.active && r.rider === f.rider)) return fail("That rider is already assigned to another active route.");

  try {
    if (editing) {
      // await fetch(`/api/routes/${editing.id}`, { method:"PATCH", credentials:"same-origin", headers:{...}, body: JSON.stringify(f) });
      Object.assign(editing, f);
    } else {
      // await fetch("/api/routes", { method:"POST", credentials:"same-origin", headers:{...}, body: JSON.stringify(f) });
      routes.push({ id:"RTE-" + String(routes.length + 1).padStart(3, "0"), ...f });
    }
    render();
  } catch (ex) { fail(ex.message); }
});

render();