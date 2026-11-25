# TODO - TechMinds Club Portal + Secure Admin Dashboard

## 1. Public website (12 pages)
- [ ] Pages: Home, About, Events, Event details, Members, News, Gallery, Register, My Tickets, FAQ, Contact, Login, all linked through a clear navigation menu, responsive on mobile and desktop.
- [ ] White + mint green identity with gradients; JavaScript effects: scroll reveal, number counters, typing text, countdown, button ripple, card tilt, toast notifications.
- [ ] Events, members and news are loaded from the database (with search and filtering by type and status); static sample data is only a fallback.
- [ ] Admin-entered content is HTML-escaped before rendering on the public site.

## 2. Public forms saved to the database
- [ ] Event registration form: required-field validation, saved to the database, success message with a ticket number, duplicate registration (same email + same event) prevented, full events rejected.
- [ ] Contact form: required-field validation, saved to the database, success message.
- [ ] Public POST endpoints are validated server-side (zod) and rate limited.

## 3. Secure dashboard access
- [ ] Dashboard login with a Manus account; admin role is checked on the server for every dashboard request; non-admins are blocked.
- [ ] First admin is claimed with a one-time setup code (stored hashed); claiming is disabled once an admin exists.

## 4. Dashboard pages
- [ ] Overview: KPIs (registrations, unread messages, upcoming events, members), chart of registrations per event, latest registrations.
- [ ] Registrations: table with search and filter by event, change status (confirmed, attended, cancelled), delete, export CSV.
- [ ] Content management: add / edit / delete events, members and news; changes appear immediately on the public site.
- [ ] Messages inbox: view contact messages, mark as read, delete.
- [ ] User permissions: promote a user to admin or revoke admin (cannot revoke yourself).
- [ ] Organised dashboard design with sidebar, clear tables, responsive on mobile, mint/white theme.

## 5. Delivery
- [ ] Checkpoint saved and website published to a permanent URL.
