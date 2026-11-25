/* =========================================================
   forms.js - Form validation & submission
   Registration, Contact, Login and Sign-up forms
   ========================================================= */

/* ---------- Generic validation helpers ---------- */
function setError(input, message) {
  const group = input.closest(".form-group");
  group.classList.add("error");
  group.classList.remove("success");
  group.querySelector(".error-msg").textContent = message;
}

function setSuccess(input) {
  const group = input.closest(".form-group");
  group.classList.remove("error");
  group.classList.add("success");
}

/*
  Validate one field using data attributes:
  required           -> field cannot be empty
  data-type="email"  -> must be a valid email
  data-type="phone"  -> Egyptian mobile number (01xxxxxxxxx)
  data-type="id"     -> numbers only, 6-10 digits
  data-min="20"      -> minimum number of characters
  data-match="id"    -> must equal another field (confirm password)
*/
function validateField(input) {
  const value = input.type === "checkbox" ? input.checked : input.value.trim();
  const label = input.dataset.label || "This field";

  if (input.required && !value) {
    setError(input, input.type === "checkbox" ? "You must accept to continue." : `${label} is required.`);
    return false;
  }
  if (input.dataset.type === "email" && !isValidEmail(value)) {
    setError(input, "Please enter a valid email (e.g. name@mail.com)."); return false;
  }
  if (input.dataset.type === "phone" && !/^01[0125][0-9]{8}$/.test(value)) {
    setError(input, "Enter a valid Egyptian mobile number (11 digits, starts with 01)."); return false;
  }
  if (input.dataset.type === "id" && !/^[0-9]{6,10}$/.test(value)) {
    setError(input, "Student ID must be 6-10 digits."); return false;
  }
  if (input.dataset.type === "name" && !/^[A-Za-z\u0600-\u06FF\s]{3,}$/.test(value)) {
    setError(input, "Name must be at least 3 letters (letters only)."); return false;
  }
  if (input.dataset.min && value.length < +input.dataset.min) {
    setError(input, `${label} must be at least ${input.dataset.min} characters.`); return false;
  }
  if (input.dataset.match) {
    const other = document.getElementById(input.dataset.match);
    if (value !== other.value.trim()) { setError(input, "Passwords do not match."); return false; }
  }
  setSuccess(input);
  return true;
}

/* Validate all fields of a form, returns true if everything is OK */
function validateForm(form) {
  let valid = true;
  form.querySelectorAll("input, select, textarea").forEach(input => {
    if (!input.closest(".form-group")) return;
    if (!validateField(input)) valid = false;
  });
  if (!valid) {
    showToast("Please fix the highlighted fields.", "error");
    const firstError = form.querySelector(".form-group.error input, .form-group.error select, .form-group.error textarea");
    if (firstError) firstError.focus();
  }
  return valid;
}

/* Live validation: check field when user leaves it, re-check while typing if it had an error */
function enableLiveValidation(form) {
  form.querySelectorAll("input, select, textarea").forEach(input => {
    if (!input.closest(".form-group")) return;
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.closest(".form-group").classList.contains("error")) validateField(input);
    });
    input.addEventListener("change", () => validateField(input));
  });
}

/* Fake loading state on submit button */
function setLoading(btn, loading, text) {
  if (loading) {
    btn.dataset.text = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
    btn.disabled = true;
  } else {
    btn.innerHTML = text || btn.dataset.text;
    btn.disabled = false;
  }
}

