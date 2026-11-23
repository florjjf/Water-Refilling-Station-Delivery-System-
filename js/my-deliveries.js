// ---- demo data: replace with GET /api/my-deliveries (the SERVER picks the rider from the session) ----
let completed = 12;
const route = "Route A · Purok 1–2";
let stops = [
  { id:"WR-1048", customer:"Maria Dela Cruz", purok:"Purok 2", qty:4, product:"Purified water", status:"On route",
    address:"Purok 2, Barangay 10, Impalambong, Malaybalay City", phone:"0917 234 5601",
    notes:"Please deliver to the blue gate. Collect 4 empty containers." },
  { id:"WR-1042", customer:"Pedro Aquino",    purok:"Purok 1", qty:3, product:"Purified water", status:"On route",
    address:"Purok 1, Barangay 10, Impalambong, Malaybalay City", phone:"0921 555 0142", notes:"" },
  { id:"WR-1041", customer:"Elena Torres",    purok:"Purok 2", qty:5, product:"Purified water", status:"On route",
    address:"Purok 2, Barangay 10, Impalambong, Malaybalay City", phone:"0921 555 0141", notes:"" },
  { id:"WR-1040", customer:"Daniel Flores",   purok:"Purok 1", qty:4, product:"Purified water", status:"On route",
    address:"Purok 1, Barangay 10, Impalambong, Malaybalay City", phone:"0921 555 0140", notes:"" },
];
// The only legal moves (matches your Process 4): Pending -> On route -> Delivered
const nextStep = { "Pending":"On route", "On route":"Delivered" };
const buttonText = { "On route":"Start delivery", "Delivered":"Confirm delivery" };

const $ = id => document.getElementById(id);
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
let selected = stops[0]?.id;

function render() {
  const sel = stops.find(s => s.id === selected) || stops[0];
  selected = sel?.id;

  // stats
  const gallons = stops.reduce((s, x) => s + x.qty, 0);
  const road = stops.filter(s => s.status === "On route").length;
  $("kAssigned").textContent = stops.length + completed;
  $("kRoute").textContent = route;
  $("kRoad").textContent = road;
  $("kNext").textContent = stops[0] ? "Next stop: " + stops[0].customer : "No stops left";
  $("kDone").textContent = completed;
  $("kCheer").textContent = "Keep up the good work";
  $("kGallons").textContent = gallons;
  $("kStops").textContent = `Across ${plural(stops.length, "remaining stop")}`;

  // stops list
  $("empty").hidden = stops.length > 0;
  $("detail").hidden = stops.length === 0;
  $("stops").replaceChildren(...stops.map((s, i) => {
    const b = el("button", null, "stop" + (s.id === selected ? " sel" : ""));
    b.type = "button";
    const who = el("div", null, "who");
    who.append(el("strong", s.customer), el("small", `${s.purok} · ${plural(s.qty, "gallon")} · #${s.id}`));
    const tag = i === 0 ? "Next stop" : s.status;
    b.append(el("span", String(i + 1).padStart(2, "0"), "n"), who, el("span", tag, "tag blue"));
    b.onclick = () => { selected = s.id; render(); if (innerWidth < 1000) $("detail").scrollIntoView({ behavior:"smooth" }); };
    return b;
  }));

  if (sel) renderDetail(sel);
}

function renderDetail(s) {
  $("dOrder").textContent = "#" + s.id;
  $("dTag").textContent = s.status; $("dTag").className = "tag " + (s.status === "On route" ? "blue" : "amber");
  $("dName").textContent = s.customer;
  $("dAddr").textContent = s.address;
  $("dPhone").textContent = s.phone; $("dPhone").href = "tel:" + s.phone.replace(/\s/g, "");
  $("dItems").textContent = `${s.qty} × ${s.product} (5 gallons)`;
  $("dNotes").textContent = s.notes || "No special instructions.";
  // only the next legal status is offered
  $("status").replaceChildren(new Option(nextStep[s.status], nextStep[s.status]));
  $("confirm").textContent = buttonText[nextStep[s.status]];
  $("note").value = ""; $("err").hidden = true;
}

function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.id); toast.id = setTimeout(() => t.hidden = true, 3000);
}

$("confirm").onclick = async () => {
  const s = stops.find(x => x.id === selected); if (!s) return;
  const to = $("status").value;
  const btn = $("confirm"); btn.disabled = true; $("err").hidden = true;
  try {
    // const res = await fetch(`/api/deliveries/${s.id}/status`, { method:"PATCH", credentials:"same-origin",
    //   headers:{ "Content-Type":"application/json" },
    //   body: JSON.stringify({ status: to, note: $("note").value.trim() }) });
    // if (!res.ok) throw new Error((await res.json()).message);   // 403 if not assigned to you; 409 if illegal transition
    if (to === "Delivered") {
      stops = stops.filter(x => x.id !== s.id); completed++;
      selected = stops[0]?.id;
      toast(`Delivered to ${s.customer}. ${stops.length ? "Next: " + stops[0].customer : "All deliveries done!"}`);
    } else {
      s.status = to; toast(`Started delivery to ${s.customer}.`);
    }
    render();
  } catch (ex) {
    $("err").textContent = ex.message || "Could not update. Please try again."; $("err").hidden = false;
  } finally { btn.disabled = false; }
};

(async () => {
  const user = await window.userReady;
  const h = new Date().getHours();
  $("greeting").textContent = `Good ${h < 12 ? "morning" : h < 18 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}. Here’s your delivery list for today.`;
  $("today").textContent = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  render();
})();