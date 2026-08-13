#!/usr/bin/env node
import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function resolveCommit() {
  // On Vercel the build runs from a shallow clone, so trust the injected
  // metadata first and only shell out to git for local builds.
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD", { cwd: projectRoot })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

function generateBuildInfo() {
  const now = new Date();
  const { version } = JSON.parse(
    readFileSync(join(projectRoot, "package.json"), "utf-8"),
  );

  const buildInfo = {
    version,
    buildDate: now.toISOString().split("T")[0],
    buildTime: now.toISOString(),
    gitCommit: resolveCommit(),
  };

  const outputPath = join(projectRoot, "build-info.json");
  writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2) + "\n");
  console.log(`Build info generated: ${JSON.stringify(buildInfo)}`);
}

generateBuildInfo();