/* ---------- 1. EVENT REGISTRATION FORM ---------- */
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  // Fill events dropdown with upcoming events only
  const select = document.getElementById("reg-event");
  EVENTS.filter(e => isUpcoming(e.date)).forEach(ev => {
    const opt = document.createElement("option");
    opt.value = ev.id;
    opt.textContent = `${ev.title} (${formatDate(ev.date)})`;
    select.appendChild(opt);
  });

  // Pre-select event from URL: register.html?event=2
  const preselected = new URLSearchParams(location.search).get("event");
  if (preselected) select.value = preselected;

  enableLiveValidation(form);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const btn = form.querySelector("button[type=submit]");
    setLoading(btn, true);
    const payload = {
      eventId: +select.value,
      name: document.getElementById("reg-name").value.trim(),
      studentId: document.getElementById("reg-id").value.trim(),
      email: document.getElementById("reg-email").value.trim().toLowerCase(),
      phone: document.getElementById("reg-phone").value.trim(),
      department: document.getElementById("reg-dept").value,
      level: document.getElementById("reg-level").value,
      notes: document.getElementById("reg-notes").value.trim(),
    };
    const result = await apiPost("/api/public/registrations", payload);
    setLoading(btn, false);
    if (!result.ok) {
      showToast(result.data.error || "Registration failed, please try again.", "error");
      return;
    }
    const { ticket, event: ev } = result.data;
    // remember the ticket in this browser for the "My Tickets" page
    const mine = getMyTickets();
    mine.push({ ticket, name: payload.name, email: payload.email, eventId: ev.id, eventTitle: ev.title, eventDate: ev.date, createdAt: new Date().toISOString() });
    saveMyTickets(mine);
    // update the seat counter shown on the page
    const local = EVENTS.find(x => x.id === ev.id);
    if (local) local.registered++;
    // Show success message
    form.style.display = "none";
    const success = document.getElementById("register-success");
    document.getElementById("ticket-info").innerHTML = `
      <p><b>Ticket No:</b> ${esc(ticket)}</p>
      <p><b>Name:</b> ${esc(payload.name)}</p>
      <p><b>Event:</b> ${esc(ev.title)}</p>
      <p><b>Date:</b> ${esc(formatDate(ev.date))} - ${esc(ev.time)}</p>
      <p><b>Location:</b> ${esc(ev.location)}</p>`;
    success.classList.add("show");
    showToast("Registration completed successfully!");
    launchConfetti();
  });
  document.getElementById("register-again").addEventListener("click", () => {
    form.reset();
    form.querySelectorAll(".form-group").forEach(g => g.classList.remove("success", "error"));
    form.style.display = "block";
    document.getElementById("register-success").classList.remove("show");
  });
}

/* ---------- 2. CONTACT FORM ---------- */
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  enableLiveValidation(form);

  // live character counter for the message
  const msg = document.getElementById("c-message");
  const counter = document.getElementById("char-count");
  msg.addEventListener("input", () => {
    counter.textContent = `${msg.value.length}/500`;
    counter.style.color = msg.value.length >= 20 ? "var(--mint-600)" : "var(--muted)";
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const btn = form.querySelector("button[type=submit]");
    setLoading(btn, true);
    const result = await apiPost("/api/public/messages", {
      name: document.getElementById("c-name").value.trim(),
      email: document.getElementById("c-email").value.trim(),
      subject: document.getElementById("c-subject").value,
      message: msg.value.trim(),
    });
    setLoading(btn, false);
    if (!result.ok) {
      showToast(result.data.error || "Could not send message.", "error");
      return;
    }
    form.style.display = "none";
    document.getElementById("contact-success").classList.add("show");
    showToast("Message sent successfully!");
  });
  document.getElementById("contact-again").addEventListener("click", () => {
    form.reset();
    counter.textContent = "0/500";
    form.querySelectorAll(".form-group").forEach(g => g.classList.remove("success", "error"));
    form.style.display = "block";
    document.getElementById("contact-success").classList.remove("show");
  });
}

/* Member accounts are not stored in the browser. Admins sign in through the protected /admin route. */

/* ---------- Confetti effect on successful registration ---------- */
function launchConfetti() {
  const colors = ["#2ebf8b", "#14b8a6", "#7fe3bd", "#aef0d6", "#1fa477"];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement("span");
    piece.style.cssText = `
      position:fixed; top:-10px; left:${Math.random() * 100}vw; z-index:5000;
      width:${6 + Math.random() * 6}px; height:${10 + Math.random() * 8}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:2px; pointer-events:none; opacity:.9;`;
    document.body.appendChild(piece);
    const fall = piece.animate([
      { transform: "translateY(0) rotate(0deg)" },
      { transform: `translateY(${window.innerHeight + 40}px) translateX(${(Math.random() - 0.5) * 200}px) rotate(${Math.random() * 720}deg)` }
    ], { duration: 2000 + Math.random() * 1500, easing: "cubic-bezier(.25,.6,.5,1)" });
    fall.onfinish = () => piece.remove();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.CLUB_READY;
  initRegisterForm();
  initContactForm();
});
