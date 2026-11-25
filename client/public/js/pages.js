/* =========================================================
   pages.js - Page-specific logic
   Each function runs only if its page elements exist.
   ========================================================= */

/* ---------- HOME PAGE ---------- */
function initHome() {
  const featured = document.getElementById("featured-events");
  if (featured) {
    const upcoming = EVENTS.filter(e => isUpcoming(e.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
    featured.innerHTML = upcoming.map(eventCardHTML).join("");
  }

  const latest = document.getElementById("latest-news");
  if (latest) {
    const items = [...NEWS].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    latest.innerHTML = items.map(newsCardHTML).join("");
    initReadMore();
  }

  observeReveal();
  initCountdown();
}

/* Countdown to the next upcoming event */
function initCountdown() {
  const box = document.getElementById("countdown");
  if (!box) return;
  const next = EVENTS.filter(e => isUpcoming(e.date))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  if (!next) return;

  document.getElementById("next-title").textContent = next.title;
  document.getElementById("next-info").textContent = `${formatDate(next.date)} • ${next.location}`;
  document.getElementById("next-link").href = `register.html?event=${next.id}`;

  const target = new Date(next.date + "T10:00:00").getTime();
  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86400000); diff %= 86400000;
    const h = Math.floor(diff / 3600000); diff %= 3600000;
    const m = Math.floor(diff / 60000); diff %= 60000;
    const s = Math.floor(diff / 1000);
    box.innerHTML = [[d, "Days"], [h, "Hours"], [m, "Mins"], [s, "Secs"]]
      .map(([v, l]) => `<div><b>${String(v).padStart(2, "0")}</b><small>${l}</small></div>`).join("");
  }
  tick();
  setInterval(tick, 1000);
}

