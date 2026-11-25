import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ---------- Club content ---------- */

export const EVENT_CATEGORIES = ["Workshop", "Competition", "Seminar", "Networking"] as const;
export const MEMBER_GROUPS = ["Board", "Technical", "Media", "Events"] as const;
export const NEWS_CATEGORIES = ["Achievements", "Announcements", "Events", "Partnerships"] as const;
export const REGISTRATION_STATUSES = ["confirmed", "attended", "cancelled"] as const;

export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  category: mysqlEnum("category", EVENT_CATEGORIES).notNull(),
  /** Event date as YYYY-MM-DD */
  date: varchar("date", { length: 10 }).notNull(),
  time: varchar("time", { length: 60 }).notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  speaker: varchar("speaker", { length: 160 }).notNull().default(""),
  icon: varchar("icon", { length: 40 }).notNull().default("fa-calendar"),
  cover: varchar("cover", { length: 20 }).notNull().default("cover-1"),
  seats: int("seats").notNull().default(50),
  short: varchar("short", { length: 300 }).notNull(),
  description: text("description").notNull(),
  /** One agenda item per line */
  agenda: text("agenda").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClubEvent = typeof events.$inferSelect;

export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  role: varchar("role", { length: 120 }).notNull(),
  group: mysqlEnum("group", MEMBER_GROUPS).notNull(),
  dept: varchar("dept", { length: 120 }).notNull(),
  year: varchar("year", { length: 40 }).notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Member = typeof members.$inferSelect;

export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  category: mysqlEnum("category", NEWS_CATEGORIES).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  icon: varchar("icon", { length: 40 }).notNull().default("fa-newspaper"),
  cover: varchar("cover", { length: 20 }).notNull().default("cover-1"),
  excerpt: varchar("excerpt", { length: 300 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type NewsItem = typeof news.$inferSelect;

/* ---------- Form submissions ---------- */

export const registrations = mysqlTable(
  "registrations",
  {
    id: int("id").autoincrement().primaryKey(),
    ticket: varchar("ticket", { length: 20 }).notNull(),
    eventId: int("eventId").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    studentId: varchar("studentId", { length: 20 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    department: varchar("department", { length: 120 }).notNull(),
    level: varchar("level", { length: 40 }).notNull(),
    notes: text("notes"),
    status: mysqlEnum("status", REGISTRATION_STATUSES).notNull().default("confirmed"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  t => [
    uniqueIndex("registrations_ticket_idx").on(t.ticket),
    index("registrations_event_idx").on(t.eventId),
    index("registrations_email_idx").on(t.email),
  ]
);
export type Registration = typeof registrations.$inferSelect;

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 120 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ContactMessage = typeof messages.$inferSelect;

/* ---------- App settings (seed version, hashed admin setup code) ---------- */

export const appSettings = mysqlTable("app_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
