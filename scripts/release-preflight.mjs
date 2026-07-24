import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) {
  console.error(`Release bloqueado: ${message}`);
  process.exit(1);
}

function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const detail = error?.stderr?.toString().trim();
    fail(detail || `git ${args.join(" ")} falhou`);
  }
}

function gitOptional(args) {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

const status = git(["status", "--porcelain=v1", "--untracked-files=all"]);
if (status) {
  fail("o worktree possui alterações. Faça commit ou guarde o trabalho antes do deploy.");
}

const branch = git(["branch", "--show-current"]);
if (branch !== "main") {
  fail(`a branch atual é "${branch || "detached HEAD"}"; deploys só podem sair da main.`);
}

const head = git(["rev-parse", "HEAD"]);
const publishedMain = git(["rev-parse", "refs/remotes/origin/main"]);
if (head !== publishedMain) {
  fail("a main local não corresponde a origin/main. Sincronize e publique o commit primeiro.");
}

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));
const expectedTag = `v${packageJson.version}`;
const actualTag = gitOptional(["describe", "--tags", "--exact-match", "HEAD"]);
if (actualTag !== expectedTag) {
  fail(`o commit precisa da tag "${expectedTag}" antes do deploy.`);
}

console.log(`Release validado: ${expectedTag} (${head.slice(0, 12)}).`);
