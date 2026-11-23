// ---- demo data: replace with GET /api/settings, GET /api/users ----
const me = "admin@aguavita.local";           // from GET /api/me
const station = { name:"AguaVita Water Refilling Station", location:"Brgy. 10, Impalambong, Malaybalay City", phone:"0917 700 2026" };
let users = [
  { name:"Station admin",   user:"admin@aguavita.local",   role:"owner", active:true },
  { name:"Station cashier", user:"cashier@aguavita.local", role:"staff", active:true },
  { name:"Mark Santos",     user:"mark@aguavita.local",    role:"rider", active:true },
  { name:"Carlo Reyes",     user:"carlo@aguavita.local",   role:"rider", active:true },
  { name:"Ana Cruz",        user:"ana@aguavita.local",     role:"rider", active:true },
];
const roleName = { owner:"Owner", staff:"Staff / Cashier", rider:"Delivery rider" };
const roleAccess = { owner:"All station modules", staff:"Customer, order & payment records", rider:"Assigned deliveries only" };

const $ = id => document.getElementById(id);
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const two = (a, b) => { const td = el("td", null, "cust"); td.append(el("strong", a), el("small", b)); return td; };
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => $(b.dataset.close).close());
const owners = () => users.filter(u => u.role === "owner" && u.active).length;

// ---- station information ----
$("sName").value = station.name; $("sLoc").value = station.location; $("sPhone").value = station.phone;
$("stationForm").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("stationErr"); err.hidden = true; $("saved").hidden = true;
  if (!$("stationForm").checkValidity()) { err.textContent = "Please complete every field. The contact number should look like 0917 700 2026."; err.hidden = false; return; }
  try {
    // await fetch("/api/settings", { method:"PUT", credentials:"same-origin", headers:{...}, body: JSON.stringify({ name, location, phone }) });
    Object.assign(station, { name:$("sName").value.trim(), location:$("sLoc").value.trim(), phone:$("sPhone").value.trim() });
    $("saved").hidden = false; setTimeout(() => $("saved").hidden = true, 3000);
  } catch (ex) { err.textContent = ex.message; err.hidden = false; }
});

// ---- accounts table ----
function render() {
  $("rows").replaceChildren(...users.map(u => {
    const tr = el("tr");
    const st = el("td"); st.append(el("span", u.active ? "Active" : "Disabled", "tag " + (u.active ? "green" : "gray")));
    const a = el("a", "Manage account"); a.href = "#"; a.onclick = ev => { ev.preventDefault(); openManage(u); };
    const act = el("td"); act.append(a);
    tr.append(two(u.name, u.user), el("td", roleName[u.role]), el("td", roleAccess[u.role]), st, act);
    return tr;
  }));
}

// ---- create account ----
$("createBtn").onclick = () => { $("createForm").reset(); $("createErr").hidden = true; $("riderHint").hidden = true; $("createDlg").showModal(); };
$("cRole").onchange = () => $("riderHint").hidden = $("cRole").value !== "rider";
$("createForm").addEventListener("submit", async e => {
  const f = { name:$("cName").value.trim(), user:$("cUser").value.trim().toLowerCase(), role:$("cRole").value };
  const fail = m => { e.preventDefault(); $("createErr").textContent = m; $("createErr").hidden = false; };
  if (users.some(u => u.user === f.user)) return fail("That email or username is already in use.");
  if ($("cPass").value.length < 8) return fail("The temporary password needs at least 8 characters.");
  try {
    // await fetch("/api/users", { method:"POST", credentials:"same-origin", headers:{...},
    //   body: JSON.stringify({ ...f, temp_password:$("cPass").value }) });   // server hashes it; never stored or logged in plain text
    users.push({ ...f, active:true }); render();
  } catch (ex) { fail(ex.message); }
});

// ---- manage account ----
let managing = null;
function openManage(u) {
  managing = u;
  $("mTitle").textContent = u.name;
  $("mUser").value = u.user; $("mRole").value = u.role; $("mActive").checked = u.active;
  const self = u.user === me;                                    // you can't lock yourself out
  $("mRole").disabled = $("mActive").disabled = self;
  $("resetOut").hidden = true; $("manageErr").hidden = true;
  $("manageDlg").showModal();
}
$("manageForm").addEventListener("submit", async e => {
  const role = $("mRole").value, active = $("mActive").checked;
  const lastOwner = managing.role === "owner" && managing.active && owners() === 1;
  if (lastOwner && (role !== "owner" || !active)) {
    e.preventDefault(); $("manageErr").textContent = "There must always be at least one active owner."; $("manageErr").hidden = false; return;
  }
  try {
    // await fetch(`/api/users/${id}`, { method:"PATCH", credentials:"same-origin", headers:{...}, body: JSON.stringify({ role, active }) });
    managing.role = role; managing.active = active; render();
  } catch (ex) { e.preventDefault(); $("manageErr").textContent = ex.message; $("manageErr").hidden = false; }
});

$("resetBtn").onclick = async () => {
  // Real version: POST /api/users/<id>/reset-password -> server generates the one-time password and flags must_change_password
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const temp = Array.from(crypto.getRandomValues(new Uint32Array(10)), n => chars[n % chars.length]).join("");
  $("resetOut").textContent = `Temporary password: ${temp}. Share it privately. It is shown only once and must be changed at the next sign-in.`;
  $("resetOut").hidden = false;
};

render();