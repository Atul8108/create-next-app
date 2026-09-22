#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, cpSync, statSync, renameSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, "..", "template");
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css"]);

function toKebabCase(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(kebab) {
  return kebab.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function walk(dir, onFile) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

async function promptProjectName() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question("Project name: ");
  rl.close();
  return answer;
}

async function main() {
  const rawName = process.argv[2] ?? (await promptProjectName());
  const useCwd = rawName.trim() === ".";
  const name = useCwd ? toKebabCase(basename(process.cwd())) : toKebabCase(rawName);
  if (!name) {
    console.error("Invalid project name.");
    process.exit(1);
  }

  const target = useCwd ? process.cwd() : resolve(process.cwd(), name);
  if (existsSync(target) && readdirSync(target).length > 0) {
    console.error(`"${name}" already exists and is not empty.`);
    process.exit(1);
  }

  mkdirSync(target, { recursive: true });
  cpSync(TEMPLATE_DIR, target, { recursive: true });

  const title = toTitleCase(name);
  walk(target, (file) => {
    const ext = file.slice(file.lastIndexOf("."));
    if (!TEXT_EXTENSIONS.has(ext)) return;
    const content = readFileSync(file, "utf8");
    if (!content.includes("__PROJECT_TITLE__")) return;
    writeFileSync(file, content.replaceAll("__PROJECT_TITLE__", title));
  });

  const pkgPath = join(target, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.name = name;
  pkg.version = "0.1.0";
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // template/ ships these without a leading dot because npm's default
  // packing rules silently drop .gitignore and .env* files — restore the
  // real names now that we're writing onto the user's disk, not publishing.
  const shippedGitignore = join(target, "gitignore");
  if (existsSync(shippedGitignore)) {
    renameSync(shippedGitignore, join(target, ".gitignore"));
  }

  const shippedEnvExample = join(target, "env.example");
  if (existsSync(shippedEnvExample)) {
    renameSync(shippedEnvExample, join(target, ".env.example"));
    cpSync(join(target, ".env.example"), join(target, ".env.local"));
  }

  console.log(`\nCreated ${name} at ${target}\n`);
  console.log("Next steps:");
  console.log(`  cd ${name}`);
  console.log("  npm install");
  console.log("  # fill in .env.local with your real API base URL");
  console.log("  npm run dev");
}

main();
