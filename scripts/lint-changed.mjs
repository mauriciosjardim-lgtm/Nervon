import { spawnSync } from "node:child_process";

const base = process.env.LINT_BASE ?? "HEAD";
const diff = spawnSync(
  "git",
  ["diff", "--name-only", "--diff-filter=ACMR", base, "--", "*.js", "*.mjs", "*.ts", "*.tsx"],
  { encoding: "utf8" },
);
const untracked = spawnSync(
  "git",
  ["ls-files", "--others", "--exclude-standard", "--", "*.js", "*.mjs", "*.ts", "*.tsx"],
  { encoding: "utf8" },
);

if (diff.status !== 0 || untracked.status !== 0) {
  process.stderr.write(diff.stderr);
  process.stderr.write(untracked.stderr);
  process.exit(diff.status || untracked.status || 1);
}

const files = [...new Set(`${diff.stdout}\n${untracked.stdout}`
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean))];

if (files.length === 0) {
  console.log("No changed JavaScript or TypeScript files to lint.");
  process.exit(0);
}

const eslint = spawnSync("eslint", ["--max-warnings=0", ...files], {
  encoding: "utf8",
  stdio: "inherit",
});
process.exit(eslint.status ?? 1);
