#!/usr/bin/env node
/**
 * Run db seed:runtime on a remote CRM environment via SSH + docker exec.
 *
 * Usage:
 *   node scripts/seed-remote.js --env stage-develop
 *   node scripts/seed-remote.js --env stage-main
 *   node scripts/seed-remote.js --env production --confirm CONFIRM
 *
 * SSH (optional env overrides):
 *   CRM_SSH_HOST (default 217.154.173.36)
 *   CRM_SSH_USER (default root)
 *   CRM_SSH_KEY  (default ~/.ssh/id_ed25519)
 */

const { spawnSync } = require("child_process");
const os = require("os");
const path = require("path");

const CONTAINERS = {
  production: "crm-production-backend",
  "stage-main": "crm-stage-main-backend",
  "stage-develop": "crm-stage-develop-backend",
};

function usage(exitCode = 1) {
  console.log(`Usage:
  node scripts/seed-remote.js --env <production|stage-main|stage-develop> [--confirm CONFIRM]

Production requires: --confirm CONFIRM

SSH env (optional): CRM_SSH_HOST, CRM_SSH_USER, CRM_SSH_KEY`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { env: null, confirm: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--env" || a === "-e") {
      args.env = argv[++i];
    } else if (a === "--confirm") {
      args.confirm = argv[++i];
    } else if (a === "-h" || a === "--help") {
      usage(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      usage(1);
    }
  }
  return args;
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...opts,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.status}`);
  }
}

const { env, confirm } = parseArgs(process.argv.slice(2));

if (!env || !CONTAINERS[env]) {
  console.error("Missing or invalid --env");
  usage(1);
}

if (env === "production" && confirm !== "CONFIRM") {
  console.error("Production seed requires --confirm CONFIRM");
  process.exit(1);
}

const host = process.env.CRM_SSH_HOST || "217.154.173.36";
const user = process.env.CRM_SSH_USER || "root";
const key =
  process.env.CRM_SSH_KEY || path.join(os.homedir(), ".ssh", "id_ed25519");
const container = CONTAINERS[env];

const remoteCmd = `docker exec -w /app/db ${container} pnpm run seed:runtime`;

console.log(`Seeding remote environment: ${env}`);
console.log(`Host: ${user}@${host}`);
console.log(`Container: ${container}`);
console.log(`Command: ${remoteCmd}`);
console.log("");

try {
  run("ssh", [
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=20",
    "-i",
    key,
    `${user}@${host}`,
    remoteCmd,
  ]);
  console.log("\nSeed completed successfully.");
  console.log("Demo logins: admin@example.com / 1  ·  v1@example.com / 1");
} catch (error) {
  console.error("\nSeed failed:", error.message);
  console.error(
    "Note: seed:runtime needs a backend image that includes compiled db/temp/seed.js.",
  );
  process.exit(1);
}
