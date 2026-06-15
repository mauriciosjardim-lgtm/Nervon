import { createFileRoute } from "@tanstack/react-router";
import { useComercial, getContatosDaEmpresa, fmtBRL } from "@/lib/hooks/useComercial";
import { Building2, MapPin, Users } from "lucide-react";

export const Route = createFileRoute("/comercial/empresas")({
  component: EmpresasPage,
});

function EmpresasPage() {
  const empresas = useComercial(s => s.empresas);
  const leads = useComercial(s => s.leads);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {empresas.map(e => {
        const contatos = getContatosDaEmpresa(e.id);
        const leadsEmp = leads.filter(l => l.empresaId === e.id);
        const valor = leadsEmp.reduce((s, l) => s + l.valor, 0);
        return (
          <div key={e.id} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15">
                <Building2 className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.nome}</p>
                <p className="text-[11px] text-muted-foreground">{e.segmento}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5"><MapPin className="size-3 text-primary" /> {e.cidade}</p>
              <p className="flex items-center gap-1.5"><Users className="size-3 text-primary" /> {contatos.length} contato(s)</p>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-[11px] text-muted-foreground">{leadsEmp.length} lead(s)</span>
              <span className="font-display text-sm font-semibold tabular-nums">{fmtBRL(valor)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
