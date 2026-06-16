import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sparkles, Flame, Snowflake, Thermometer, Plus } from "lucide-react";
import { toast } from "sonner";
import { comercial, getOrigensUnicas, getResponsaveisUnicos, type Temperatura } from "@/lib/hooks/useComercial";
import { isValidEmail } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NovoLeadModal({
  open, onOpenChange, onCriado,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCriado?: (id: string) => void }) {
  const [empresa, setEmpresa] = useState("");
  const [contato, setContato] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [valor, setValor] = useState(0);
  const [responsavel, setResponsavel] = useState("Você");
  const [temperatura, setTemperatura] = useState<Temperatura>("morno");
  const [origem, setOrigem] = useState("Indicação");
  const [cidade, setCidade] = useState("");
  const [segmento, setSegmento] = useState("");

  const [outroResp, setOutroResp] = useState(false);
  const [outroOrigem, setOutroOrigem] = useState(false);

  const ORIGENS_PADRAO = ["Indicação", "Instagram", "WhatsApp", "Site", "LinkedIn", "Email"];
  const origensDb = getOrigensUnicas();
  const origens = Array.from(new Set([...ORIGENS_PADRAO, ...origensDb]));
  const responsaveisDb = getResponsaveisUnicos();
  const responsaveis = responsaveisDb.length > 0 ? responsaveisDb : ["Você"];

  const reset = () => {
    setEmpresa(""); setContato(""); setEmail(""); setTelefone("");
    setValor(0); setResponsavel("Você"); setTemperatura("morno");
    setOrigem("Indicação"); setCidade(""); setSegmento("");
    setOutroResp(false); setOutroOrigem(false);
  };

  const salvar = async () => {
    if (!empresa.trim() || !contato.trim()) {
      toast.error("Empresa e contato são obrigatórios.");
      return;
    }
    if (email.trim() && !isValidEmail(email)) {
      toast.error("E-mail inválido.");
      return;
    }
    const respFinal = outroResp ? responsavel : responsavel;
    const origemFinal = outroOrigem ? origem : origem;
    const id = await comercial.criarLead({
      empresaNome: empresa.trim(),
      contatoNome: contato.trim(),
      contatoEmail: email.trim(),
      contatoTelefone: telefone.trim(),
      valor,
      responsavel: respFinal,
      temperatura,
      origem: origemFinal,
      cidade: cidade.trim(),
      segmento: segmento.trim(),
    });
    if (!id) { toast.error("Não foi possível criar o lead."); return; }
    toast.success(`Lead "${empresa.trim()}" criado.`);
    onCriado?.(id);
    reset();
    onOpenChange(false);
  };

  const temps: { id: Temperatura; label: string; icon: typeof Flame; cor: string }[] = [
    { id: "frio",   label: "Frio",   icon: Snowflake,   cor: "text-info" },
    { id: "morno",  label: "Morno",  icon: Thermometer, cor: "text-warning" },
    { id: "quente", label: "Quente", icon: Flame,       cor: "text-destructive" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </span>
            <div>
              <DialogTitle>Novo lead</DialogTitle>
              <DialogDescription>Adicione uma nova oportunidade à jornada comercial.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Empresa *">
              <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" />
            </Field>
            <Field label="Contato *">
              <Input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="João Silva" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@empresa.com" />
            </Field>
            <Field label="Telefone">
              <PhoneInput value={telefone} onValueChange={setTelefone} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Valor estimado">
              <CurrencyInput value={valor} onValueChange={setValor} />
            </Field>

            {/* Origem — Select + Outro */}
            <Field label="Origem">
              {outroOrigem ? (
                <div className="flex gap-1.5">
                  <Input
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                    placeholder="Nova origem..."
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost" className="shrink-0" onClick={() => { setOutroOrigem(false); setOrigem(origens[0] ?? "Indicação"); }}>
                    <Plus className="size-3.5 rotate-45 text-primary" />
                  </Button>
                </div>
              ) : (
                <Select
                  value={origem}
                  onValueChange={(v) => {
                    if (v === "__outro__") { setOutroOrigem(true); setOrigem(""); }
                    else setOrigem(v);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {origens.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                    <SelectItem value="__outro__" className="text-primary">
                      <span className="inline-flex items-center gap-1">
                        <Plus className="size-3 text-primary" /> Nova origem
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>

            {/* Responsável — Select + Outro */}
            <Field label="Responsável">
              {outroResp ? (
                <div className="flex gap-1.5">
                  <Input
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Nome..."
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost" className="shrink-0" onClick={() => { setOutroResp(false); setResponsavel(responsaveis[0] ?? "Você"); }}>
                    <Plus className="size-3.5 rotate-45 text-primary" />
                  </Button>
                </div>
              ) : (
                <Select
                  value={responsavel}
                  onValueChange={(v) => {
                    if (v === "__outro__") { setOutroResp(true); setResponsavel(""); }
                    else setResponsavel(v);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {responsaveis.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                    <SelectItem value="__outro__" className="text-primary">
                      <span className="inline-flex items-center gap-1">
                        <Plus className="size-3 text-primary" /> Novo responsável
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade">
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Porto Alegre" />
            </Field>
            <Field label="Segmento">
              <Input value={segmento} onChange={(e) => setSegmento(e.target.value)} placeholder="Imobiliário" />
            </Field>
          </div>

          <Field label="Temperatura">
            <div className="inline-flex rounded-lg border border-border bg-surface-1 p-0.5">
              {temps.map(t => {
                const Icon = t.icon;
                const active = temperatura === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemperatura(t.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                      active ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-3.5", active && t.cor)} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar}>Criar lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
