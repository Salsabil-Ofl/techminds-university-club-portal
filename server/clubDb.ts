/**
 * clubDb.ts - Database queries for the club portal (content, forms, admin).
 */
import crypto from "node:crypto";
import { and, asc, count, desc, eq, ne, sql } from "drizzle-orm";
import {
  appSettings,
  events,
  members,
  messages,
  news,
  registrations,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";

async function db() {
  const instance = await getDb();
  if (!instance) throw new Error("Database is not available");
  return instance;
}

/** Today's date as YYYY-MM-DD (server time) */
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- Events ---------- */

/** Events with the number of active (not cancelled) registrations */
export async function listEventsWithCounts() {
  const d = await db();
  const rows = await d
    .select({
      event: events,
      registered: sql<number>`COUNT(CASE WHEN ${registrations.status} <> 'cancelled' THEN ${registrations.id} END)`,
    })
    .from(events)
    .leftJoin(registrations, eq(registrations.eventId, events.id))
    .groupBy(events.id)
    .orderBy(asc(events.date));
  return rows.map(r => ({ ...r.event, registered: Number(r.registered) }));
}

export async function getEvent(id: number) {
  const d = await db();
  const rows = await d.select().from(events).where(eq(events.id, id)).limit(1);
  return rows[0];
}

export async function countActiveRegistrations(eventId: number) {
  const d = await db();
  const rows = await d
    .select({ c: count() })
    .from(registrations)
    .where(and(eq(registrations.eventId, eventId), ne(registrations.status, "cancelled")));
  return Number(rows[0]?.c ?? 0);
}

export type EventInput = Omit<typeof events.$inferInsert, "id" | "createdAt" | "updatedAt">;

export async function createEvent(input: EventInput) {
  const d = await db();
  await d.insert(events).values(input);
}
export async function updateEvent(id: number, input: EventInput) {
  const d = await db();
  return d.transaction(async tx => {
    const [event] = await tx.select({ id: events.id, seats: events.seats }).from(events).where(eq(events.id, id)).limit(1).for("update");
    if (!event) return false;
    const [active] = await tx
      .select({ c: count() })
      .from(registrations)
      .where(and(eq(registrations.eventId, id), ne(registrations.status, "cancelled")));
    if ((input.seats ?? event.seats) < Number(active?.c ?? 0)) return false;
    await tx.update(events).set(input).where(eq(events.id, id));
    return true;
  });
}
export async function deleteEvent(id: number) {
  const d = await db();
  await d.transaction(async tx => {
    const [event] = await tx.select({ id: events.id }).from(events).where(eq(events.id, id)).limit(1).for("update");
    if (!event) return;
    await tx.delete(registrations).where(eq(registrations.eventId, id));
    await tx.delete(events).where(eq(events.id, id));
  });
}

/* ---------- Members ---------- */

export async function listMembers() {
  const d = await db();
  return d.select().from(members).orderBy(asc(members.sortOrder), asc(members.id));
}
export type MemberInput = Omit<typeof members.$inferInsert, "id" | "createdAt">;
export async function createMember(input: MemberInput) {
  const d = await db();
  await d.insert(members).values(input);
}
export async function updateMember(id: number, input: MemberInput) {
  const d = await db();
  await d.update(members).set(input).where(eq(members.id, id));
}
export async function deleteMember(id: number) {
  const d = await db();
  await d.delete(members).where(eq(members.id, id));
}

/* ---------- News ---------- */

export async function listNews() {
  const d = await db();
  return d.select().from(news).orderBy(desc(news.date), desc(news.id));
}
export type NewsInput = Omit<typeof news.$inferInsert, "id" | "createdAt">;
export async function createNews(input: NewsInput) {
  const d = await db();
  await d.insert(news).values(input);
}
export async function updateNews(id: number, input: NewsInput) {
  const d = await db();
  await d.update(news).set(input).where(eq(news.id, id));
}
export async function deleteNews(id: number) {
  const d = await db();
  await d.delete(news).where(eq(news.id, id));
}

/* ---------- Registrations ---------- */

export async function findActiveRegistration(eventId: number, email: string) {
  const d = await db();
  const rows = await d
    .select({ id: registrations.id })
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.email, email),
        ne(registrations.status, "cancelled")
      )
    )
    .limit(1);
  return rows[0];
}

