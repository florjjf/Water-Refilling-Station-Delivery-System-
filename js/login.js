const form = document.getElementById("loginForm");
const pw = document.getElementById("password");
const err = document.getElementById("error");

document.getElementById("toggle").addEventListener("click", e => {
  const show = pw.type === "password";
  pw.type = show ? "text" : "password";
  e.target.textContent = show ? "Hide" : "Show";
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  err.hidden = true;
  const username = form.username.value.trim();
  if (!username || !pw.value) {
    err.textContent = "Please enter your username and password.";
    err.hidden = false;
    return;
  }
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: pw.value })
    });
    if (!res.ok) throw new Error();
    const { role } = await res.json();
    location.href = role === "rider" ? "deliveries.html" : "dashboard.html";
  } catch {
    // generic message, as required in your security design
    err.textContent = "Invalid credentials. Please try again.";
    err.hidden = false;
  }
});