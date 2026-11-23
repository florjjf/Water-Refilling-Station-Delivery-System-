// Calls GET /api/me. The fallback is for offline demo only: add ?role=rider to any URL to try the rider view.
async function getUser() {
  try {
    const r = await fetch("/api/me", { credentials: "same-origin" });
    if (r.status === 401) { location.href = "login.html"; return new Promise(() => {}); }
    return await r.json();
  } catch {
    const role = new URLSearchParams(location.search).get("role") || "owner";   // DEMO ONLY: delete when the API exists
    return role === "rider" ? { name: "Mark Santos", role } : { name: "Station admin", role };
  }
}

window.userReady = (async () => {
  const user = await getUser();

  // Page guard: <body data-allow="owner,staff"> restricts a page. The backend still enforces this.
  const allow = document.body.dataset.allow;
  if (allow && !allow.split(",").includes(user.role)) {
    location.replace(user.role === "rider" ? "my-deliveries.html" : "dashboard.html");
    return user;
  }

  // hide menu items this role can't use
  document.querySelectorAll("[data-roles]").forEach(el => {
    if (!el.dataset.roles.split(",").includes(user.role)) el.remove();
  });

  const label = { owner: "Admin", staff: "Staff", rider: "Rider" }[user.role];
  const tag = document.getElementById("workspaceTag"); if (tag) tag.textContent = label + " workspace";
  document.getElementById("meName").textContent = user.name;
  document.getElementById("meRole").textContent = { owner: "Owner account", staff: "Staff account", rider: "Delivery rider" }[user.role];
  document.getElementById("meInitials").textContent = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  document.getElementById("logout").onclick = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    location.href = "login.html";
  };
  lucide.createIcons();
  return user;
})();