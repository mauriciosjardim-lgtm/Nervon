import { spawnSync } from "node:child_process";

const base = process.env.LINT_BASE ?? "HEAD^";
const patterns = ["*.js", "*.mjs", "*.ts", "*.tsx"];
const committed = spawnSync(
  "git",
  ["diff", "--name-only", "--diff-filter=ACMR", `${base}...HEAD`, "--", ...patterns],
  { encoding: "utf8" },
);
const staged = spawnSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "--", ...patterns],
  { encoding: "utf8" },
);
const untracked = spawnSync(
  "git",
  ["ls-files", "--others", "--exclude-standard", "--", ...patterns],
  { encoding: "utf8" },
);

for (const result of [committed, staged, untracked]) {
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}

const requested = process.argv.slice(2);
const files =
  requested.length > 0
    ? requested
    : [
        ...new Set(
          `${committed.stdout}\n${staged.stdout}\n${untracked.stdout}`
            .split("\n")
            .map((file) => file.trim())
            .filter(Boolean),
        ),
      ];

if (files.length === 0) {
  console.log("No changed JavaScript or TypeScript files to lint.");
  process.exit(0);
}

const eslint = spawnSync("eslint", ["--max-warnings=0", ...files], {
  encoding: "utf8",
  stdio: "inherit",
});
process.exit(eslint.status ?? 1);
