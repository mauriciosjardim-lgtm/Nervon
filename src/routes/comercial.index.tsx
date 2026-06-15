import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JornadaBoard } from "@/components/comercial/jornada-board";
import { FiltrosBar, aplicarFiltro, filtroInicial } from "@/components/comercial/filtros-bar";
import { NovoLeadModal } from "@/components/comercial/novo-lead-modal";
import { consumeCreate } from "@/lib/pendingCreate";

export const Route = createFileRoute("/comercial/")({
  component: JornadaPage,
});

function JornadaPage() {
  const [filtro, setFiltro] = useState(filtroInicial);
  const [novoAberto, setNovoAberto] = useState(false);

  useEffect(() => {
    if (consumeCreate("lead")) { setNovoAberto(true); return; }
    const h = (e: Event) => { if ((e as CustomEvent).detail === "lead") setNovoAberto(true); };
    window.addEventListener("nervon:criar", h);
    return () => window.removeEventListener("nervon:criar", h);
  }, []);
  const filtroFn = useMemo(
    () => (l: import("@/lib/hooks/useComercial").Lead) => aplicarFiltro([l], filtro).length > 0,
    [filtro],
  );
  return (
    <div className="space-y-4 px-4 py-5 md:px-8 md:py-7">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="lg"
          onClick={() => setNovoAberto(true)}
          className="h-11 gap-2 px-5 shadow-[0_10px_30px_-12px_var(--primary)] hover:shadow-[0_14px_36px_-12px_var(--primary)]"
        >
          <Plus className="size-5 text-primary-foreground" />
          Novo lead
        </Button>
        <p className="text-xs text-muted-foreground">
          Atalho para registrar oportunidades enquanto a conversa ainda está fresca.
        </p>
      </div>

      <FiltrosBar value={filtro} onChange={setFiltro} />
      <JornadaBoard filtroFn={filtroFn} />

      <NovoLeadModal open={novoAberto} onOpenChange={setNovoAberto} />
    </div>
  );
}
