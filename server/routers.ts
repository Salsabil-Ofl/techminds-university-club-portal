import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { EVENT_CATEGORIES, MEMBER_GROUPS, NEWS_CATEGORIES, REGISTRATION_STATUSES } from "../drizzle/schema";
import * as club from "./clubDb";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

/* ---------- Input schemas (server-side validation) ---------- */
const dateRule = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const iconRule = z.string().trim().regex(/^fa-[a-z0-9-]{1,36}$/, "Icon must look like fa-robot");
const coverRule = z.enum(["cover-1", "cover-2", "cover-3", "cover-4", "cover-5", "cover-6"]);
const id = z.object({ id: z.number().int().positive() });

const eventInput = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.enum(EVENT_CATEGORIES),
  date: dateRule,
  time: z.string().trim().min(2).max(60),
  location: z.string().trim().min(2).max(160),
  speaker: z.string().trim().max(160).default(""),
  icon: iconRule,
  cover: coverRule,
  seats: z.number().int().min(1).max(5000),
  short: z.string().trim().min(5).max(300),
  description: z.string().trim().min(10).max(5000),
  agenda: z.string().trim().max(3000),
});

const optionalMemberValue = (schema: z.ZodType<string>) =>
  z.preprocess(value => value == null || (typeof value === "string" && value.trim() === "") ? "" : value, schema);
const optionalStudentId = optionalMemberValue(z.string().regex(/^(?:[0-9]{6,10})?$/, "Student ID must be 6-10 digits"));
const optionalProfileUrl = (allowedHosts: string[]) => optionalMemberValue(
  z.string().max(512).refine(value => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }, "Enter an HTTPS profile URL on the allowed service")
);
const memberInput = z.object({
  name: z.string().trim().min(3).max(120),
  role: z.string().trim().min(2).max(120),
  group: z.enum(MEMBER_GROUPS),
  dept: z.string().trim().max(120),
  year: z.string().trim().max(40),
  studentId: optionalStudentId,
  linkedinUrl: optionalProfileUrl(["linkedin.com"]),
  githubUrl: optionalProfileUrl(["github.com"]),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

const newsInput = z.object({
  title: z.string().trim().min(3).max(200),
  category: z.enum(NEWS_CATEGORIES),
  date: dateRule,
  icon: iconRule,
  cover: coverRule,
  excerpt: z.string().trim().min(5).max(300),
  content: z.string().trim().min(10).max(5000),
});

/* ---------- Admin router: every procedure requires role = admin ---------- */
const adminRouter = router({
  overview: adminProcedure.query(() => club.getOverview()),

  events: router({
    list: adminProcedure.query(() => club.listEventsWithCounts()),
    create: adminProcedure.input(eventInput).mutation(({ input }) => club.createEvent(input)),
    update: adminProcedure
      .input(id.extend({ data: eventInput }))
      .mutation(({ input }) => club.updateEvent(input.id, input.data)),
    delete: adminProcedure.input(id).mutation(({ input }) => club.deleteEvent(input.id)),
  }),

  members: router({
    list: adminProcedure.query(() => club.listMembers()),
    create: adminProcedure.input(memberInput).mutation(({ input }) => club.createMember(input)),
    update: adminProcedure
      .input(id.extend({ data: memberInput }))
      .mutation(({ input }) => club.updateMember(input.id, input.data)),
    delete: adminProcedure.input(id).mutation(({ input }) => club.deleteMember(input.id)),
  }),

  news: router({
    list: adminProcedure.query(() => club.listNews()),
    create: adminProcedure.input(newsInput).mutation(({ input }) => club.createNews(input)),
    update: adminProcedure
      .input(id.extend({ data: newsInput }))
      .mutation(({ input }) => club.updateNews(input.id, input.data)),
    delete: adminProcedure.input(id).mutation(({ input }) => club.deleteNews(input.id)),
  }),

  registrations: router({
    list: adminProcedure.query(() => club.listRegistrations()),
    setStatus: adminProcedure
      .input(id.extend({ status: z.enum(REGISTRATION_STATUSES) }))
      .mutation(({ input }) => club.setRegistrationStatus(input.id, input.status)),
    delete: adminProcedure.input(id).mutation(({ input }) => club.deleteRegistration(input.id)),
  }),

  messages: router({
    list: adminProcedure.query(() => club.listMessages()),
    setRead: adminProcedure
      .input(id.extend({ isRead: z.boolean() }))
      .mutation(({ input }) => club.setMessageRead(input.id, input.isRead)),
    delete: adminProcedure.input(id).mutation(({ input }) => club.deleteMessage(input.id)),
  }),

  users: router({
    list: adminProcedure.query(() => club.listUsers()),
    setRole: adminProcedure
      .input(id.extend({ role: z.enum(["user", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        if (input.id === ctx.user.id && input.role !== "admin") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot remove your own admin role." });
        }
        const updated = await club.setUserRole(input.id, input.role);
        if (!updated) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You cannot remove the last admin." });
        }
      }),
  }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    /** Whether the one-time admin setup is still available */
    setupAvailable: protectedProcedure.query(async () => ({ available: await club.adminSetupAvailable() })),
    /** Claim the first admin role with the one-time setup code */
    claimAdmin: protectedProcedure
      .input(z.object({ code: z.string().trim().min(6).max(40) }))
      .mutation(async ({ ctx, input }) => {
        const result = await club.claimAdmin(ctx.user.id, input.code);
        if (!result.ok) {
          const message =
            result.reason === "wrong_code"
              ? "Wrong setup code."
              : result.reason === "admin_exists"
                ? "An admin already exists. Ask an admin to give you access."
                : "Setup code is not available.";
          throw new TRPCError({ code: "FORBIDDEN", message });
        }
        return { success: true } as const;
      }),
  }),
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
