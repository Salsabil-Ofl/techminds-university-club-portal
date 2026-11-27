/**
 * publicApi.ts - Plain REST endpoints used by the public HTML/JS website.
 * All input is validated with zod and POST routes are rate limited.
 */
import type { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as club from "./clubDb";

/* ---------- Simple in-memory rate limiter (per IP) ---------- */
const hits = new Map<string, { count: number; reset: number }>();
function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.ip || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      res.status(429).json({ error: "Too many requests. Please try again in a minute." });
      return;
    }
    next();
  };
}
// clean old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  hits.forEach((v, k) => v.reset < now && hits.delete(k));
}, 5 * 60 * 1000).unref();

/* ---------- Validation schemas ---------- */
const nameRule = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[A-Za-z\u0600-\u06FF\s.'-]+$/, "Name must contain letters only");

const registrationSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  name: nameRule,
  studentId: z.string().trim().regex(/^[0-9]{6,10}$/, "Student ID must be 6-10 digits"),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian mobile number"),
  department: z.string().trim().min(2).max(120),
  level: z.string().trim().min(2).max(40),
  notes: z.string().trim().max(1000).optional().default(""),
});

const cancelSchema = z.object({
  ticket: z.string().trim().regex(/^TM-[0-9]{6}$/),
  email: z.string().trim().toLowerCase().email(),
});

const messageSchema = z.object({
  name: nameRule,
  email: z.string().trim().toLowerCase().email().max(320),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(20).max(500),
});

function firstIssue(error: z.ZodError) {
  const issue = error.issues[0];
  return issue ? `${issue.path.join(".") || "input"}: ${issue.message}` : "Invalid input";
}

export function registerPublicApi(app: Express) {
  // Public content for the website
  app.get("/api/public/content", async (_req, res) => {
    try {
      const [eventList, memberList, newsList] = await Promise.all([
        club.listEventsWithCounts(),
        club.listMembers(),
        club.listNews(),
      ]);
      res.set("Cache-Control", "no-store").json({
        events: eventList.map(e => ({
          id: e.id,
          title: e.title,
          category: e.category,
          date: e.date,
          time: e.time,
          location: e.location,
          speaker: e.speaker,
          icon: e.icon,
          cover: e.cover,
          seats: e.seats,
          registered: e.registered,
          short: e.short,
          description: e.description,
          agenda: e.agenda.split("\n").map(s => s.trim()).filter(Boolean),
        })),
        members: memberList.map(({ name, role, group, dept, year, studentId, linkedinUrl, githubUrl }) => ({ name, role, group, dept, year, studentId, linkedinUrl, githubUrl })),
        news: newsList.map(({ id, title, category, date, icon, cover, excerpt, content }) => ({
          id, title, category, date, icon, cover, excerpt, content,
        })),
      });
    } catch (error) {
      console.error("[public] content failed", error);
      res.status(500).json({ error: "Could not load content" });
    }
  });

  // Event registration
  app.post("/api/public/registrations", rateLimit(8, 60_000), async (req, res) => {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: firstIssue(parsed.error) });
      return;
    }
    const input = parsed.data;
    try {
      const result = await club.registerIfAvailable(input);
      if (result.status === "not_found") {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      if (result.status === "finished") {
        res.status(400).json({ error: "This event has already finished" });
        return;
      }
      if (result.status === "duplicate") {
        res.status(409).json({ error: "You are already registered for this event." });
        return;
      }
      if (result.status === "full") {
        res.status(409).json({ error: "Sorry, this event is fully booked." });
        return;
      }
      res.status(201).json({
        ticket: result.ticket,
        name: input.name,
        email: input.email,
        event: {
          id: result.event.id,
          title: result.event.title,
          date: result.event.date,
          time: result.event.time,
          location: result.event.location,
        },
      });
    } catch (error) {
      console.error("[public] registration failed", error);
      res.status(500).json({ error: "Registration failed, please try again." });
    }
  });

  // Cancel own registration (ticket + email must match)
  app.post("/api/public/registrations/cancel", rateLimit(10, 60_000), async (req, res) => {
    const parsed = cancelSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid ticket or email" });
      return;
    }
    try {
      const affected = await club.cancelRegistrationByTicket(parsed.data.ticket, parsed.data.email);
      if (!affected) {
        res.status(404).json({ error: "Registration not found" });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("[public] cancel failed", error);
      res.status(500).json({ error: "Could not cancel registration" });
    }
  });

  // Contact message
  app.post("/api/public/messages", rateLimit(5, 60_000), async (req, res) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: firstIssue(parsed.error) });
      return;
    }
    try {
      await club.createMessage(parsed.data);
      res.status(201).json({ ok: true });
    } catch (error) {
      console.error("[public] message failed", error);
      res.status(500).json({ error: "Could not send message" });
    }
  });
}
