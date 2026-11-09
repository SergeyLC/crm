#!/usr/bin/env node
/**
 * Fail fast on broken YAML used by CI/CD and Docker.
 * - Rejects unresolved merge conflict markers
 * - Parses workflow, action, and compose YAML with the `yaml` package
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parseDocument } from "yaml";

const ROOT = process.cwd();
const CONFLICT_RE = /^(<<<<<<<|=======|>>>>>>>)/m;

const INCLUDE_DIRS = [".github", "."];
const INCLUDE_FILES = new Set([
  "docker-compose.yml",
  "docker-compose.dev.yml",
  "docker-compose.stage.yml",
  "docker-compose.stage-main.yml",
  "docker-compose.stage-develop.yml",
  "docker-compose.production.yml",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "dist" || name === ".next") {
      continue;
    }
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!/\.(ya?ml)$/i.test(name)) continue;
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    const base = name;
    const underGithub = rel.startsWith(".github/");
    const underDeployPkg = rel.startsWith("deployment-package/");
    if (underGithub || underDeployPkg || INCLUDE_FILES.has(base) || INCLUDE_FILES.has(rel)) {
      out.push(full);
    }
  }
  return out;
}

function checkFile(file) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const text = readFileSync(file, "utf8");
  const errors = [];

  if (CONFLICT_RE.test(text)) {
    errors.push(`${rel}: unresolved merge conflict markers`);
  }

  // Lockfiles are huge YAML; conflict markers are enough there.
  if (rel.endsWith("pnpm-lock.yaml")) {
    return errors;
  }

  const doc = parseDocument(text, { prettyErrors: true });
  if (doc.errors?.length) {
    for (const err of doc.errors) {
      const line = err.linePos?.[0]?.line ?? "?";
      errors.push(`${rel}:${line}: ${err.message}`);
    }
  }
  return errors;
}

const files = [];
for (const dir of INCLUDE_DIRS) {
  walk(join(ROOT, dir), files);
}
const unique = [...new Set(files)].sort();

if (unique.length === 0) {
  console.error("No YAML files found to check");
  process.exit(1);
}

let failed = 0;
for (const file of unique) {
  const errors = checkFile(file);
  if (errors.length) {
    failed += 1;
    for (const e of errors) console.error(`❌ ${e}`);
  } else {
    console.log(`✅ ${relative(ROOT, file).replace(/\\/g, "/")}`);
  }
}

if (failed) {
  console.error(`\nYAML check failed (${failed} file(s)).`);
  process.exit(1);
}

console.log(`\nYAML check passed (${unique.length} file(s)).`);
