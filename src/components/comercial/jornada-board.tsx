import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { useComercial, comercial, ETAPAS, fmtBRL, type EtapaJornada, type Lead } from "@/lib/hooks/useComercial";
import { LeadCard } from "./lead-card";
import { LeadDrawer } from "./lead-drawer";
import { EtapaIcon } from "./etapa-icon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function JornadaBoard({ filtroFn }: { filtroFn?: (l: Lead) => boolean }) {
  const leads = useComercial(s => s.leads);
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const filtrados = useMemo(() => filtroFn ? leads.filter(filtroFn) : leads, [leads, filtroFn]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragStart(e: DragStartEvent) {
    const lead = leads.find(l => l.id === e.active.id);
    setActiveLead(lead ?? null);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveLead(null);
    const leadId = e.active.id as string;
    const destino = e.over?.id as EtapaJornada | undefined;
    if (!destino) return;
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.etapa === destino) return;
    comercial.moverEtapa(leadId, destino);
    toast.success(`Movido para ${ETAPAS.find(x => x.id === destino)?.label}.`);
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ETAPAS.map(etapa => {
            const dela = filtrados.filter(l => l.etapa === etapa.id);
            const total = dela.reduce((s, l) => s + l.valor, 0);
            return (
              <Coluna key={etapa.id} etapa={etapa.id} label={etapa.label} cor={etapa.cor} qtd={dela.length} total={total}>
                {dela.map(l => (
                <LeadCard
                  key={l.id} lead={l} onOpen={setOpenLead}
                  onRemove={id => { if (confirm("Remover este lead?")) comercial.removerLead(id); }}
                />
              ))}
                {dela.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-[11px] text-muted-foreground">
                    Solte um lead aqui
                  </div>
                )}
              </Coluna>
            );
          })}
        </div>
        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeLead && (
            <div className="rotate-2 opacity-95 shadow-2xl">
              <LeadCard lead={activeLead} onOpen={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <LeadDrawer leadId={openLead} onClose={() => setOpenLead(null)} />
    </>
  );
}

function Coluna({
  etapa, label, cor, qtd, total, children,
}: {
  etapa: EtapaJornada; label: string; cor: string;
  qtd: number; total: number; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[300px] shrink-0 flex-col rounded-2xl border border-border bg-surface-1/40 transition",
        isOver && "border-primary/60 bg-surface-2/60 ring-2 ring-primary/30",
      )}
    >
      {/* Cabeçalho rico */}
      <div className="relative overflow-hidden rounded-t-2xl border-b border-border/60 bg-gradient-to-b from-surface-2/60 to-transparent px-4 py-3.5">
        <span
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: cor, boxShadow: `0 0 12px ${cor}` }}
          aria-hidden
        />
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
            <EtapaIcon etapa={etapa} className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">{label}</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                {qtd} {qtd === 1 ? "oportunidade" : "oportunidades"}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-2 font-display text-base font-semibold tabular-nums tracking-tight text-foreground">
          {fmtBRL(total)}
        </p>
      </div>
      <div className="flex flex-col gap-2.5 p-2.5 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}

