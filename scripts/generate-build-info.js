#!/usr/bin/env node
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function generateBuildInfo() {
  const now = new Date();
  let gitCommit = "unknown";
  let commitCount = 0;

  try {
    gitCommit = execSync("git rev-parse --short HEAD", { cwd: projectRoot })
      .toString()
      .trim();
    commitCount = parseInt(
      execSync("git rev-list --count HEAD", { cwd: projectRoot })
        .toString()
        .trim(),
      10
    );
  } catch (error) {
    console.warn("Warning: Could not get git info:", error.message);
  }

  const buildInfo = {
    version: `1.1.${commitCount}`,
    buildDate: now.toISOString().split("T")[0],
    buildTime: now.toISOString(),
    gitCommit,
  };

  const outputPath = join(projectRoot, "build-info.json");
  writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));
  console.log(`Build info generated: ${JSON.stringify(buildInfo)}`);
  console.log(`Written to: ${outputPath}`);
}

generateBuildInfo();
