import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useCustos, custosActions, CUSTOS_LABELS, type TabelaCustos } from "@/lib/mock/custos";

const GRUPOS = ["Equipe", "Equipamento", "Logística", "Extras criativos", "Margem"] as const;

const CHAVES = Object.keys(CUSTOS_LABELS) as (keyof TabelaCustos)[];

export function PrecosModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const custos = useCustos();
  const [draft, setDraft] = useState<TabelaCustos>(custos);

  // Re-sincroniza ao abrir
  useEffect(() => { if (open) setDraft(custos); }, [open]);

  const set = (k: keyof TabelaCustos, v: number) => setDraft(d => ({ ...d, [k]: v }));

  const salvar = () => {
    custosActions.set(draft);
    toast.success("Tabela de preços atualizada.");
    onOpenChange(false);
  };

  const restaurar = () => {
    custosActions.reset();
    toast("Preços restaurados para o padrão.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border/60 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
              <SlidersHorizontal className="size-4" />
            </span>
            <div>
              <DialogTitle className="font-display">Configuração de preços</DialogTitle>
              <DialogDescription>Defina quanto você cobra por cada item. A calculadora usa esses valores.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-6 overflow-y-auto p-5">
          {GRUPOS.map(grupo => {
            const chaves = CHAVES.filter(k => CUSTOS_LABELS[k].grupo === grupo);
            if (chaves.length === 0) return null;
            return (
              <section key={grupo}>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{grupo}</h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {chaves.map(k => {
                    const meta = CUSTOS_LABELS[k];
                    const isPercent = k === "margemPadrao";
                    return (
                      <div key={k} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-1/40 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{meta.label}</p>
                          <p className="text-[10px] text-muted-foreground">por {meta.sufixo}</p>
                        </div>
                        <div className="w-28 shrink-0">
                          {isPercent ? (
                            <div className="relative">
                              <Input
                                type="number" min={0} max={100} inputMode="numeric"
                                value={draft[k]}
                                onChange={e => set(k, Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                                className="pr-7 text-right"
                              />
                              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                            </div>
                          ) : (
                            <CurrencyInput value={draft[k]} onValueChange={v => set(k, v)} className="text-right" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <DialogFooter className="border-t border-border/60 p-4 sm:justify-between">
          <Button variant="ghost" onClick={restaurar} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <RotateCcw className="size-3.5" /> Restaurar padrão
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar preços</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
