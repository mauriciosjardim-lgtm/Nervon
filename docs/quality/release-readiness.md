# Release readiness

## Release source of truth

- Develop one concern per `codex/*` branch and one worktree.
- Merge only through a pull request with the Quality workflow green.
- Deploy only the exact commit published as `origin/main`.
- Keep `package.json` as the version source and tag that commit as `v<version>`.
- Never deploy from a dirty worktree, a feature branch, or an untagged commit.

The official `bun run deploy` command enforces those repository checks before
running schema validation, the complete quality gate, the production build, and
Wrangler. Do not call `wrangler deploy` directly.

## Release sequence

1. Merge the approved pull request into `main`.
2. Update the version in `package.json` and `bun.lock` in a dedicated release
   commit.
3. Run `bun install --frozen-lockfile`, `bun run check`, and `bun run build`.
4. Push `main` and wait for the Quality workflow to pass.
5. Create and push the annotated tag matching the package version.
6. Pull the exact published `main` into a clean worktree.
7. Run `bun run deploy`.
8. Record the tag and Git SHA with the deployment evidence.

## Required gates

- Install exactly `bun.lock` with `bun install --frozen-lockfile`.
- Run `bun run typecheck`.
- Run changed-file lint with the pull-request base in `LINT_BASE`.
- Run `bun run test` and `bun run test:integration`.
- Run `bun run build`.
- Apply new Supabase migrations in timestamp order before deploying the Worker.

## Required configuration

- `ASAAS_WEBHOOK_TOKEN` is set and matches the Asaas webhook configuration.
- `ASAAS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESEND_API_KEY` exist only
  in the deployment secret store.
- `SITE_URL` points to the production HTTPS origin.
- The Asaas webhook points only to `/api/asaas/webhook`.

## Post-deploy smoke

1. Invalid webhook token returns 401.
2. A sandbox paid event provisions one account.
3. Replaying the same event does not create another account.
4. Two concurrent deliveries produce one provision.
5. A receipt uploaded by company A is inaccessible to company B and anonymous
   users, while company A can open it through a short-lived signed URL.
6. Checkout Pix persists no password, and upgrade rejects another user's
   `externalReference` or customer email.

Do not publish when migrations are pending, any required gate fails, or the
post-deploy smoke cannot be executed in a non-production tenant first.
