export function isValidAsaasWebhookToken(
  expectedToken: string | undefined,
  providedToken: string | null,
): boolean {
  return Boolean(expectedToken) && providedToken === expectedToken;
}
