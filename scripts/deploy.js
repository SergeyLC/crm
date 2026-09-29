#!/usr/bin/env node
/**
 * Bump db version, commit, push, and create a production release tag (v*).
 * Cross-platform: run with `node scripts/deploy.js` or `pwsh scripts/deploy.ps1`.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    cwd: path.join(__dirname, ".."),
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.status}`);
  }
}

const packageJsonPath = path.join(__dirname, "..", "db", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

const currentVersion = packageJson.version;
console.log(`Current version: ${currentVersion}`);

const versionParts = currentVersion.split(".");
const major = versionParts[0];
const minor = versionParts[1];
const patch = parseInt(versionParts[2], 10) + 1;
const newVersion = `${major}.${minor}.${patch}`;

console.log(`New version: ${newVersion}`);

packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
console.log("Updated db/package.json");

const commitMessage = `Provide Release Tag ${newVersion}`;
const tagName = `v${newVersion}`;

try {
  console.log("\nStaging changes...");
  run("git", ["add", "-A"]);

  console.log(`Committing: "${commitMessage}"...`);
  run("git", ["commit", "-m", commitMessage]);

  console.log("Pushing to remote...");
  run("git", ["push"]);

  console.log(`Creating tag: ${tagName}...`);
  run("git", ["tag", "-a", tagName, "-m", commitMessage]);

  console.log(`Pushing tag: ${tagName}...`);
  run("git", ["push", "origin", tagName]);

  console.log("\nDeployment successful!");
  console.log(`Version: ${newVersion}`);
  console.log(`Tag: ${tagName}`);
  console.log("\nGitHub Actions will now deploy to production...");
} catch (error) {
  console.error("\nDeployment failed:", error.message);
  process.exit(1);
}
