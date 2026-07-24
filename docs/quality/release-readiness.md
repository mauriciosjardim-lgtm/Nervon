# Release readiness

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
