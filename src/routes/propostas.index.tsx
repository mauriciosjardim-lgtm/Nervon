import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Plus, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listarPropostas, removerProposta, type Proposta } from "@/lib/propostas";
import { toast } from "sonner";

export const Route = createFileRoute("/propostas/")({ component: PropostasIndex });
function PropostasIndex() {
  const [lista, setLista] = useState<Proposta[]>([]), [loading, setLoading] = useState(true);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => { listarPropostas().then(setLista).catch(e => toast.error(e.message)).finally(() => setLoading(false)); }, []);
  const nova = () => navigate({ to: "/propostas/nova" });
  const excluir = async (p: Proposta) => {
    if (!confirm(`Excluir a proposta "${p.titulo_projeto || "sem título"}"? Essa ação não pode ser desfeita.`)) return;
    setExcluindo(p.id);
    try {
      await removerProposta(p.id);
      setLista(lista.filter(x => x.id !== p.id));
      toast.success("Proposta excluída");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExcluindo(null);
    }
  };
  return <div className="mx-auto max-w-6xl px-5 py-8 md:px-8"><header className="mb-8 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Comercial</p><h1 className="mt-2 font-display text-3xl font-semibold">Propostas</h1><p className="mt-1 text-sm text-muted-foreground">Crie, publique e acompanhe propostas comerciais.</p></div><Button onClick={nova}><Plus className="mr-2 size-4"/>Nova proposta</Button></header>
  {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : lista.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-12 text-center"><FileText className="mx-auto size-8 text-muted-foreground"/><p className="mt-4 text-sm text-muted-foreground">Nenhuma proposta criada ainda.</p></div> : <div className="space-y-3">{lista.map(p => <div key={p.id} className="group relative flex items-center gap-4 rounded-xl border border-border/60 bg-surface-1/40 p-4 transition hover:border-primary/40"><Link to="/propostas/$id" params={{id:p.id}} className="flex min-w-0 flex-1 items-center gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="size-5"/></span><div className="min-w-0 flex-1"><p className="truncate font-medium">{p.titulo_projeto || "Proposta sem título"}</p><p className="truncate text-xs text-muted-foreground">{p.cliente_nome || "Cliente não informado"} · PROP-{p.ano}-{String(p.numero).padStart(3,"0")}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${p.status === "rascunho" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{p.status === "rascunho" ? "Rascunho" : "Publicada"}</span>{p.status !== "rascunho" && <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex"><Eye className="size-3.5"/>{p.visualizacoes}</span>}</Link><button onClick={() => excluir(p)} disabled={excluindo === p.id} title="Excluir proposta" className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground/50 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"><X className="size-4"/></button></div>)}</div>}</div>;
}
