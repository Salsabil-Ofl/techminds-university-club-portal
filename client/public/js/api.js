/* =========================================================
   api.js - Connects the static pages to the server API
   - Loads events, members and news from the database
   - Falls back to the sample data in data.js if offline
   - esc() escapes text before it is placed in innerHTML
   ========================================================= */

/* Escape text for safe use inside HTML */
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* POST JSON to the API and return { ok, status, data } */
async function apiPost(url, body) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: "Network error. Check your connection and try again." } };
  }
}

/* Replace the contents of an array in place (data.js uses const arrays) */
function replaceArray(target, items) {
  target.splice(0, target.length, ...items);
}

/* Promise that resolves when live content is ready (pages wait for it) */
window.CLUB_READY = (async function loadContent() {
  try {
    const res = await fetch("/api/public/content", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (Array.isArray(data.events)) replaceArray(EVENTS, data.events);
    if (Array.isArray(data.members)) replaceArray(MEMBERS, data.members);
    if (Array.isArray(data.news)) replaceArray(NEWS, data.news);
    window.CLUB_LIVE = true;
  } catch (err) {
    console.warn("Using offline sample data:", err.message);
    window.CLUB_LIVE = false;
  }
})();

/* Tickets this browser has booked (only ticket info, the server is the source of truth) */
function getMyTickets() {
  try { return JSON.parse(localStorage.getItem("registrations") || "[]"); } catch (e) { return []; }
}
function saveMyTickets(list) {
  localStorage.setItem("registrations", JSON.stringify(list));
}
