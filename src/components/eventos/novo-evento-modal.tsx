import { useEffect, useState } from "react";
import { Add, Trash } from "iconsax-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useComercialSupa } from "@/lib/hooks/useComercial";
import { eventosProducaoActions } from "@/lib/eventos/storage";

type DiaForm = { id: string; data: string; inicio: string; fim: string; local: string };
const novoDia = (): DiaForm => ({ id: crypto.randomUUID(), data: "", inicio: "08:00", fim: "18:00", local: "" });

export function NovoEventoModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { empresas } = useComercialSupa();
  const [nome, setNome] = useState(""); const [cliente, setCliente] = useState("");
  const [clienteId, setClienteId] = useState(""); const [tipo, setTipo] = useState("Corporativo");
  const [local, setLocal] = useState(""); const [descricao, setDescricao] = useState("");
  const [dias, setDias] = useState<DiaForm[]>([novoDia()]); const [cor, setCor] = useState("#90F826");
  useEffect(() => { if (open) { setNome(""); setCliente(""); setClienteId(""); setLocal(""); setDescricao(""); setDias([novoDia()]); } }, [open]);
  const updateDia = (id: string, patch: Partial<DiaForm>) => setDias(ds => ds.map(d => d.id === id ? { ...d, ...patch } : d));
  const salvar = () => {
    if (!nome.trim() || !cliente.trim() || !dias.some(d => d.data)) return;
    const evento = eventosProducaoActions.criar({ nome: nome.trim(), cliente: cliente.trim(), clienteId: clienteId || undefined, tipo, local: local.trim(), descricao: descricao.trim() || undefined, cor, status: "planejamento", dias: dias.filter(d => d.data), equipe: 0, tarefasConcluidas: 0, tarefasTotal: 0, receitaPrevista: 0, custosPrevistos: 0 });
    onCreated(evento.id); onClose();
  };
  return <Dialog open={open} onOpenChange={v => !v && onClose()}><DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
    <DialogHeader><DialogTitle className="font-display text-xl">Novo evento</DialogTitle></DialogHeader>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2"><Label>Nome do evento</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Convenção anual 2026" /></div>
      <div className="space-y-1.5"><Label>Cliente</Label><Input list="clientes-evento" value={cliente} onChange={e => { setCliente(e.target.value); setClienteId(empresas.find(x => x.nome === e.target.value)?.id ?? ""); }} placeholder="Cadastre livremente ou escolha do CRM" /><datalist id="clientes-evento">{empresas.map(e => <option key={e.id} value={e.nome} />)}</datalist></div>
      <div className="space-y-1.5"><Label>Tipo</Label><Select value={tipo} onValueChange={setTipo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Corporativo">Corporativo</SelectItem><SelectItem value="Social">Social</SelectItem><SelectItem value="Show">Show / festival</SelectItem><SelectItem value="Esportivo">Esportivo</SelectItem><SelectItem value="Outro">Outro</SelectItem></SelectContent></Select></div>
      <div className="space-y-1.5 sm:col-span-2"><Label>Local principal</Label><Input value={local} onChange={e => setLocal(e.target.value)} placeholder="Local, cidade ou endereço" /></div>
      <div className="space-y-2 sm:col-span-2"><div className="flex items-center justify-between"><div><Label>Dias da operação</Label><p className="text-xs text-muted-foreground">Cada dia terá sua própria programação, equipe e checklist.</p></div><Button variant="outline" size="sm" onClick={() => setDias(d => [...d, novoDia()])}><Add size={15} color="currentColor" /> Adicionar dia</Button></div>
        <div className="space-y-2">{dias.map((dia, i) => <div key={dia.id} className="grid gap-2 rounded-xl border border-border/70 bg-surface-1/35 p-3 sm:grid-cols-[auto_1.25fr_.8fr_.8fr_1.2fr_auto] sm:items-end"><span className="pb-2 text-xs font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span><div className="space-y-1"><Label className="text-[10px]">Data</Label><Input type="date" value={dia.data} onChange={e => updateDia(dia.id, { data: e.target.value })} /></div><div className="space-y-1"><Label className="text-[10px]">Início</Label><Input type="time" value={dia.inicio} onChange={e => updateDia(dia.id, { inicio: e.target.value })} /></div><div className="space-y-1"><Label className="text-[10px]">Fim</Label><Input type="time" value={dia.fim} onChange={e => updateDia(dia.id, { fim: e.target.value })} /></div><div className="space-y-1"><Label className="text-[10px]">Local deste dia</Label><Input value={dia.local} onChange={e => updateDia(dia.id, { local: e.target.value })} placeholder="Opcional" /></div><Button size="icon" variant="ghost" disabled={dias.length === 1} onClick={() => setDias(ds => ds.filter(d => d.id !== dia.id))}><Trash size={16} color="currentColor" /></Button></div>)}</div>
      </div>
      <div className="space-y-1.5 sm:col-span-2"><Label>Descrição</Label><Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} placeholder="Escopo geral, observações e contexto da operação…" /></div>
      <div className="space-y-1.5 sm:col-span-2"><Label>Identidade do evento</Label><div className="flex items-center gap-3 rounded-xl border border-border/70 p-3"><input type="color" value={cor} onChange={e => setCor(e.target.value)} className="size-9 cursor-pointer rounded-lg border-0 bg-transparent" /><span className="text-xs text-muted-foreground">A cor identifica esta operação em todo o módulo.</span></div></div>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={salvar}>Criar central do evento</Button></DialogFooter>
  </DialogContent></Dialog>;
}
