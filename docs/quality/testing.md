# Quality gates

## Toolchain

The repository uses Bun, pinned by the existing `bun.lock`. Quality work must
not create a second package-manager lockfile or regenerate `bun.lock` as a side
effect. CI and clean checkouts must install with `bun install --frozen-lockfile`.

## Gates

- `bun run typecheck`: TypeScript without emit.
- `bun run test`: deterministic unit tests.
- `bun run test:integration`: integration and contract tests only.
- `bun run test:e2e`: critical browser smoke tests only.
- `bun run lint:changed`: ESLint only for JavaScript/TypeScript files changed
  relative to `LINT_BASE` (defaults to `HEAD`).
- `bun run check`: typecheck, changed-file lint, unit tests, and integration
  tests.

The global `bun run lint` command remains diagnostic while legacy debt is
ratcheted down; it is not a merge gate. Do not run a repository-wide autofix.

## Test boundaries

Unit tests must not contact Supabase, Asaas, or email providers. Integration
tests use injected fakes by default and live services only when explicitly
enabled. E2E tests run against an isolated test tenant and must never reuse
production credentials.

The canonical Asaas webhook is the early intercept in `src/server.ts`. The file
route at `src/routes/api/asaas/webhook.ts` is currently shadowed and is retained
only as documented divergence until it can be removed in a coordinated routing
change.
