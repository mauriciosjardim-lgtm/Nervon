import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/contratos")({ component: () => <ComingSoon title="Contratos" subtitle="Nascem da proposta. Escopo, prazos, multas e assinatura." /> });
