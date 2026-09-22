import { cpSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync, renameSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Override with TEMPLATE_SOURCE_DIR if the sibling app folder isn't named
// "divika-webapp-new" on this machine (e.g. cloned under a different name).
const SOURCE = process.env.TEMPLATE_SOURCE_DIR
  ? resolve(process.env.TEMPLATE_SOURCE_DIR)
  : join(__dirname, "..", "..", "divika-webapp-new");
const DEST = join(__dirname, "..", "template");

if (!existsSync(SOURCE)) {
  console.error(`Source project not found at ${SOURCE}`);
  console.error(`Set TEMPLATE_SOURCE_DIR if it's cloned under a different name/location.`);
  process.exit(1);
}

const EXCLUDE = new Set([
  "node_modules",
  ".next",
  ".git",
  ".claude",
  ".idea",
  ".vscode",
  ".env.local",
  "tsconfig.tsbuildinfo",
  "next-env.d.ts",
  "package-lock.json",
]);

const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css"]);

rmSync(DEST, { recursive: true, force: true });
cpSync(SOURCE, DEST, {
  recursive: true,
  filter: (src) => !EXCLUDE.has(src.split(/[\\/]/).pop()),
});

// npm silently drops .gitignore and any .env* file from published tarballs
// (its default ignore rules), even when listed in "files" — ship them under
// non-dot names instead; bin/create.js restores the real names at scaffold time.
if (existsSync(join(DEST, ".gitignore"))) {
  const gitignorePath = join(DEST, ".gitignore");
  // .claude/ is this source project's own private doc-storage convention,
  // not something every template user runs — strip it from what ships.
  const cleaned = readFileSync(gitignorePath, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== ".claude/")
    .join("\n");
  writeFileSync(gitignorePath, cleaned);
  renameSync(gitignorePath, join(DEST, "gitignore"));
}

function walk(dir, onFile) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, onFile);
    } else {
      onFile(full);
    }
  }
}

const SOURCE_TITLE = "Next Template";

let replacedCount = 0;
walk(DEST, (file) => {
  const ext = file.slice(file.lastIndexOf("."));
  if (!TEXT_EXTENSIONS.has(ext)) return;
  const content = readFileSync(file, "utf8");
  if (!content.includes(SOURCE_TITLE)) return;
  writeFileSync(file, content.replaceAll(SOURCE_TITLE, "__PROJECT_TITLE__"));
  replacedCount += 1;
});

writeFileSync(
  join(DEST, "env.example"),
  readFileSync(join(SOURCE, ".env.local"), "utf8"),
);

console.log(`Synced template from ${SOURCE}`);
console.log(`Replaced "${SOURCE_TITLE}" -> __PROJECT_TITLE__ in ${replacedCount} file(s).`);
console.log(`Wrote env.example from source .env.local.`);