/* ---------- EVENTS PAGE: search + category filter + status tabs ---------- */
function initEvents() {
  const grid = document.getElementById("events-grid");
  if (!grid) return;

  const search = document.getElementById("event-search");
  const noResults = document.getElementById("no-results");
  const count = document.getElementById("results-count");
  let category = "All";
  let status = "upcoming";

  function render() {
    const term = search.value.toLowerCase().trim();
    const list = EVENTS.filter(ev => {
      const matchText = ev.title.toLowerCase().includes(term) ||
        ev.location.toLowerCase().includes(term) ||
        ev.category.toLowerCase().includes(term);
      const matchCat = category === "All" || ev.category === category;
      const matchStatus = status === "all" ||
        (status === "upcoming" ? isUpcoming(ev.date) : !isUpcoming(ev.date));
      return matchText && matchCat && matchStatus;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    grid.innerHTML = list.map(eventCardHTML).join("");
    noResults.style.display = list.length ? "none" : "block";
    count.textContent = `Showing ${list.length} event${list.length === 1 ? "" : "s"}`;
    observeReveal();
  }

  search.addEventListener("input", render);
  setupFilterButtons("#category-filters", value => { category = value; render(); });
  setupFilterButtons("#status-filters", value => { status = value; render(); });
  render();
}

/* Generic helper: activate clicked filter button & call back with its value */
function setupFilterButtons(selector, callback) {
  const wrap = document.querySelector(selector);
  if (!wrap) return;
  wrap.addEventListener("click", e => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    wrap.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    callback(btn.dataset.filter);
  });
}

/* ---------- EVENT DETAILS PAGE (event-details.html?id=1) ---------- */
function initEventDetails() {
  const wrap = document.getElementById("event-details");
  if (!wrap) return;

  const id = +new URLSearchParams(location.search).get("id") || 1;
  const ev = EVENTS.find(e => e.id === id);
  if (!ev) {
    wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i>
      <h3>Event not found</h3><p>The event you are looking for does not exist.</p>
      <a href="events.html" class="btn btn-primary">Back to Events</a></div>`;
    return;
  }

  document.title = ev.title + " | TechMinds Club";
  document.getElementById("details-title").textContent = ev.title;

  const upcoming = isUpcoming(ev.date);
  const percent = Math.round((ev.registered / ev.seats) * 100);
  const left = ev.seats - ev.registered;

  wrap.innerHTML = `
    <div class="details-main reveal left">
      <div class="details-cover ${esc(ev.cover)}"><i class="fa-solid ${esc(ev.icon)}"></i></div>
      <span class="chip">${esc(ev.category)}</span>
      <h2>${esc(ev.title)}</h2>
      <p>${esc(ev.description)}</p>
      <h3 style="color:var(--dark);margin:20px 0 12px">Event Agenda</h3>
      <ul class="check-list">
        ${(ev.agenda || []).map(a => `<li><i class="fa-solid fa-circle-check"></i>${esc(a)}</li>`).join("")}
      </ul>
    </div>
    <aside class="reveal right">
      <div class="side-box">
        <h3>Event Information</h3>
        <div class="info-row"><i class="fa-regular fa-calendar"></i><div><small>Date</small>${formatDate(ev.date)}</div></div>
        <div class="info-row"><i class="fa-regular fa-clock"></i><div><small>Time</small>${esc(ev.time)}</div></div>
        <div class="info-row"><i class="fa-solid fa-location-dot"></i><div><small>Location</small>${esc(ev.location)}</div></div>
        <div class="info-row"><i class="fa-solid fa-microphone"></i><div><small>Speaker</small>${esc(ev.speaker)}</div></div>
        <p style="margin-top:18px;font-weight:500">Seats booked: ${esc(ev.registered)}/${esc(ev.seats)}</p>
        <div class="progress"><span id="seat-bar"></span></div>
        ${upcoming
          ? (left > 0
            ? `<a href="register.html?event=${esc(ev.id)}" class="btn btn-primary btn-block">Register Now - ${left} seats left</a>`
            : `<button class="btn btn-outline btn-block" disabled>Fully Booked</button>`)
          : `<button class="btn btn-outline btn-block" disabled>This event has finished</button>`}
        <button class="btn btn-outline btn-block" id="share-btn" style="margin-top:10px"><i class="fa-solid fa-share-nodes"></i> Share Event</button>
      </div>
    </aside>`;

  observeReveal();
  // animate seats progress bar
  setTimeout(() => document.getElementById("seat-bar").style.width = percent + "%", 300);

  document.getElementById("share-btn").addEventListener("click", () => {
    navigator.clipboard?.writeText(location.href);
    showToast("Event link copied to clipboard!");
  });
}

/* ---------- MEMBERS PAGE ---------- */
function initMembers() {
  const grid = document.getElementById("members-grid");
  if (!grid) return;
  const search = document.getElementById("member-search");
  const noResults = document.getElementById("no-results");
  const count = document.getElementById("results-count");
  let group = "All";

  function render() {
    const term = search.value.toLowerCase().trim();
    const list = MEMBERS.filter(m =>
      (group === "All" || m.group === group) &&
      (m.name.toLowerCase().includes(term) || m.role.toLowerCase().includes(term) || m.dept.toLowerCase().includes(term))
    );
    grid.innerHTML = list.map(m => `
      <div class="member reveal zoom tilt">
        <div class="avatar">${esc(getInitials(m.name))}</div>
        <h3>${esc(m.name)}</h3>
        <div class="role">${esc(m.role)}</div>
        <div class="dept">${esc(m.dept)} • ${esc(m.year)}</div>
        <span class="chip" style="margin-bottom:14px">${esc(m.group)} Team</span>
        <div class="socials">
          <a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
          <a href="#" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
          <a href="mailto:${encodeURIComponent(m.name.split(" ")[0].toLowerCase())}@techminds.edu" aria-label="Email"><i class="fa-solid fa-envelope"></i></a>
        </div>
      </div>`).join("");
    noResults.style.display = list.length ? "none" : "block";
    count.textContent = `Showing ${list.length} member${list.length === 1 ? "" : "s"}`;
    observeReveal();
  }

  search.addEventListener("input", render);
  setupFilterButtons("#group-filters", value => { group = value; render(); });
  render();
}

/* ---------- NEWS PAGE ---------- */
function newsCardHTML(n) {
  return `
    <article class="card news-card reveal">
      <div class="card-cover ${esc(n.cover)}">
        <span class="chip" style="left:14px;right:auto">${esc(n.category)}</span>
        <i class="fa-solid ${esc(n.icon)}"></i>
      </div>
      <div class="card-body">
        <div class="meta" style="margin-top:0"><span><i class="fa-regular fa-calendar"></i>${formatDate(n.date)}</span></div>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.excerpt)}</p>
        <div class="news-full"><p style="padding-top:10px">${esc(n.content)}</p></div>
        <button class="read-more" style="margin-top:14px">Read more <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    </article>`;
}

function initReadMore() {
  document.querySelectorAll(".read-more").forEach(btn => {
    btn.addEventListener("click", () => {
      const full = btn.previousElementSibling;
      const open = full.style.maxHeight && full.style.maxHeight !== "0px";
      full.style.maxHeight = open ? "0px" : full.scrollHeight + "px";
      btn.innerHTML = open ? 'Read more <i class="fa-solid fa-arrow-right"></i>' : 'Show less <i class="fa-solid fa-arrow-up"></i>';
    });
  });
}

function initNews() {
  const grid = document.getElementById("news-grid");
  if (!grid) return;
  const search = document.getElementById("news-search");
  const noResults = document.getElementById("no-results");
  let category = "All";

  function render() {
    const term = search.value.toLowerCase().trim();
    const list = NEWS.filter(n =>
      (category === "All" || n.category === category) &&
      (n.title.toLowerCase().includes(term) || n.excerpt.toLowerCase().includes(term))
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
    grid.innerHTML = list.map(newsCardHTML).join("");
    noResults.style.display = list.length ? "none" : "block";
    initReadMore();
    observeReveal();
  }
  search.addEventListener("input", render);
  setupFilterButtons("#news-filters", value => { category = value; render(); });
  render();
}

/* ---------- GALLERY PAGE + LIGHTBOX ---------- */
function initGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  let visible = GALLERY;
  let current = 0;

  function render(cat) {
    visible = cat === "All" ? GALLERY : GALLERY.filter(g => g.cat === cat);
    grid.innerHTML = visible.map((g, i) => `
      <div class="g-item ${esc(g.cover)} ${g.tall ? "tall" : ""} reveal zoom" data-index="${i}">
        <i class="fa-solid ${esc(g.icon)}"></i>
        <div class="overlay"><strong>${esc(g.title)}</strong><small>${esc(g.cat)}</small></div>
      </div>`).join("");
    observeReveal();
  }

  const lightbox = document.getElementById("lightbox");
  const content = document.getElementById("lb-content");

  function openLightbox(i) {
    current = (i + visible.length) % visible.length;
    const g = visible[current];
    content.className = "lightbox-content " + g.cover;
    content.innerHTML = `<i class="fa-solid ${esc(g.icon)}"></i><div class="lightbox-caption">${esc(g.title)} • ${current + 1}/${visible.length}</div>`;
    lightbox.classList.add("open");
  }
  const close = () => lightbox.classList.remove("open");

  grid.addEventListener("click", e => {
    const item = e.target.closest(".g-item");
    if (item) openLightbox(+item.dataset.index);
  });
  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-prev").addEventListener("click", () => openLightbox(current - 1));
  document.getElementById("lb-next").addEventListener("click", () => openLightbox(current + 1));
  lightbox.addEventListener("click", e => { if (e.target === lightbox) close(); });
  // keyboard support
  document.addEventListener("keydown", e => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") openLightbox(current + 1);
    if (e.key === "ArrowLeft") openLightbox(current - 1);
  });

  setupFilterButtons("#gallery-filters", render);
  render("All");
}

/* ---------- FAQ ACCORDION ---------- */
function initFaq() {
  const wrap = document.getElementById("faq-list");
  if (!wrap) return;
  wrap.innerHTML = FAQS.map(f => `
    <div class="faq-item reveal">
      <button class="faq-q">${esc(f.q)}<i class="fa-solid fa-plus"></i></button>
      <div class="faq-a"><p>${esc(f.a)}</p></div>
    </div>`).join("");
  observeReveal();

  wrap.addEventListener("click", e => {
    const q = e.target.closest(".faq-q");
    if (!q) return;
    const item = q.parentElement;
    const answer = item.querySelector(".faq-a");
    const isOpen = item.classList.contains("open");
    // close all, then open the clicked one
    wrap.querySelectorAll(".faq-item").forEach(i => {
      i.classList.remove("open");
      i.querySelector(".faq-a").style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add("open");
      answer.style.maxHeight = answer.scrollHeight + "px";
    }
  });
}

/* ---------- MY REGISTRATIONS (tickets booked from this browser) ---------- */
function initMyRegistrations() {
  const wrap = document.getElementById("my-regs");
  if (!wrap) return;
  function render() {
    const regs = getMyTickets();
    if (!regs.length) {
      wrap.innerHTML = `<div class="empty-state reveal"><i class="fa-solid fa-ticket"></i>
        <h3>No registrations yet</h3><p>You have not registered for any event yet.</p>
        <a href="events.html" class="btn btn-primary" style="margin-top:15px">Browse Events</a></div>`;
      observeReveal();
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap reveal">
        <table>
          <thead><tr><th>Ticket</th><th>Name</th><th>Event</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            ${regs.map((r, i) => `
              <tr>
                <td><span class="chip">${esc(r.ticket)}</span></td>
                <td>${esc(r.name)}</td>
                <td>${esc(r.eventTitle)}</td>
                <td>${esc(formatDate(r.eventDate))}</td>
                <td><button class="btn-danger" data-index="${i}"><i class="fa-solid fa-xmark"></i> Cancel</button></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
    observeReveal();
  }
  wrap.addEventListener("click", async e => {
    const btn = e.target.closest(".btn-danger");
    if (!btn) return;
    if (!confirm("Are you sure you want to cancel this registration?")) return;
    const regs = getMyTickets();
    const reg = regs[+btn.dataset.index];
    if (!reg) return;
    btn.disabled = true;
    const result = await apiPost("/api/public/registrations/cancel", { ticket: reg.ticket, email: reg.email });
    // 404 means it was already removed on the server: drop it locally too
    if (!result.ok && result.status !== 404) {
      btn.disabled = false;
      showToast(result.data.error || "Could not cancel registration.", "error");
      return;
    }
    regs.splice(+btn.dataset.index, 1);
    saveMyTickets(regs);
    showToast("Registration cancelled.");
    render();
  });
  render();
}

/* ---------- Run page logic ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  await window.CLUB_READY;
  initHome();
  initEvents();
  initEventDetails();
  initMembers();
  initNews();
  initGallery();
  initFaq();
  initMyRegistrations();
});
