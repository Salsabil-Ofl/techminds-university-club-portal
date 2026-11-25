import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerPublicApi } from "../publicApi";
import { registerAssistantApi } from "../assistant";

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", true);
  app.disable("x-powered-by");
  // Basic security headers (no X-Frame-Options: Preview is embedded in a frame)
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
    next();
  });
  // Small JSON bodies everywhere; the Lotus assistant may carry one camera snapshot
  const smallJson = express.json({ limit: "100kb" });
  const assistantJson = express.json({ limit: "3mb" });
  app.use((req, res, next) => (req.path.startsWith("/api/assistant/") ? assistantJson : smallJson)(req, res, next));
  app.use(express.urlencoded({ limit: "100kb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  registerPublicApi(app);
  registerAssistantApi(app);
  // The public website lives in static HTML pages; the dashboard is the React app at /admin
  app.get(["/", "/index.html"], (_req, res) => res.redirect(302, "/home.html"));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
