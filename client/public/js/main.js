/* =========================================================
   main.js - Shared layout & visual effects for all pages
   ========================================================= */

/* ---------- 1. Navigation links (one place to edit the menu) ---------- */
const NAV_LINKS = [
  { href: "home.html", text: "Home" },
  { href: "about.html", text: "About" },
  { href: "events.html", text: "Events" },
  { href: "members.html", text: "Members" },
  { href: "news.html", text: "News" },
  { href: "gallery.html", text: "Gallery" },
  { href: "register.html", text: "Register" },
  { href: "my-registrations.html", text: "My Tickets" },
  { href: "faq.html", text: "FAQ" },
  { href: "contact.html", text: "Contact" },
  { href: "login.html", text: "Login" }
];

/* Current page file name, e.g. "events.html" */
const currentPage = location.pathname.split("/").pop() || "home.html";

/* ---------- 2. Build header ---------- */
function renderHeader() {
  const header = document.getElementById("site-header");
  if (!header) return;

  // event-details belongs to the "Events" section
  const activePage = currentPage === "event-details.html" ? "events.html" : currentPage;

  const links = NAV_LINKS.map(link => {
    const active = link.href === activePage ? "active" : "";
    return `<a href="${link.href}" class="${active}">${link.text}</a>`;
  }).join("");

  header.innerHTML = `
    <nav class="navbar" id="navbar">
      <div class="container nav-inner">
        <a href="home.html" class="logo">
          <div class="logo-icon"><i class="fa-solid fa-leaf"></i></div>
          <span>Tech<b>Minds</b></span>
        </a>
        <div class="nav-links" id="nav-links">${links}</div>
        <button type="button" class="language-toggle" id="language-toggle" aria-label="Switch language" aria-pressed="false">العربية</button>
        <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Switch to dark mode" aria-pressed="false"><i class="fa-solid fa-moon" aria-hidden="true"></i></button>
        <button class="nav-toggle" id="nav-toggle" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>`;

  // Mobile menu toggle
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-links");
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("open");
    menu.classList.toggle("open");
  });
  // close menu when a link is clicked
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    toggle.classList.remove("open");
    menu.classList.remove("open");
  }));
}

/* ---------- 3. Build footer ---------- */
function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;
  footer.innerHTML = `
    <footer class="footer">
      <div class="container footer-grid">
        <div>
          <a href="home.html" class="logo">
            <div class="logo-icon"><i class="fa-solid fa-leaf"></i></div>
            <span>Tech<b>Minds</b></span>
          </a>
          <p>The official technology club of Borg El Arab Technological University. Learn, build and grow together.</p>
          <div class="socials" style="justify-content:flex-start;margin-top:15px">
            <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
            <a href="#" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
          </div>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="events.html">Events</a></li>
            <li><a href="members.html">Members</a></li>
            <li><a href="news.html">News</a></li>
          </ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul>
            <li><a href="register.html">Register</a></li>
            <li><a href="my-registrations.html">My Tickets</a></li>
            <li><a href="faq.html">FAQ</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="/admin"><i class="fa-solid fa-lock" style="font-size:.8em;margin-right:4px"></i>Admin Dashboard</a></li>
          </ul>
        </div>
        <div>
          <h4>Newsletter</h4>
          <p>Get the latest events in your inbox.</p>
          <form class="newsletter" id="newsletter-form" novalidate>
            <input type="email" id="newsletter-email" placeholder="Your email">
            <button type="submit" aria-label="Subscribe"><i class="fa-solid fa-paper-plane"></i></button>
          </form>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; <span id="year"></span> TechMinds Club - Borg El Arab Technological University. All rights reserved.
      </div>
    </footer>
    <button id="back-top" aria-label="Back to top"><i class="fa-solid fa-arrow-up"></i></button>
    <div id="toast-container"></div>`;

  document.getElementById("year").textContent = new Date().getFullYear();

  // Newsletter validation
  document.getElementById("newsletter-form").addEventListener("submit", e => {
    e.preventDefault();
    const input = document.getElementById("newsletter-email");
    if (!isValidEmail(input.value)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    showToast("Subscribed successfully! Welcome aboard.");
    input.value = "";
  });
}

/* ---------- 4. Helpers ---------- */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function getInitials(name) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function isUpcoming(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr + "T00:00:00") >= today;
}

