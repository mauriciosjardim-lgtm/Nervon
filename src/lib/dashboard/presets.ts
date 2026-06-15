import type { DashboardLayout, WidgetInstance } from "./types";

export type Role = "dono" | "comercial" | "financeiro" | "operacional" | "editor" | "motion" | "outro";

const w = (type: string, size: WidgetInstance["size"] = "md"): WidgetInstance => ({
  id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  size,
});

export const roleLayouts: Record<Role, DashboardLayout> = {
  dono: {
    id: "ceo",
    name: "Dashboard CEO",
    widgets: [
      w("receita-mes", "sm"), w("lucro-mes", "sm"), w("pipeline", "sm"), w("projetos-ativos", "sm"),
      w("faturamento-grafico", "lg"),
      w("meu-dia", "md"), w("propostas-aguardando", "md"),
    ],
  },
  comercial: {
    id: "comercial",
    name: "Dashboard Comercial",
    widgets: [
      w("pipeline", "sm"), w("propostas-aguardando", "sm"), w("clientes-ativos", "sm"), w("followups", "sm"),
      w("leads-quentes", "lg"),
      w("agenda", "md"), w("ultimas-atividades", "md"),
    ],
  },
  financeiro: {
    id: "financeiro",
    name: "Dashboard Financeiro",
    widgets: [
      w("receita-mes", "sm"), w("lucro-mes", "sm"), w("contas-receber", "sm"), w("contas-pagar", "sm"),
      w("faturamento-grafico", "lg"),
      w("indicadores-financeiros", "md"), w("receita-recorrente", "md"),
    ],
  },
  operacional: {
    id: "operacional",
    name: "Dashboard Operacional",
    widgets: [
      w("projetos-ativos", "sm"), w("projetos-criticos", "sm"), w("tarefas-pendentes", "sm"), w("proximas-gravacoes", "sm"),
      w("agenda", "md"), w("meu-dia", "md"),
    ],
  },
  editor: {
    id: "pessoal",
    name: "Dashboard Pessoal",
    widgets: [
      w("meu-dia", "md"), w("tarefas-pendentes", "md"),
      w("agenda", "md"), w("projetos-ativos", "md"),
    ],
  },
  motion: {
    id: "pessoal",
    name: "Dashboard Pessoal",
    widgets: [
      w("meu-dia", "md"), w("tarefas-pendentes", "md"),
      w("agenda", "md"), w("projetos-ativos", "md"),
    ],
  },
  outro: {
    id: "geral",
    name: "Meu Dashboard",
    widgets: [
      w("receita-mes", "sm"), w("projetos-ativos", "sm"), w("pipeline", "sm"), w("tarefas-pendentes", "sm"),
      w("meu-dia", "md"), w("agenda", "md"),
    ],
  },
};

// Layout padrão rico — entregue no primeiro acesso, sem onboarding.
export const defaultLayout: DashboardLayout = {
  id: "cockpit",
  name: "Cockpit",
  widgets: [
    w("receita-mes", "sm"), w("lucro-mes", "sm"), w("pipeline", "sm"), w("projetos-ativos", "sm"),
    w("faturamento-grafico", "lg"),
    w("meu-dia", "md"), w("tarefas-pendentes", "md"),
    w("agenda", "md"), w("propostas-aguardando", "md"),
    w("leads-quentes", "lg"),
    w("followups", "md"), w("assistant", "md"),
  ],
};

export const presetLayouts: DashboardLayout[] = [
  defaultLayout,
  roleLayouts.comercial,
  roleLayouts.financeiro,
  roleLayouts.operacional,
  roleLayouts.editor,
];

export const layoutForRole = (role: Role): DashboardLayout => ({
  ...roleLayouts[role],
  widgets: roleLayouts[role].widgets.map(x => ({ ...x, id: `${x.type}-${Math.random().toString(36).slice(2, 8)}` })),
});

