import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ComercialTabs } from "@/components/comercial/comercial-tabs";
import { BriefcaseBusiness } from "lucide-react";

export const Route = createFileRoute("/comercial")({
  ssr: false,
  component: ComercialLayout,
});

function ComercialLayout() {
  return (
    <div className="flex flex-col gap-5 p-5 md:p-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <BriefcaseBusiness className="size-3.5 text-primary" /> Comercial
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">Jornada Comercial</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Do primeiro contato ao fechamento — sem sair dessa tela.
          </p>
        </div>
      </header>
      <ComercialTabs />
      <Outlet />
    </div>
  );
}
