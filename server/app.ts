import { createServer, type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

let appPromise: Promise<Express> | null = null;

/**
 * Builds the fully configured Express app without binding a port, so the same
 * app can be served by a long-lived Node process (dev) or a serverless
 * function (production on Vercel). Memoized: a warm function instance reuses
 * the already-registered routes.
 */
export function createApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = (async () => {
      await registerRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        console.error("[ERROR]", status, message, err?.stack ?? "");
        if (!res.headersSent) {
          res.status(status).json({ message });
        }
      });

      return app;
    })();
  }
  return appPromise;
}

/**
 * Long-lived server entry point (local dev and any non-serverless host).
 * `setup` installs the front-end layer — Vite middleware in dev, static files
 * in a standalone production build — after the API routes are registered.
 */
export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const configuredApp = await createApp();
  const server = createServer(configuredApp);

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(configuredApp, server);

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
}
