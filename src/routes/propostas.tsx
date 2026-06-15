import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/propostas")({ component: () => <ComingSoon title="Propostas" subtitle="Modelos com Brand Kit, geração assistida por IA e envio." /> });
