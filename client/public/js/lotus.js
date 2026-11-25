/* =========================================================
   lotus.js - "Lotus" AI assistant for the TechMinds portal
   - Chat with the club AI (knows the current page & session)
   - Voice: ask by voice (Speech-to-Text) + spoken replies (Text-to-Speech)
   - Wake word: say "Hey Lotus" / "يا لوتس" -> on-screen reaction, then listens
   - Computer vision (MediaPipe Tasks Vision): hand gestures + face presence,
     and "what do you see?" camera snapshots for the vision model
   - Executes safe, whitelisted actions on the page
   ========================================================= */
(function () {
  "use strict";
  if (window.__lotusLoaded) return;
  window.__lotusLoaded = true;

  /* ---------- Config ---------- */
  const API = "/api/assistant/chat";
  const IS_ADMIN = location.pathname.startsWith("/admin");
  const WAKE_WORDS = ["hey lotus", "hi lotus", "ok lotus", "lotus", "لوتس", "لوطس", "لوتوس", "يا لوتس"];
  const MP_VERSION = "0.10.14";
  const MP_BUNDLE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`;
  const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
  const GESTURE_MODEL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
  const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

  const store = {
    get(k, d) { try { const v = localStorage.getItem("lotus_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("lotus_" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  const session = {
    get(k, d) { try { const v = sessionStorage.getItem("lotus_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { sessionStorage.setItem("lotus_" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  const settings = {
    voice: store.get("voice", true), // speak replies
    wake: store.get("wake", false), // wake word listening
    lang: store.get("lang", (navigator.language || "en").startsWith("ar") ? "ar-EG" : "en-US"),
  };

  /* ---------- Lotus logo (purple lotus flower SVG) ---------- */
  const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="lpA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b4fe"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>
      <linearGradient id="lpB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c084fc"/><stop offset="1" stop-color="#5b21b6"/></linearGradient>
      <linearGradient id="lpC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#4c1d95"/></linearGradient>
    </defs>
    <path d="M32 8c6 7 9 14 9 21s-4 13-9 17c-5-4-9-10-9-17s3-14 9-21z" fill="url(#lpA)"/>
    <path d="M10 22c8 0 15 4 19 10s4 12 3 15c-6 0-12-2-17-7S9 29 10 22z" fill="url(#lpB)" opacity=".95"/>
    <path d="M54 22c1 7-1 13-5 18s-11 7-17 7c-1-3-1-9 3-15s11-10 19-10z" fill="url(#lpB)" opacity=".95"/>
    <path d="M4 36c7-2 14 0 19 4s7 7 9 8c-5 3-12 3-18 0S5 41 4 36z" fill="url(#lpC)"/>
    <path d="M60 36c-1 5-4 9-10 12s-13 3-18 0c2-1 4-4 9-8s12-6 19-4z" fill="url(#lpC)"/>
    <path d="M14 50c6 4 12 5 18 5s12-1 18-5" stroke="#7c3aed" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="40" r="2.2" fill="#fde68a"/>
  </svg>`;

  const ICONS = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
    ear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 8.5a6 6 0 1 1 12 0c0 3-2 4.5-3.5 6S13 17 13 19a3 3 0 0 1-6 0"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  };

  /* ---------- Helpers ---------- */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isArabic = s => /[\u0600-\u06FF]/.test(s || "");
  const ar = () => settings.lang.startsWith("ar");
  const t = (en, arText) => (ar() ? arText : en);

  /* Safe mini-markdown: escape first, then bold / code / lists / line breaks */
  function md(text) {
    const lines = esc(text).split(/\n/);
    let html = "", inList = false;
    for (const raw of lines) {
      const line = raw.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
      const li = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
      if (li) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${li[1]}</li>`; continue; }
      if (inList) { html += "</ul>"; inList = false; }
      if (line.trim()) html += `<p>${line}</p>`;
    }
    if (inList) html += "</ul>";
    return html;
  }

  /* ---------- Build UI ---------- */
  const root = document.createElement("div");
  root.className = "lotus-root" + (IS_ADMIN ? " lotus-admin" : "");
  root.dataset.state = "ready";
  root.innerHTML = `
    <div class="lotus-aura" id="lotus-aura"></div>
    <div class="lotus-bloom" id="lotus-bloom" aria-live="polite">
      <div class="bloom-flower">${LOGO}</div>
      <div class="bloom-text"><span class="lotus-wave"><b></b><b></b><b></b><b></b><b></b></span><span id="lotus-bloom-text"></span></div>
      <div class="lotus-heard" id="lotus-heard"></div>
    </div>
    <button class="lotus-fab" id="lotus-fab" aria-label="Open Lotus AI assistant" title="Lotus AI assistant">${LOGO}<span class="lotus-dot"></span></button>
    <div class="lotus-panel" id="lotus-panel" role="dialog" aria-label="Lotus AI assistant">
      <header class="lotus-head">
        <div class="lotus-logo">${LOGO}</div>
        <div>
          <h3>Lotus AI</h3>
          <div class="lotus-status"><i></i><span id="lotus-status-text">Ready</span></div>
        </div>
        <button class="lotus-close" id="lotus-close" aria-label="Close">${ICONS.x}</button>
      </header>
      <div class="lotus-tools">
        <button class="lotus-chip" id="lotus-t-wake" title="Say 'Hey Lotus' to wake me">${ICONS.ear}<span>Wake word</span></button>
        <button class="lotus-chip" id="lotus-t-voice" title="Speak replies aloud">${ICONS.speaker}<span>Voice</span></button>
        <button class="lotus-chip" id="lotus-t-cam" title="Computer vision: gestures & camera">${ICONS.eye}<span>Vision</span></button>
        <button class="lotus-chip" id="lotus-t-lang" title="Voice language">${ICONS.globe}<span id="lotus-lang-label"></span></button>
        <button class="lotus-chip" id="lotus-t-clear" title="Clear conversation">${ICONS.trash}</button>
      </div>
      <div class="lotus-cam" id="lotus-cam">
        <video id="lotus-video" playsinline muted></video>
        <canvas id="lotus-canvas"></canvas>
        <button class="lotus-cam-ask" id="lotus-cam-ask">What do you see?</button>
        <div class="lotus-cam-label"><span id="lotus-cv-face">Loading vision...</span><span id="lotus-cv-gesture"></span></div>
      </div>
      <div class="lotus-msgs" id="lotus-msgs" aria-live="polite"></div>
      <div class="lotus-suggest" id="lotus-suggest"></div>
      <form class="lotus-form" id="lotus-form" autocomplete="off">
        <button type="button" class="lotus-icon-btn" id="lotus-img" aria-label="Ask about an image" title="Ask about an image">${ICONS.image}</button>
        <input type="file" id="lotus-file" accept="image/*" hidden>
        <input type="text" id="lotus-input" maxlength="1000" placeholder="Ask Lotus anything...">
        <button type="button" class="lotus-icon-btn" id="lotus-mic" aria-label="Speak to Lotus" title="Speak">${ICONS.mic}</button>
        <button type="submit" class="lotus-icon-btn primary" id="lotus-send" aria-label="Send">${ICONS.send}</button>
      </form>
    </div>
    <div class="lotus-toast" id="lotus-toast"></div>`;

  const $ = id => root.querySelector("#" + id);
  let msgsBox, input;

  /* ---------- State ---------- */
  let history = session.get("history", []); // [{role, content, image?, actions?}]
  let busy = false;

  function setState(state) {
    root.dataset.state = state;
    const labels = {
      ready: t("Ready", "جاهز"), listening: t("Listening...", "بسمعك..."),
      thinking: t("Thinking...", "بفكر..."), speaking: t("Speaking...", "بتكلم..."),
    };
    $("lotus-status-text").textContent = (labels[state] || state) + (settings.wake && state === "ready" ? t(" · say “Hey Lotus”", " · قول «يا لوتس»") : "");
  }

  function toast(text) {
    const el = $("lotus-toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function openPanel(focus = true) {
    root.classList.add("open");
    session.set("open", true);
    scrollMsgs();
    if (focus) setTimeout(() => input.focus(), 150);
  }
  function closePanel() {
    root.classList.remove("open");
    session.set("open", false);
  }

  function scrollMsgs() { msgsBox.scrollTop = msgsBox.scrollHeight; }

  const ACTION_LABELS = {
    navigate: "Opened page", search: "Searched", scroll: "Scrolled", open_event: "Opened event",
    register_event: "Opened registration", filter: "Filtered", camera_on: "Vision on", camera_off: "Vision off", speak_off: "Muted",
  };

  function renderMsg(m) {
    const div = document.createElement("div");
    div.className = "lotus-msg " + (m.role === "user" ? "user" : "bot") + (m.error ? " error" : "");
    if (isArabic(m.content)) div.dir = "rtl";
    div.innerHTML = (m.role === "user" ? `<p>${esc(m.content)}</p>` : md(m.content)) +
      (m.thumb ? `<img src="${esc(m.thumb)}" alt="Attached image">` : "") +
      (m.actions && m.actions.length ? m.actions.map(a => `<span class="lotus-act">✦ ${esc(ACTION_LABELS[a.type] || a.type)}${a.value ? ": " + esc(a.value) : ""}</span>`).join("") : "");
    msgsBox.appendChild(div);
    return div;
  }

  function renderAll() {
    msgsBox.innerHTML = "";
    if (!history.length) {
      renderMsg({ role: "assistant", content: welcomeText() });
    }
    history.forEach(renderMsg);
    renderSuggestions();
    scrollMsgs();
  }

  function pageName() {
    const p = location.pathname;
    if (p.startsWith("/admin")) return p.replace(/^\/admin\/?/, "") || "overview";
    return (p.split("/").pop() || "home.html").replace(".html", "");
  }

  function welcomeText() {
    const hi = t("Hi there!", "أهلاً بيك!");
    return t(
      `${hi} I'm **Lotus**, your TechMinds AI assistant. I can see which page you're on (**${pageName()}**), answer questions, open pages, search and filter for you.\n- Type or tap the mic to talk\n- Turn on **Wake word** and just say “Hey Lotus”\n- Turn on **Vision**: show an open palm ✋ to wake me, ✌️ scroll down, ☝️ scroll up, ✊ stop`,
      `${hi} أنا **لوتس**، مساعدك الذكي في TechMinds. أنا عارف إنت في صفحة (**${pageName()}**)، وأقدر أجاوب على أسئلتك وأفتح الصفحات وأدور وأفلتر بدالك.\n- اكتب أو دوس على المايك واتكلم\n- شغّل **Wake word** وقول «يا لوتس»\n- شغّل **Vision**: افتح كفك ✋ عشان أصحى، ✌️ انزل لتحت، ☝️ اطلع لفوق، ✊ اسكت`
    );
  }

  function suggestions() {
    const p = pageName();
    const A = ar();
    if (IS_ADMIN) return A
      ? ["لخصلي نشاط النهاردة", "افتح الرسائل اللي مقريتش", "أكتر فعالية عليها تسجيل؟"]
      : ["Summarize today's activity", "Open unread messages", "Which event has the most registrations?"];
    const map = {
      events: A ? ["وريني الورش الجاية", "أنهي فعالية فيها أماكن أكتر؟", "دور على AI"] : ["Show upcoming workshops", "Which event has the most free seats?", "Search for AI"],
      register: A ? ["ساعدني أختار فعالية", "إيه البيانات المطلوبة؟"] : ["Help me pick an event", "What info do I need?"],
      "my-registrations": A ? ["إزاي أشوف تذاكري على الصفحة؟", "إزاي ألغي حجز؟"] : ["How do I find my tickets on this page?", "How do I cancel a booking?"],
      members: A ? ["مين رئيس النادي؟", "وريني الفريق التقني"] : ["Who is the club president?", "Show the technical team"],
      news: A ? ["إيه آخر الأخبار؟", "وريني الإنجازات"] : ["What's the latest news?", "Show achievements"],
    };
    return map[p] || (A
      ? ["إيه الفعالية الجاية؟", "المشروع اتعمل بإيه؟", "إزاي اتعامل مع الأمان؟", "تقدر تعمل إيه؟"]
      : ["What's the next event?", "How was this project built?", "How is security handled?", "What can you do?"]);
  }

  function renderSuggestions() {
    const box = $("lotus-suggest");
    if (history.length > 2) { box.innerHTML = ""; return; }
    box.innerHTML = suggestions().map(s => `<button type="button">${esc(s)}</button>`).join("");
  }

  /* ---------- Page context sent with each question ---------- */
  function gatherContext() {
    const main = document.querySelector("main") || document.getElementById("root") || document.body;
    const clone = main.cloneNode(true);
    clone.querySelectorAll(".lotus-root, script, style, svg, noscript").forEach(n => n.remove());
    // Do not send registration tables, ticket details, or admin user records to the AI provider.
    clone.querySelectorAll("table, input, textarea, select, [role='row']").forEach(n => n.remove());
    if (location.pathname.endsWith("/my-registrations.html")) clone.querySelector("#my-regs")?.remove();
    const text = (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim().slice(0, 3500);
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .filter(h => !h.closest(".lotus-root"))
      .map(h => h.textContent.trim()).filter(Boolean).slice(0, 25).map(s => s.slice(0, 150));
    return {
      area: IS_ADMIN ? "admin" : "site",
      page: (location.pathname + location.search).slice(0, 200),
      title: document.title.slice(0, 200),
      headings,
      pageText: text,
      vision: vision.summary() || undefined,
      language: settings.lang,
      now: new Date().toString().slice(0, 60),
    };
  }

  /* ---------- Ask the AI ---------- */
  async function ask(text, opts = {}) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true;
    $("lotus-send").disabled = true;
    openPanel(false);
    stopSpeaking();

    let image = opts.image;
    // auto attach a camera frame when the user asks about what Lotus sees
    if (!image && vision.running && /\b(see|look|camera|show|holding|wearing|what is this)\b|شايف|شوف|بص|الكاميرا|ماسك|لابس|ده ايه|دي ايه|إيه ده/i.test(text)) {
      image = vision.snapshot();
    }

    const userMsg = { role: "user", content: text };
    if (image) userMsg.thumb = image.length < 400000 ? image : undefined;
    history.push(userMsg);
    renderMsg(userMsg);
    $("lotus-suggest").innerHTML = "";
    const typing = document.createElement("div");
    typing.className = "lotus-msg bot";
    typing.innerHTML = '<span class="lotus-typing"><span></span><span></span><span></span></span>';
    msgsBox.appendChild(typing);
    scrollMsgs();
    setState("thinking");

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: history.slice(-12).map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
          context: gatherContext(),
          image,
        }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      if (!res.ok) throw new Error(data.error || t("Lotus could not answer right now.", "لوتس مش قادر يرد دلوقتي."));
      const reply = { role: "assistant", content: data.reply || "...", actions: data.actions || [] };
      history.push(reply);
      saveHistory();
      renderMsg(reply);
      scrollMsgs();
      speak(reply.content);
      runActions(reply.actions);
    } catch (err) {
      typing.remove();
      const m = { role: "assistant", content: err.message || "Error", error: true };
      renderMsg(m);
      history.pop(); // let the user retry the same question
      saveHistory();
      setState("ready");
    } finally {
      busy = false;
      $("lotus-send").disabled = false;
      if (root.dataset.state === "thinking") setState("ready");
    }
  }

  function saveHistory() {
    // thumbnails are not persisted (keeps storage small)
    session.set("history", history.slice(-20).map(m => ({ role: m.role, content: m.content, actions: m.actions })));
  }

  /* ---------- Actions (whitelisted) ---------- */
  const SAFE_PAGE = /^(?:[a-z0-9-]+\.html(?:\?[a-z]+=[\w-]+)?|\/admin(?:\/[a-z-]+)?)$/i;

  function highlight(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("lotus-highlight");
    setTimeout(() => el.classList.remove("lotus-highlight"), 2600);
  }

  function findSearchBox() {
    return document.querySelector("#event-search, #member-search, #news-search, input[type=search], input[placeholder*='Search' i]:not(#lotus-input)");
  }

  function runActions(actions, fromPending = false) {
    if (!Array.isArray(actions)) return;
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      const v = String(a.value || "").trim();
      switch (a.type) {
        case "navigate":
        case "open_event":
        case "register_event": {
          let url = v;
          if (a.type === "open_event") url = "event-details.html?id=" + parseInt(v, 10);
          if (a.type === "register_event") url = "register.html?event=" + parseInt(v, 10);
          if (!IS_ADMIN && url.startsWith("/") && !url.startsWith("/admin")) url = url.slice(1);
          if (!SAFE_PAGE.test(url)) continue;
          // keep remaining actions for the next page
          session.set("pending", actions.slice(i + 1));
          session.set("open", true);
          const target = url.startsWith("/") ? url : (IS_ADMIN ? "/" + url : url);
          setTimeout(() => { location.href = target; }, 900);
          return;
        }
        case "search": {
          const box = findSearchBox();
          if (box) {
            box.value = v;
            box.dispatchEvent(new Event("input", { bubbles: true }));
            highlight(box);
          }
          break;
        }
        case "filter": {
          const btn = Array.from(document.querySelectorAll(".filter-btn, [role=tab], button"))
            .find(b => !b.closest(".lotus-root") && ((b.dataset.filter || "").toLowerCase() === v.toLowerCase() || b.textContent.trim().toLowerCase() === v.toLowerCase()));
          if (btn) { btn.click(); highlight(btn); }
          break;
        }
        case "scroll": {
          const h = window.innerHeight * 0.8;
          if (v === "top") window.scrollTo({ top: 0, behavior: "smooth" });
          else if (v === "bottom") window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          else window.scrollBy({ top: v === "up" ? -h : h, behavior: "smooth" });
          break;
        }
        case "camera_on": vision.start(); break;
        case "camera_off": vision.stop(); break;
        case "speak_off": stopSpeaking(); break;
        default: break;
      }
    }
    if (fromPending) session.set("pending", []);
  }

  /* ---------- Text to speech ---------- */
  function pickVoice(lang) {
    const voices = speechSynthesis.getVoices();
    return voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.slice(0, 2))) || null;
  }
  function speak(text) {
    if (!settings.voice || !("speechSynthesis" in window)) { setState("ready"); return; }
    const clean = text.replace(/[*`#>_]/g, "").replace(/\s+/g, " ").slice(0, 600);
    const u = new SpeechSynthesisUtterance(clean);
    const lang = isArabic(clean) ? "ar-EG" : "en-US";
    u.lang = lang;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.rate = 1.02;
    u.onstart = () => { setState("speaking"); wake.pause(); };
    u.onend = u.onerror = () => { setState("ready"); wake.resume(); };
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  function stopSpeaking() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (root.dataset.state === "speaking") setState("ready");
  }

  /* ---------- "I'm here" reaction ---------- */
  let reactionTimer;
  function showReaction(text, heard) {
    $("lotus-aura").classList.add("show");
    $("lotus-bloom").classList.add("show");
    $("lotus-bloom-text").textContent = text;
    const h = $("lotus-heard");
    if (heard) { h.textContent = "“" + heard + "”"; h.classList.add("show"); } else h.classList.remove("show");
    chime();
    if (navigator.vibrate) navigator.vibrate(40);
    clearTimeout(reactionTimer);
    reactionTimer = setTimeout(hideReaction, 9000);
  }
  function hideReaction() {
    $("lotus-aura").classList.remove("show");
    $("lotus-bloom").classList.remove("show");
  }
  let audioCtx;
  function chime() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      [660, 880, 1320].forEach((f, i) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + i * 0.09);
        g.gain.exponentialRampToValueAtTime(0.12, now + i * 0.09 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.35);
        o.connect(g).connect(audioCtx.destination);
        o.start(now + i * 0.09); o.stop(now + i * 0.09 + 0.4);
      });
    } catch (e) { /* audio not available */ }
  }

  /* ---------- Speech to text: one-shot (mic button) ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let oneShot = null;
  function listenOnce() {
    if (!SR) { toast(t("Voice input is not supported in this browser. Try Chrome or Edge.", "المتصفح ده مش بيدعم الصوت. جرب Chrome أو Edge.")); return; }
    if (oneShot) { oneShot.stop(); return; }
    stopSpeaking();
    wake.pause();
    oneShot = new SR();
    oneShot.lang = settings.lang;
    oneShot.interimResults = true;
    oneShot.maxAlternatives = 1;
    const mic = $("lotus-mic");
    mic.classList.add("rec");
    setState("listening");
    showReaction(t("I'm listening...", "بسمعك..."));
    let finalText = "";
    oneShot.onresult = e => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      input.value = finalText || interim;
      $("lotus-heard").textContent = "“" + (finalText || interim) + "”";
      $("lotus-heard").classList.add("show");
    };
    oneShot.onerror = e => { if (e.error === "not-allowed") toast(t("Microphone permission was denied.", "إذن المايك مرفوض.")); };
    oneShot.onend = () => {
      mic.classList.remove("rec");
      oneShot = null;
      hideReaction();
      setState("ready");
      wake.resume();
      if (finalText.trim()) { input.value = ""; ask(finalText); }
    };
    try { oneShot.start(); } catch (e) { mic.classList.remove("rec"); oneShot = null; }
  }

  /* ---------- Wake word: continuous listening for "Hey Lotus" ---------- */
  const wake = (() => {
    let rec = null, active = false, paused = false, awaitingCommand = false, commandTimer = null;

    function matchWake(text) {
      const s = text.toLowerCase().trim();
      for (const w of WAKE_WORDS) {
        const idx = s.indexOf(w);
        if (idx !== -1) return s.slice(idx + w.length).replace(/^[\s,.،!؟?]+/, "");
      }
      return null;
    }

    function wakeUp(rest) {
      openPanel(false);
      setState("listening");
      if (rest && rest.length > 2) {
        showReaction(t("On it!", "حاضر!"), rest);
        setTimeout(hideReaction, 1400);
        ask(rest);
        awaitingCommand = false;
      } else {
        showReaction(t("Yes? I'm listening...", "أيوه؟ بسمعك..."));
        awaitingCommand = true;
        clearTimeout(commandTimer);
        commandTimer = setTimeout(() => { awaitingCommand = false; hideReaction(); setState("ready"); }, 8000);
      }
    }

    function create() {
      rec = new SR();
      rec.lang = settings.lang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = e => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const text = e.results[i][0].transcript;
          if (awaitingCommand) {
            $("lotus-heard").textContent = "“" + text + "”";
            $("lotus-heard").classList.add("show");
            if (e.results[i].isFinal && text.trim()) {
              awaitingCommand = false;
              clearTimeout(commandTimer);
              setTimeout(hideReaction, 1000);
              ask(text);
            }
            continue;
          }
          const rest = matchWake(text);
          if (rest !== null && (e.results[i].isFinal || rest === "")) {
            wakeUp(e.results[i].isFinal ? rest : "");
          }
        }
      };
      rec.onerror = e => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          toast(t("Microphone permission is needed for the wake word.", "محتاج إذن المايك عشان أسمع «يا لوتس»."));
          stop(); setToggle("wake", false);
        }
      };
      rec.onend = () => { if (active && !paused) setTimeout(() => { try { rec && rec.start(); } catch (err) { /* already started */ } }, 300); };
    }

    function start() {
      if (!SR) { toast(t("Wake word needs Chrome or Edge.", "الـ Wake word محتاج Chrome أو Edge.")); setToggle("wake", false); return; }
      active = true; paused = false;
      if (!rec) create();
      try { rec.start(); } catch (e) { /* already running */ }
      root.classList.add("wake-on");
      setState(root.dataset.state);
    }
    function stop() {
      active = false;
      root.classList.remove("wake-on");
      if (rec) { rec.onend = null; try { rec.abort(); } catch (e) { /* ignore */ } rec = null; }
      setState(root.dataset.state);
    }
    function pause() { if (!active || paused) return; paused = true; try { rec && rec.abort(); } catch (e) { /* ignore */ } }
    function resume() {
      if (!active || !paused) return;
      paused = false;
      if (rec) { rec.onend = null; } rec = null; create();
      setTimeout(() => { try { rec.start(); } catch (e) { /* ignore */ } }, 400);
    }
    function trigger() { wakeUp(""); if (!active) listenOnce(); }
    return { start, stop, pause, resume, trigger, get active() { return active; } };
  })();

  /* ---------- Computer vision (MediaPipe Tasks Vision) ---------- */
  const vision = (() => {
    let stream = null, gesture = null, face = null, raf = 0, running = false;
    let lastGesture = "", gestureSince = 0, lastFired = 0, faces = 0, facePresentSince = 0, lastGreet = 0, lastVideoTime = -1;
    const video = () => $("lotus-video");
    const canvas = () => $("lotus-canvas");
    const GESTURES = {
      Open_Palm: { label: "✋ Open palm", run: () => { wake.trigger(); } },
      Victory: { label: "✌️ Scroll down", run: () => runActions([{ type: "scroll", value: "down" }]) },
      Pointing_Up: { label: "☝️ Scroll up", run: () => runActions([{ type: "scroll", value: "up" }]) },
      Closed_Fist: { label: "✊ Stop", run: () => { stopSpeaking(); hideReaction(); } },
      Thumb_Up: { label: "👍 Thanks!", run: () => toast(t("👍 Glad to help!", "👍 تحت أمرك!")) },
      ILoveYou: { label: "🤟 Love you", run: () => toast("🤟 💜") },
    };

    async function loadModels() {
      const mp = await import(MP_BUNDLE);
      const files = await mp.FilesetResolver.forVisionTasks(MP_WASM);
      const opts = delegate => ({ baseOptions: { modelAssetPath: GESTURE_MODEL, delegate }, runningMode: "VIDEO", numHands: 1 });
      try { gesture = await mp.GestureRecognizer.createFromOptions(files, opts("GPU")); }
      catch (e) { gesture = await mp.GestureRecognizer.createFromOptions(files, opts("CPU")); }
      try {
        face = await mp.FaceDetector.createFromOptions(files, { baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" }, runningMode: "VIDEO", minDetectionConfidence: 0.6 });
      } catch (e) {
        face = await mp.FaceDetector.createFromOptions(files, { baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" }, runningMode: "VIDEO", minDetectionConfidence: 0.6 });
      }
      return mp;
    }

    let mpModule = null;
    async function start() {
      if (running) return;
      if (!navigator.mediaDevices?.getUserMedia) { toast(t("Camera is not available.", "الكاميرا مش متاحة.")); setToggle("cam", false); return; }
      try {
        root.classList.add("cam-on");
        setToggle("cam", true);
        openPanel(false);
        $("lotus-cv-face").textContent = t("Starting camera...", "بشغل الكاميرا...");
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360, facingMode: "user" }, audio: false });
        const v = video();
        v.srcObject = stream;
        await v.play();
        running = true;
        $("lotus-cv-face").textContent = t("Loading vision models...", "بحمل نماذج الرؤية...");
        if (!gesture) mpModule = await loadModels();
        $("lotus-cv-face").textContent = t("Vision ready", "الرؤية جاهزة");
        loop();
      } catch (err) {
        console.warn("[lotus] vision failed", err);
        toast(err && err.name === "NotAllowedError" ? t("Camera permission was denied.", "إذن الكاميرا مرفوض.") : t("Could not start vision.", "مقدرتش أشغل الرؤية."));
        stop();
      }
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(tr => tr.stop());
      stream = null;
      root.classList.remove("cam-on");
      setToggle("cam", false);
      faces = 0; lastGesture = "";
    }

    function draw(result, faceResult) {
      const c = canvas(), v = video();
      if (!c || !v.videoWidth) return;
      c.width = v.videoWidth; c.height = v.videoHeight;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      // faces: purple rounded boxes
      (faceResult?.detections || []).forEach(d => {
        const b = d.boundingBox;
        ctx.strokeStyle = "rgba(196,181,253,.95)"; ctx.lineWidth = 3;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(b.originX, b.originY, b.width, b.height, 14); else ctx.rect(b.originX, b.originY, b.width, b.height);
        ctx.stroke();
      });
      // hand landmarks
      (result?.landmarks || []).forEach(hand => {
        ctx.fillStyle = "#a855f7";
        hand.forEach(p => { ctx.beginPath(); ctx.arc(p.x * c.width, p.y * c.height, 4, 0, Math.PI * 2); ctx.fill(); });
        if (mpModule?.GestureRecognizer?.HAND_CONNECTIONS) {
          ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2;
          mpModule.GestureRecognizer.HAND_CONNECTIONS.forEach(({ start, end }) => {
            const a = hand[start], b = hand[end];
            ctx.beginPath(); ctx.moveTo(a.x * c.width, a.y * c.height); ctx.lineTo(b.x * c.width, b.y * c.height); ctx.stroke();
          });
        }
      });
    }

    function loop() {
      if (!running) return;
      const v = video();
      const now = performance.now();
      if (gesture && face && v.readyState >= 2 && v.currentTime !== lastVideoTime) {
        lastVideoTime = v.currentTime;
        let g = null, f = null;
        try { g = gesture.recognizeForVideo(v, now); f = face.detectForVideo(v, now); } catch (e) { /* frame skipped */ }
        draw(g, f);
        // faces / presence
        const n = f?.detections?.length || 0;
        if (n && !faces) facePresentSince = now;
        faces = n;
        $("lotus-cv-face").textContent = n ? t(`${n} face${n > 1 ? "s" : ""} detected`, `شايف ${n} وش`) : t("No face", "مفيش حد قدامي");
        if (n && now - facePresentSince > 1500 && now - lastGreet > 120000) {
          lastGreet = now;
          toast(t("👋 I see you! Show ✋ to talk to me.", "👋 شايفك! افتح كفك ✋ عشان تكلمني."));
        }
        // gestures (must be held ~0.6s, with cooldown)
        const top = g?.gestures?.[0]?.[0];
        const name = top && top.score > 0.6 ? top.categoryName : "None";
        if (name !== lastGesture) { lastGesture = name; gestureSince = now; }
        const def = GESTURES[name];
        $("lotus-cv-gesture").textContent = def ? def.label : "";
        if (def && now - gestureSince > 600 && now - lastFired > 2500) {
          lastFired = now;
          def.run();
        }
      }
      raf = requestAnimationFrame(loop);
    }

    function snapshot() {
      const v = video();
      if (!running || !v.videoWidth) return undefined;
      const c = document.createElement("canvas");
      const scale = Math.min(1, 640 / v.videoWidth);
      c.width = v.videoWidth * scale; c.height = v.videoHeight * scale;
      c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.72);
    }

    function summary() {
      if (!running) return "";
      return `camera on; faces in view: ${faces}; current hand gesture: ${lastGesture && lastGesture !== "None" ? lastGesture : "none"}`;
    }

    return { start, stop, snapshot, summary, get running() { return running; } };
  })();

  /* ---------- Toggles ---------- */
  function setToggle(name, on) {
    const ids = { wake: "lotus-t-wake", voice: "lotus-t-voice", cam: "lotus-t-cam" };
    const el = $(ids[name]);
    if (el) { el.classList.toggle("on", !!on); el.setAttribute("aria-pressed", on ? "true" : "false"); }
    if (name === "wake") { settings.wake = !!on; store.set("wake", !!on); }
    if (name === "voice") { settings.voice = !!on; store.set("voice", !!on); }
  }

  function refreshLangLabel() {
    $("lotus-lang-label").textContent = ar() ? "عربي" : "English";
    input.placeholder = t("Ask Lotus anything...", "اسأل لوتس أي حاجة...");
    $("lotus-cam-ask").textContent = t("What do you see?", "شايف إيه؟");
    setState(root.dataset.state);
  }

  /* ---------- Image upload (vision model) ---------- */
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const c = document.createElement("canvas");
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /* ---------- Init ---------- */
  function init() {
    document.body.appendChild(root);
    msgsBox = $("lotus-msgs");
    input = $("lotus-input");

    $("lotus-fab").addEventListener("click", () => (root.classList.contains("open") ? closePanel() : openPanel()));
    $("lotus-close").addEventListener("click", closePanel);
    $("lotus-form").addEventListener("submit", e => { e.preventDefault(); const v = input.value; input.value = ""; ask(v); });
    $("lotus-mic").addEventListener("click", listenOnce);
    $("lotus-suggest").addEventListener("click", e => { const b = e.target.closest("button"); if (b) ask(b.textContent); });
    $("lotus-t-voice").addEventListener("click", () => { setToggle("voice", !settings.voice); if (!settings.voice) stopSpeaking(); });
    $("lotus-t-wake").addEventListener("click", () => {
      const on = !settings.wake;
      setToggle("wake", on);
      if (on) { wake.start(); toast(t("Say “Hey Lotus” anytime 🎙️", "قول «يا لوتس» في أي وقت 🎙️")); } else wake.stop();
    });
    $("lotus-t-cam").addEventListener("click", () => (vision.running ? vision.stop() : vision.start()));
    $("lotus-cam-ask").addEventListener("click", () => {
      const img = vision.snapshot();
      if (img) ask(t("What do you see in my camera right now?", "شايف إيه في الكاميرا دلوقتي؟"), { image: img });
    });
    $("lotus-t-lang").addEventListener("click", () => {
      settings.lang = ar() ? "en-US" : "ar-EG";
      store.set("lang", settings.lang);
      refreshLangLabel();
      if (wake.active) { wake.stop(); wake.start(); }
      if (!history.length) renderAll();
    });
    $("lotus-t-clear").addEventListener("click", () => { history = []; saveHistory(); renderAll(); });
    $("lotus-img").addEventListener("click", () => $("lotus-file").click());
    $("lotus-file").addEventListener("change", async e => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;
      try {
        const img = await readImage(file);
        const q = input.value.trim() || t("What is in this image?", "إيه اللي في الصورة دي؟");
        input.value = "";
        ask(q, { image: img });
      } catch (err) { toast(t("Could not read that image.", "مقدرتش أقرا الصورة.")); }
    });
    // keyboard shortcut: Ctrl/Cmd + K opens Lotus, Esc closes
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPanel(); }
      if (e.key === "Escape" && root.classList.contains("open")) closePanel();
    });

    setToggle("voice", settings.voice);
    setToggle("wake", settings.wake);
    refreshLangLabel();
    renderAll();
    if ("speechSynthesis" in window) speechSynthesis.getVoices();
    if (session.get("open", false)) openPanel(false);
    if (settings.wake) wake.start();

    // continue actions requested before navigating to this page
    const pending = session.get("pending", []);
    if (pending && pending.length) {
      session.set("pending", []);
      const run = () => runActions(pending, true);
      if (window.CLUB_READY) window.CLUB_READY.then(() => setTimeout(run, 700)); else setTimeout(run, 1200);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