export function newTicket() {
  return "TM-" + crypto.randomInt(100000, 999999).toString();
}

/** Serialize registration checks per event so parallel requests cannot oversell seats or duplicate an active email. */
export async function registerIfAvailable(input: Omit<typeof registrations.$inferInsert, "id" | "createdAt" | "status" | "ticket">) {
  const d = await db();
  return d.transaction(async tx => {
    const [event] = await tx.select().from(events).where(eq(events.id, input.eventId)).limit(1).for("update");
    if (!event) return { status: "not_found" as const };
    if (event.date < todayStr()) return { status: "finished" as const };

    const [existing] = await tx
      .select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, event.id),
          eq(registrations.email, input.email),
          ne(registrations.status, "cancelled")
        )
      )
      .limit(1);
    if (existing) return { status: "duplicate" as const };

    const [active] = await tx
      .select({ c: count() })
      .from(registrations)
      .where(and(eq(registrations.eventId, event.id), ne(registrations.status, "cancelled")));
    if (Number(active?.c ?? 0) >= event.seats) return { status: "full" as const };

    const ticket = newTicket();
    await tx.insert(registrations).values({ ...input, ticket });
    return { status: "created" as const, ticket, event };
  });
}

export async function cancelRegistrationByTicket(ticket: string, email: string) {
  const d = await db();
  const result = await d
    .update(registrations)
    .set({ status: "cancelled" })
    .where(and(eq(registrations.ticket, ticket), eq(registrations.email, email)));
  return (result[0] as { affectedRows?: number }).affectedRows ?? 0;
}

export async function listRegistrations() {
  const d = await db();
  return d
    .select({
      id: registrations.id,
      ticket: registrations.ticket,
      name: registrations.name,
      studentId: registrations.studentId,
      email: registrations.email,
      phone: registrations.phone,
      department: registrations.department,
      level: registrations.level,
      notes: registrations.notes,
      status: registrations.status,
      createdAt: registrations.createdAt,
      eventId: registrations.eventId,
      eventTitle: events.title,
      eventDate: events.date,
    })
    .from(registrations)
    .leftJoin(events, eq(events.id, registrations.eventId))
    .orderBy(desc(registrations.createdAt));
}

export async function setRegistrationStatus(id: number, status: "confirmed" | "attended" | "cancelled") {
  const d = await db();
  return d.transaction(async tx => {
    const [stub] = await tx.select({ eventId: registrations.eventId }).from(registrations).where(eq(registrations.id, id)).limit(1);
    if (!stub) return "not_found" as const;
    const [event] = await tx
      .select({ id: events.id, seats: events.seats })
      .from(events)
      .where(eq(events.id, stub.eventId))
      .limit(1)
      .for("update");
    if (!event) return "not_found" as const;
    const [registration] = await tx
      .select({ status: registrations.status })
      .from(registrations)
      .where(eq(registrations.id, id))
      .limit(1)
      .for("update");
    if (!registration) return "not_found" as const;
    if (registration.status === "cancelled" && status !== "cancelled") {
      const [active] = await tx
        .select({ c: count() })
        .from(registrations)
        .where(and(eq(registrations.eventId, stub.eventId), ne(registrations.status, "cancelled")));
      if (Number(active?.c ?? 0) >= event.seats) return "full" as const;
    }
    await tx.update(registrations).set({ status }).where(eq(registrations.id, id));
    return "updated" as const;
  });
}
export async function deleteRegistration(id: number) {
  const d = await db();
  await d.delete(registrations).where(eq(registrations.id, id));
}

/* ---------- Messages ---------- */

export async function createMessage(input: Omit<typeof messages.$inferInsert, "id" | "createdAt" | "isRead">) {
  const d = await db();
  await d.insert(messages).values(input);
}
export async function listMessages() {
  const d = await db();
  return d.select().from(messages).orderBy(desc(messages.createdAt));
}
export async function setMessageRead(id: number, isRead: boolean) {
  const d = await db();
  await d.update(messages).set({ isRead }).where(eq(messages.id, id));
}
export async function deleteMessage(id: number) {
  const d = await db();
  await d.delete(messages).where(eq(messages.id, id));
}

/* ---------- Overview stats ---------- */

