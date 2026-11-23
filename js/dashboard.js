// Sample data: replace with: const data = await (await fetch("/api/dashboard")).json();
const data = {
  stats:{ total:48, out:10, collected:6480, balance:1240 },
  volume:[["Sat",44,0],["Sun",25,0],["Mon",39,0],["Tue",31,0],["Wed",42,0],["Thu",37,0],["Fri",40,8]],
  team:[["Mark Santos","Pass 1-2 · 4 deliveries","On route"],
        ["Carlo Reyes","Purok 3-4 · 3 deliveries","On route"],
        ["Ana Cruz","Purok 5-6 · 3 deliveries","On route"]],
  orders:[["#WR-1049","Maria Dela Cruz",4,150,"On route","Unpaid"],
          ["#WR-1047","Jose Mendoza",6,195,"Delivered","Paid"],
          ["#WR-1046","Rose Garcia",3,105,"Pending","Unpaid"],
          ["#WR-1045","Benjie Ramos",5,260,"Delivered","Paid"],
          ["#WR-1043","Liza Fernandez",2,175,"On route","Partial"]]
};

const peso = n => "₱" + n.toLocaleString("en-PH");
const $ = id => document.getElementById(id);
const el = (tag, text) => Object.assign(document.createElement(tag), { textContent: text });

// header + cards
$("today").textContent = new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
$("sTotal").textContent = data.stats.total;
$("sOut").textContent = data.stats.out;
$("sCollected").textContent = peso(data.stats.collected);
$("sBalance").textContent = peso(data.stats.balance);
$("sOutNote").textContent = "riders on the road";
$("sBalanceNote").textContent = "customers with unpaid balances";
$("followAmt").textContent = peso(data.stats.balance);

// bar chart (plain divs, no library needed)
const max = Math.max(...data.volume.map(v => v[1] + v[2]));
data.volume.forEach(([day, done, prog]) => {
  const col = el("div"); col.className = "bar-col";
  col.append(el("span", done + prog));
  const bar = el("div"); bar.className = "bar";
  bar.style.height = ((done + prog) / max * 150) + "px";
  const d = el("div"); d.className = "d"; d.style.height = (done/(done+prog)*100) + "%";
  const p = el("div"); p.className = "p"; p.style.height = (prog/(done+prog)*100) + "%";
  bar.append(d, p); col.append(bar, el("span", day));
  $("chart").append(col);
});

// delivery team
data.team.forEach(([name, info, status]) => {
  const li = el("li"); const box = el("div");
  const s = el("strong", name); box.append(s, el("small", info));
  const tag = el("span", status); tag.className = "tag";
  li.append(box, tag); $("team").append(li);
});

// orders table; textContent keeps it XSS-safe, as in your security design
const tagClass = { "Delivered":"green","Paid":"green","On route":"","Pending":"amber","Unpaid":"red","Partial":"amber" };
data.orders.forEach(([id, cust, gal, amt, del, pay]) => {
  const tr = el("tr");
  [id, cust, gal, peso(amt)].forEach(v => tr.append(el("td", v)));
  [del, pay].forEach(v => { const td = el("td"); const t = el("span", v); t.className = "tag " + tagClass[v]; td.append(t); tr.append(td); });
  tr.append(el("td", "⋯")); $("orders").append(tr);
});