/* Toast notification */
function showToast(message, type = "success") {
  const box = document.getElementById("toast-container");
  if (!box) return;
  const toast = document.createElement("div");
  toast.className = "toast " + (type === "error" ? "error" : "");
  const icon = type === "error" ? "fa-circle-exclamation" : "fa-circle-check";
  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${esc(message)}</span>`;
  box.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/* Reusable event card (used on Home & Events pages) */
function eventCardHTML(ev) {
  const d = new Date(ev.date + "T00:00:00");
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  const upcoming = isUpcoming(ev.date);
  return `
    <article class="card reveal">
      <div class="card-cover ${esc(ev.cover)}">
        <div class="date-box"><b>${day}</b>${month}</div>
        <span class="chip ${upcoming ? "" : "past"}">${upcoming ? esc(ev.category) : "Finished"}</span>
        <i class="fa-solid ${esc(ev.icon)}"></i>
      </div>
      <div class="card-body">
        <h3>${esc(ev.title)}</h3>
        <div class="meta">
          <span><i class="fa-regular fa-clock"></i>${esc(ev.time)}</span>
          <span><i class="fa-solid fa-location-dot"></i>${esc(ev.location)}</span>
        </div>
        <p>${esc(ev.short)}</p>
        <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
          <a href="event-details.html?id=${esc(ev.id)}" class="btn btn-outline btn-sm">Details</a>
          ${upcoming ? `<a href="register.html?event=${esc(ev.id)}" class="btn btn-primary btn-sm">Register</a>` : ""}
        </div>
      </div>
    </article>`;
}

/* ---------- 5. Visual effects ---------- */

// Page loader
function initLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  window.addEventListener("load", () => setTimeout(() => loader.classList.add("hidden"), 300));
  setTimeout(() => loader.classList.add("hidden"), 2500); // safety fallback
}

// Navbar shadow + scroll progress + back-to-top
function initScrollEffects() {
  const progress = document.getElementById("scroll-progress");
  const backTop = document.getElementById("back-top");
  const navbar = document.getElementById("navbar");

  function onScroll() {
    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (height > 0 ? (scrollTop / height) * 100 : 0) + "%";
    if (navbar) navbar.classList.toggle("scrolled", scrollTop > 50);
    if (backTop) backTop.classList.toggle("show", scrollTop > 400);
  }
  window.addEventListener("scroll", onScroll);
  onScroll();

  if (backTop) backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// Reveal elements when they enter the screen
let revealObserver;
function initReveal() {
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  observeReveal();
}
function observeReveal() {
  document.querySelectorAll(".reveal:not(.visible)").forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 0.1 + "s"; // small stagger effect
    revealObserver.observe(el);
  });
}

// Animated number counters
function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const duration = 1800;
      const start = performance.now();
      function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out
        el.textContent = Math.floor(eased * target) + (el.dataset.suffix || "");
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

// Ripple effect on buttons
function initRipple() {
  document.addEventListener("click", e => {
    const btn = e.target.closest(".btn");
    if (!btn) return;
    const circle = document.createElement("span");
    const size = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();
    circle.className = "ripple";
    circle.style.width = circle.style.height = size + "px";
    circle.style.left = e.clientX - rect.left - size / 2 + "px";
    circle.style.top = e.clientY - rect.top - size / 2 + "px";
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  });
}

// Floating mint bubbles in hero / page headers
function initBubbles() {
  document.querySelectorAll(".hero, .page-header, .countdown-box, .cta, .form-side").forEach(section => {
    const isDark = section.matches(".countdown-box, .cta, .form-side");
    for (let i = 0; i < 6; i++) {
      const b = document.createElement("span");
      b.className = "bubble";
      const size = 40 + Math.random() * 140;
      b.style.width = b.style.height = size + "px";
      b.style.left = Math.random() * 100 + "%";
      b.style.top = Math.random() * 100 + "%";
      b.style.animationDelay = Math.random() * 6 + "s";
      b.style.animationDuration = 8 + Math.random() * 8 + "s";
      if (isDark) b.style.background = "radial-gradient(circle, rgba(255,255,255,.22), rgba(255,255,255,0))";
      section.prepend(b);
    }
    // keep real content above the bubbles
    Array.from(section.children).forEach(ch => {
      if (!ch.classList.contains("bubble")) { ch.style.position = ch.style.position || "relative"; ch.style.zIndex = 1; }
    });
  });
}

// Typing effect: <span class="typed" data-words="a,b,c">
function initTyping() {
  const el = document.querySelector(".typed");
  if (!el) return;
  const englishWords = el.dataset.words.split(",");
  const arabicWords = ["نتعلم", "نبني", "نبتكر", "ننمو معًا"];
  let words = window.CLUB_I18N?.language === "ar" ? arabicWords : englishWords;
  let wordIndex = 0, charIndex = 0, deleting = false;
  let typingTimer;
  function type() {
    const word = words[wordIndex];
    el.textContent = word.substring(0, charIndex);
    if (!deleting && charIndex < word.length) { charIndex++; typingTimer = setTimeout(type, 110); }
    else if (deleting && charIndex > 0) { charIndex--; typingTimer = setTimeout(type, 60); }
    else {
      deleting = !deleting;
      if (!deleting) wordIndex = (wordIndex + 1) % words.length;
      typingTimer = setTimeout(type, deleting ? 1500 : 300);
    }
  }
  type();
  document.addEventListener("techminds:languagechange", event => {
    clearTimeout(typingTimer);
    words = event.detail.language === "ar" ? arabicWords : englishWords;
    wordIndex = 0; charIndex = 0; deleting = false;
    type();
  });
}

// 3D tilt on hover for elements with .tilt
function initTilt() {
  document.addEventListener("mousemove", e => {
    const card = e.target.closest(".tilt");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
  });
  document.addEventListener("mouseout", e => {
    const card = e.target.closest(".tilt");
    if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
  });
}

/* ---------- 6. Start everything ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  initLoader();
  initScrollEffects();
  initBubbles();
  initTyping();
  initRipple();
  initTilt();
  initReveal();
  initCounters();
});
