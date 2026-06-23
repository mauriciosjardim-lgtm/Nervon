import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TrendUp, TrendDown } from "iconsax-react";
import { StatusBadge } from "./status-badge";
import { NovoLancamentoModal } from "./novo-lancamento-modal";
import { fmtBRL, fmtData, type Lancamento } from "@/lib/mock/financeiro";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  titulo: string;
  descricao?: string;
  lancamentos: Lancamento[];
}

export function KpiDetalheSheet({ open, onOpenChange, titulo, descricao, lancamentos }: Props) {
  const [editar, setEditar] = useState<Lancamento | undefined>();
  const [editarOpen, setEditarOpen] = useState(false);

  const total = lancamentos.reduce((s, l) => s + l.valor, 0);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle>{titulo}</SheetTitle>
            {descricao && <SheetDescription>{descricao}</SheetDescription>}
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold tabular-nums">{fmtBRL(total)}</span>
              <span className="text-xs text-muted-foreground">{lancamentos.length} lançamento{lancamentos.length !== 1 ? "s" : ""}</span>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-2">
            {lancamentos.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Nenhum lançamento aqui.</p>
            ) : (
              <ul className="divide-y divide-border">
                {lancamentos
                  .sort((a, b) => b.vencimento.localeCompare(a.vencimento))
                  .map(l => (
                  <li
                    key={l.id}
                    onClick={() => { setEditar(l); setEditarOpen(true); }}
                    className="-mx-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-surface-2/50"
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 ${
                      l.tipo === "receita" ? "bg-success/10 ring-success/30" : "bg-destructive/10 ring-destructive/30"
                    }`}>
                      {l.tipo === "receita"
                        ? <TrendUp size={14} color="currentColor" variant="Linear" className="text-success" />
                        : <TrendDown size={14} color="currentColor" variant="Linear" className="text-destructive" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.descricao}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {l.categoria}
                        {l.cliente ? ` · ${l.cliente}` : ""}
                        {l.projeto ? ` · ${l.projeto}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-display text-sm font-semibold tabular-nums">{fmtBRL(l.valor)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">{fmtData(l.vencimento)}</span>
                        <StatusBadge status={l.status} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <NovoLancamentoModal
        open={editarOpen}
        onOpenChange={setEditarOpen}
        editar={editar}
      />
    </>
  );
}
