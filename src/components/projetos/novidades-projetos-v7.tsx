import { useEffect, useMemo, useState } from "react";
import { Colorfilter, TickCircle } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CORES_PROJETO, resolverCorProjeto, type Projeto } from "@/lib/mock/projetos";
import { projetosActions } from "@/lib/hooks/useProjetos";

const STORAGE_KEY = "makershub:projetos:novidades:v7";
const SESSION_KEY = "makershub:projetos:novidades:v7:fechado-na-sessao";

export function NovidadesProjetosV7({ projetos }: { projetos: Projeto[] }) {
  const antigos = useMemo(() => projetos.filter(p => !p.arquivado && !["concluido", "pausado"].includes(p.fase) && !p.cor?.startsWith("#")), [projetos]);
  const [open, setOpen] = useState(false);
  const [cores, setCores] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_KEY)) return;
    setCores(Object.fromEntries(antigos.map(p => [p.id, resolverCorProjeto(p.cor, p.id)])));
    setOpen(true);
  }, [antigos]);

  const concluir = async () => {
    setSalvando(true);
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    await Promise.all(antigos.map(p => projetosActions.atualizarProjeto(p.id, { cor: cores[p.id] ?? resolverCorProjeto(p.cor, p.id) })));
    setSalvando(false);
    setOpen(false);
  };

  const fechar = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setOpen(false);
  };

  const naoMostrarNovamente = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setOpen(false);
  };

  return <Dialog open={open} onOpenChange={v => !v && fechar()}>
    <DialogContent overlayClassName="bg-background/35 backdrop-blur-md" className="max-w-2xl overflow-hidden border-border/70 p-0">
      <div className="border-b border-border/60 bg-surface-1/40 px-6 py-5">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Versão 7</span>
        <DialogHeader><DialogTitle className="font-display text-xl">Projetos ganhou um fluxo de produção de verdade</DialogTitle></DialogHeader>
        <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">Clientes, semana e etapas agora trabalham juntos. As cores ajudam a reconhecer cada produção rapidamente em toda a operação.</p>
      </div>
      <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            "Semana com cliente, etapa e responsável",
            "Progresso acompanha o avanço no fluxo",
            "Projetos com identidade por cor",
          ].map(item => <div key={item} className="flex gap-2 rounded-xl border border-border/60 bg-surface-1/30 p-3 text-[10px] leading-relaxed"><TickCircle size={14} color="currentColor" className="mt-0.5 shrink-0 text-primary" />{item}</div>)}
        </div>
        {antigos.length > 0 && <section className="mt-5">
          <div className="mb-3 flex items-center gap-2"><Colorfilter size={16} color="currentColor" className="text-primary" /><div><h3 className="text-xs font-semibold">Dê uma cor aos projetos ativos</h3><p className="text-[10px] text-muted-foreground">Já sugerimos cores diferentes. Ajuste se quiser e confirme.</p></div></div>
          <div className="space-y-2">{antigos.map(p => { const corAtual = cores[p.id] ?? resolverCorProjeto(p.cor, p.id); return <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3"><span className="h-8 w-1 rounded-full" style={{ backgroundColor: corAtual }} /><div className="min-w-[150px] flex-1"><p className="truncate text-xs font-medium">{p.nome}</p><p className="text-[9px] text-muted-foreground">{p.cliente}</p></div><div className="flex items-center gap-1.5">{CORES_PROJETO.slice(0, 8).map(c => <button key={c} type="button" onClick={() => setCores(prev => ({ ...prev, [p.id]: c }))} style={{ backgroundColor: c }} className={`size-5 rounded-full transition ${corAtual === c ? "ring-2 ring-white ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100"}`} />)}<label className="relative grid size-5 cursor-pointer place-items-center rounded-full border border-dashed border-white/40 text-[11px]"><span>+</span><input type="color" value={corAtual} onChange={e => setCores(prev => ({ ...prev, [p.id]: e.target.value.toUpperCase() }))} className="absolute inset-0 opacity-0" /></label></div></div>; })}</div>
        </section>}
      </div>
      <DialogFooter className="border-t border-border/60 bg-surface-1/25 px-6 py-4 sm:justify-between">
        <Button type="button" variant="ghost" onClick={naoMostrarNovamente} disabled={salvando} className="text-muted-foreground hover:text-foreground">Não mostrar novamente</Button>
        <Button onClick={concluir} disabled={salvando}>{salvando ? "Aplicando…" : antigos.length ? "Aplicar cores e continuar" : "Explorar versão 7"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
