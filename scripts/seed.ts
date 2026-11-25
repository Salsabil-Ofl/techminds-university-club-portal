/**
 * One-time seed: copies the sample data from client/public/js/data.js into the
 * database and creates the hashed one-time admin setup code.
 * Runs only unfinished work (tracked by the "seed_version" setting).
 *
 * Usage: pnpm db:seed
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { appSettings, events, members, news } from "../drizzle/schema";

const SEED_VERSION = "1";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");
  const pool = mysql.createPool(process.env.DATABASE_URL);
  const db = drizzle(pool);

  try {
    const done = await db.select().from(appSettings).where(eq(appSettings.key, "seed_version")).limit(1);
    if (done[0]?.value === SEED_VERSION) {
      console.log("Content seed already applied.");
    } else {
      // Load the same sample data used by the static site
      const file = path.resolve(import.meta.dirname, "../client/public/js/data.js");
      const code = fs.readFileSync(file, "utf-8") + "\n;({ EVENTS, MEMBERS, NEWS });";
      const data = vm.runInNewContext(code) as {
        EVENTS: any[];
        MEMBERS: any[];
        NEWS: any[];
      };

      await db.insert(events).values(
        data.EVENTS.map(e => ({
          title: e.title,
          category: e.category,
          date: e.date,
          time: e.time,
          location: e.location,
          speaker: e.speaker,
          icon: e.icon,
          cover: e.cover,
          seats: e.seats,
          short: e.short,
          description: e.description,
          agenda: e.agenda.join("\n"),
        }))
      );
      await db.insert(members).values(
        data.MEMBERS.map((m, i) => ({
          name: m.name,
          role: m.role,
          group: m.group,
          dept: m.dept,
          year: m.year,
          sortOrder: i,
        }))
      );
      await db.insert(news).values(
        data.NEWS.map(n => ({
          title: n.title,
          category: n.category,
          date: n.date,
          icon: n.icon,
          cover: n.cover,
          excerpt: n.excerpt,
          content: n.content,
        }))
      );
      await db
        .insert(appSettings)
        .values({ key: "seed_version", value: SEED_VERSION })
        .onDuplicateKeyUpdate({ set: { value: SEED_VERSION } });
      console.log(`Seeded ${data.EVENTS.length} events, ${data.MEMBERS.length} members, ${data.NEWS.length} news.`);
    }

    // One-time admin setup code (only the SHA-256 hash is stored)
    const existing = await db.select().from(appSettings).where(eq(appSettings.key, "admin_setup_hash")).limit(1);
    if (existing.length === 0) {
      const setupCode = crypto.randomBytes(9).toString("base64url").toUpperCase();
      const hash = crypto.createHash("sha256").update(setupCode).digest("hex");
      await db.insert(appSettings).values({ key: "admin_setup_hash", value: hash });
      console.log(`ADMIN SETUP CODE: ${setupCode}`);
    } else {
      console.log("Admin setup code already exists (not shown again).");
    }
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
