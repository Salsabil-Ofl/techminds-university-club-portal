/**
 * assistantKnowledge.ts - Static knowledge given to the Lotus AI assistant.
 * Club facts, site map and the technical answers used in the project discussion.
 */

export const SITE_MAP = `
PUBLIC WEBSITE PAGES (relative URLs):
- home.html: intro, featured upcoming events, countdown to the next event, latest news
- about.html: club story, mission, vision, values, committees, timeline
- events.html: all events with search box, category filter (Workshop, Competition, Seminar, Networking) and status tabs (upcoming / past / all)
- event-details.html?id=<eventId>: full details, agenda, seats, register button
- members.html: team members with search and team filter (Board, Technical, Media, Events)
- news.html: news articles with search and category filter
- gallery.html: photo gallery with lightbox
- register.html?event=<eventId>: registration form (name, student ID 6-10 digits, email, Egyptian mobile 01xxxxxxxxx, department, level, event, notes, accept terms). Success shows a ticket number like TM-123456
- my-registrations.html: tickets booked from this browser, can cancel
- faq.html: frequently asked questions
- contact.html: contact form (name, email, subject, message 20-500 chars)
- login.html: student login / sign-up demo page
- /admin: secure admin dashboard (admins only)
ADMIN DASHBOARD PAGES: /admin (overview KPIs + chart), /admin/registrations (search, filter, status, CSV export), /admin/events, /admin/members, /admin/news (add/edit/delete content), /admin/messages (contact inbox), /admin/users (grant / revoke admin role)
`.trim();

export const CLUB_FACTS = `
TechMinds Club - the technology student club of Borg El Arab Technological University (Egypt).
Started in 2022 as a study group of 15 IT students; first hackathon in 2023 with 80 participants; industry partnerships with 3 local tech companies in 2025; 350+ members in 2026 and 1st place at the regional hackathon.
Mission: empower students with practical technical skills and a supportive community. Vision: the leading student tech community in Egyptian technological universities. Values: collaboration, curiosity, respect, continuous learning.
Committees: Technical (web, AI, programming workshops), Media (design, photography, content), Events (planning activities), PR (partnerships and sponsorships).
FAQ:
- Who can join? Any student of the university, any department or level, no experience needed.
- Is membership free? Yes. Some special workshops may have a small materials fee announced in advance.
- How to register? Events page -> open an event -> Register Now, or use the Registration page. You get a ticket number.
- Cancel? Open My Tickets and click Cancel.
- Certificates? Workshop/bootcamp attendees get attendance certificates; competition winners get certificates and prizes.
- Join a committee? Recruitment opens at the start of each semester; follow the News page.
`.trim();

export const TECH_QA = `
PROJECT TECHNICAL DISCUSSION (use these answers when asked about how the project was built):
1) Why these tools?
- HTML5 + CSS3 + vanilla JavaScript for the public site: required by the Web Development I course, fast to load, no build step, easy to deploy on the university server. CSS variables hold the white + mint-green theme and gradients so the palette is changed in one place.
- React 19 + TypeScript + Tailwind + shadcn/ui for the admin dashboard (the course bonus "front-end framework"): reusable components, typed code, accessible dialogs/tables.
- Node.js + Express server with tRPC (type-safe API between server and dashboard) and a small REST API for the static pages.
- MySQL database with Drizzle ORM: real persistence instead of localStorage, typed queries, migrations.
- Manus OAuth login for the dashboard: no passwords stored by us.
- Lotus AI: built-in LLM (vision capable) through the server, Web Speech API for voice (speech-to-text and text-to-speech), MediaPipe Tasks Vision (computer vision in the browser) for hand-gesture and face detection.
2) Challenges and how they were solved
- 10+ pages sharing the same header/footer: built once in main.js (renderHeader / renderFooter) and injected into every page, so a change in one place updates all pages.
- Form validation: generic validateField() driven by data attributes (required, email, Egyptian phone regex, student ID 6-10 digits, min length) with live feedback; the server validates again with zod because client checks can be bypassed.
- Duplicate registrations and full events: the server checks same email + same event and the seats count before saving.
- Mobile layout overflow: found with automated Playwright tests at 375px width and fixed with responsive grids and a hamburger menu.
- Moving from demo localStorage data to a real database while keeping the static pages: api.js loads content from /api/public/content and falls back to the sample data if the server is unreachable.
- Making the AI act on the page: the model returns structured JSON (reply + actions) that the browser executes safely from a fixed whitelist (navigate, search, scroll, open event, open registration...).
3) Performance
- No heavy framework on public pages; one CSS file and a few small JS files; Font Awesome and Google Fonts from CDNs.
- Animations use transform/opacity and IntersectionObserver (scroll reveal, counters) instead of scroll listeners doing heavy work; requestAnimationFrame for counters.
- Content API returns only needed fields in one request; database indexes on registrations (event, email, ticket).
- Dashboard data cached by React Query; the AI vision model runs on the GPU in the browser via WebAssembly/WebGL and only when the camera is turned on.
4) Security
- Admin dashboard: login required; the admin role is checked on the server for every request (adminProcedure), not only hidden in the UI. First admin is activated with a one-time setup code stored only as a SHA-256 hash and deleted after use. An admin cannot remove his own admin role.
- Input validation with zod on every endpoint, request body size limit (100 KB), and per-IP rate limiting on public forms and on the AI endpoint.
- XSS protection: all database text is escaped (esc()) before being inserted into HTML; React escapes by default.
- SQL injection protection: parameterized queries through Drizzle ORM.
- Secure session cookie (HttpOnly, Secure, SameSite=None), security headers (X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy), CSV export protected against formula injection.
- AI safety: API keys stay on the server, the assistant can only run whitelisted actions, camera/mic only start after the user clicks and can be stopped any time; camera frames are processed locally and a snapshot is sent only when the user asks Lotus about what it sees.
`.trim();
