import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { FinanceiroTabs } from "@/components/financeiro/financeiro-tabs";

export const Route = createFileRoute("/financeiro")({
  ssr: false,
  component: FinanceiroLayout,
});

function FinanceiroLayout() {
  return (
    <div className="flex flex-col gap-5 p-5 md:p-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Wallet className="size-3.5 text-primary" /> Financeiro
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">Controle Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Faturamento, custos, margem e contas — tudo numa só tela.
          </p>
        </div>
      </header>
      <FinanceiroTabs />
      <Outlet />
    </div>
  );
}
