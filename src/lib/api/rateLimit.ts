import { getRequestIP } from "@tanstack/react-start/server";

// Rate limiting em memória por IP (janela deslizante).
//
// Limitação conhecida: em Cloudflare Workers cada isolate tem sua própria
// memória e ela zera a cada deploy — isto NÃO substitui um limitador
// distribuído (KV/Durable Objects), mas bloqueia o caso real: bots e scripts
// martelando o mesmo endpoint a partir do mesmo POP. Custo zero, sem infra.
const buckets = new Map<string, number[]>();

// Evita crescimento sem limite da Map em isolates de vida longa.
const MAX_KEYS = 10_000;

/**
 * Lança erro genérico se o IP exceder `limite` chamadas na última `janelaMs`.
 * Chamar no início do handler de server functions sensíveis.
 */
export function rateLimit(bucket: string, limite: number, janelaMs: number) {
  const ip = getRequestIP({ xForwardedFor: true }) ?? "sem-ip";
  const key = `${bucket}:${ip}`;
  const agora = Date.now();

  const hits = (buckets.get(key) ?? []).filter(t => agora - t < janelaMs);
  if (hits.length >= limite) {
    throw new Error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }
  hits.push(agora);

  if (!buckets.has(key) && buckets.size >= MAX_KEYS) buckets.clear();
  buckets.set(key, hits);
}
