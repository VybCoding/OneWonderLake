#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

function getGitCommitCount() {
  try {
    return parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10);
  } catch {
    return 0;
  }
}

const now = new Date();
const buildDate = now.toISOString().split('T')[0];
const buildTime = now.toISOString();
const gitCommit = getGitCommitHash();
const commitCount = getGitCommitCount();

const version = `1.1.${commitCount}`;

const content = `export const BUILD_INFO = {
  version: "${version}",
  buildDate: "${buildDate}",
  buildTime: "${buildTime}",
  gitCommit: "${gitCommit}",
};
`;

const versionFilePath = path.join(__dirname, '..', 'client', 'src', 'version.ts');
fs.writeFileSync(versionFilePath, content);

console.log(`Updated version.ts: v${version} (${gitCommit}) - ${buildDate}`);