export async function getOverview() {
  const d = await db();
  const today = todayStr();
  const [regs] = await d.select({ c: count() }).from(registrations).where(ne(registrations.status, "cancelled"));
  const [unread] = await d.select({ c: count() }).from(messages).where(eq(messages.isRead, false));
  const [upcoming] = await d.select({ c: count() }).from(events).where(sql`${events.date} >= ${today}`);
  const [memberCount] = await d.select({ c: count() }).from(members);
  const perEvent = await listEventsWithCounts();
  const latest = (await listRegistrations()).slice(0, 6);
  return {
    registrations: Number(regs?.c ?? 0),
    unreadMessages: Number(unread?.c ?? 0),
    upcomingEvents: Number(upcoming?.c ?? 0),
    members: Number(memberCount?.c ?? 0),
    perEvent: perEvent.map(e => ({ id: e.id, title: e.title, registered: e.registered, seats: e.seats })),
    latest,
  };
}

/* ---------- Users & admin roles ---------- */

export async function listUsers() {
  const d = await db();
  return d
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastSignedIn: users.lastSignedIn,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.lastSignedIn));
}

export async function setUserRole(id: number, role: "user" | "admin") {
  const d = await db();
  if (role === "user") {
    return d.transaction(async tx => {
      // Lock the current admin rows so simultaneous revocations cannot remove the final admin.
      const admins = await tx.select({ id: users.id }).from(users).where(eq(users.role, "admin")).for("update");
      if (admins.length === 1 && admins[0].id === id) return false;
      await tx.update(users).set({ role }).where(eq(users.id, id));
      return true;
    });
  }
  await d.update(users).set({ role }).where(eq(users.id, id));
  return true;
}

export async function countAdmins() {
  const d = await db();
  const [row] = await d.select({ c: count() }).from(users).where(eq(users.role, "admin"));
  return Number(row?.c ?? 0);
}

/** Aggregate-only assistant context; deliberately excludes registrant names and contact details. */
export async function getAssistantAdminStats() {
  const d = await db();
  const [registrationsCount] = await d.select({ c: count() }).from(registrations).where(ne(registrations.status, "cancelled"));
  const [unread] = await d.select({ c: count() }).from(messages).where(eq(messages.isRead, false));
  const [upcoming] = await d.select({ c: count() }).from(events).where(sql`${events.date} >= ${todayStr()}`);
  const [memberCount] = await d.select({ c: count() }).from(members);
  return {
    registrations: Number(registrationsCount?.c ?? 0),
    unreadMessages: Number(unread?.c ?? 0),
    upcomingEvents: Number(upcoming?.c ?? 0),
    members: Number(memberCount?.c ?? 0),
  };
}

export async function adminSetupAvailable() {
  const d = await db();
  const [admin] = await d.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1);
  const [setup] = await d
    .select({ key: appSettings.key })
    .from(appSettings)
    .where(eq(appSettings.key, "admin_setup_hash"))
    .limit(1);
  return !admin && Boolean(setup);
}

/**
 * Claim the first admin role with the one-time setup code.
 * Works only while no admin exists; the code is deleted after success.
 */
export async function claimAdmin(userId: number, code: string) {
  const d = await db();
  return d.transaction(async tx => {
    // Lock the single-use secret first; a concurrent claimant must observe its deletion.
    const [setup] = await tx
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, "admin_setup_hash"))
      .limit(1)
      .for("update");
    const admins = await tx.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1).for("update");
    if (admins.length) return { ok: false as const, reason: "admin_exists" as const };
    if (!setup?.value) return { ok: false as const, reason: "no_code" as const };

    const stored = setup.value;
    if (!/^[a-f0-9]{64}$/i.test(stored)) return { ok: false as const, reason: "wrong_code" as const };
    const given = crypto.createHash("sha256").update(code.trim().toUpperCase()).digest();
    const expected = Buffer.from(stored, "hex");
    if (!crypto.timingSafeEqual(given, expected)) return { ok: false as const, reason: "wrong_code" as const };

    await tx.update(users).set({ role: "admin" }).where(eq(users.id, userId));
    await tx.delete(appSettings).where(eq(appSettings.key, "admin_setup_hash"));
    return { ok: true as const };
  });
}
