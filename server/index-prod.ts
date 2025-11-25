import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import express, { type Express } from "express";
import runApp from "./app";

console.log("[STARTUP] Production server initializing...");
console.log("[STARTUP] Node version:", process.version);
console.log("[STARTUP] Environment:", process.env.NODE_ENV);
console.log("[STARTUP] PORT:", process.env.PORT || "5000 (default)");
console.log("[STARTUP] DATABASE_URL:", process.env.DATABASE_URL ? "configured" : "NOT SET");

export async function serveStatic(app: Express, _server: Server) {
  const distPath = path.resolve(import.meta.dirname, "public");
  console.log("[STARTUP] Looking for static files at:", distPath);

  if (!fs.existsSync(distPath)) {
    console.error("[STARTUP] ERROR: Build directory not found at:", distPath);
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  console.log("[STARTUP] Static files directory found, configuring express.static");
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
  
  console.log("[STARTUP] Static file serving configured successfully");
}

(async () => {
  try {
    console.log("[STARTUP] Starting application...");
    await runApp(serveStatic);
    console.log("[STARTUP] Application started successfully");
  } catch (error) {
    console.error("[STARTUP] FATAL ERROR during startup:", error);
    process.exit(1);
  }
})();
