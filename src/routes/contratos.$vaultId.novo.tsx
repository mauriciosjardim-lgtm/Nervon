import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getVault, listTemplates, listClauses, createContract } from "@/lib/contratos/api";
import { gerarContrato } from "@/lib/contratos/engine";
import { ContratoPaper } from "@/components/contratos/contrato-paper";
import { DadosEmpresaModal } from "@/components/contratos/dados-empresa-modal";
import { incrementarUso } from "@/lib/hooks/useUso";
import type { ClientVault, ContractTemplate, ContractClause, ContractFormData } from "@/lib/contratos/types";
import {
  ArrowLeft2, ArrowRight2, TickCircle, Lock1, DocumentText1,
} from "iconsax-react";

export const Route = createFileRoute("/contratos/$vaultId/novo")({ component: NovoContrato });

const PASSOS = ["Modelo", "Dados comerciais", "Cláusulas", "Revisão"];

// Exemplos de preenchimento por tipo de contrato
const EXEMPLOS: Record<string, { nome: string; descricao: string }> = {
  servico:    { nome: "Ex: Gestão de conteúdo",          descricao: "O que será entregue, escopo resumido…" },
  recorrente: { nome: "Ex: Social media mensal",         descricao: "Entregas recorrentes por mês (posts, stories, relatórios)…" },
  video:      { nome: "Ex: Vídeo institucional",         descricao: "Roteiro, captação e edição de 1 vídeo de até 2 minutos…" },
  evento:     { nome: "Ex: Cobertura de evento",         descricao: "Captação e edição da cobertura do evento…" },
  edicao:     { nome: "Ex: Edição de vídeos",            descricao: "Edição de X vídeos a partir do material bruto enviado…" },
  imagem:     { nome: "Ex: Autorização de uso de imagem", descricao: "Uso da imagem e voz nas peças e canais acordados…" },
  proposta:   { nome: "Ex: Proposta de produção",        descricao: "Escopo da proposta e condições…" },
};

function NovoContrato() {
  const { vaultId } = Route.useParams();
  const navigate = useNavigate();
  const { empresa } = useAuth();

  const [step, setStep] = useState(0);
  const [vault, setVault] = useState<ClientVault | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [loading, setLoading] = useState(true);

  const [templateSlug, setTemplateSlug] = useState<string>("");
  const [form, setForm] = useState<ContractFormData>({});
  const [opcionais, setOpcionais] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);
  const [dadosEmpresa, setDadosEmpresa] = useState(false);

  useEffect(() => {
    (async () => {
      const [v, ts, cs] = await Promise.all([getVault(vaultId), listTemplates(), listClauses()]);
      setVault(v); setTemplates(ts); setClauses(cs);
      if (v && !form.cidade_foro) setForm(f => ({ ...f, cidade_foro: v.city ?? "" }));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultId]);

  const template = templates.find(t => t.slug === templateSlug);
  const tipo = template?.type ?? "";

  // cláusulas aplicáveis ao tipo escolhido
  const aplicaveis = useMemo(
    () => clauses.filter(c => c.contract_types.includes("*") || c.contract_types.includes(tipo)),
    [clauses, tipo],
  );
  const obrigatorias = aplicaveis.filter(c => c.required).sort((a, b) => a.order_base - b.order_base);
  const opcionaisDisponiveis = aplicaveis.filter(c => !c.required).sort((a, b) => a.order_base - b.order_base);

  const setField = (k: keyof ContractFormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleOpcional = (c: ContractClause) => {
    setOpcionais(prev => {
      const next = new Set(prev);
      if (next.has(c.slug)) {
        next.delete(c.slug);
      } else {
        // remove incompatíveis
        for (const inc of c.incompatible_with) next.delete(inc);
        // adiciona dependências opcionais
        for (const dep of c.depends_on) {
          if (opcionaisDisponiveis.some(o => o.slug === dep)) next.add(dep);
        }
        next.add(c.slug);
      }
      return next;
    });
  };

  const incompativelAtiva = (c: ContractClause) =>
    c.incompatible_with.some(inc => opcionais.has(inc));

  const emp = empresa as any;
  const contratada = {
    nome: emp?.razao_social || empresa?.nome || "Contratada",
    cnpj: emp?.cnpj ?? null,
    endereco: [emp?.endereco, emp?.cidade, emp?.estado].filter(Boolean).join(", ") || null,
  };
  const contratadaConfigurada = !!(emp?.razao_social && emp?.cnpj);
  const ex = EXEMPLOS[tipo] ?? { nome: "Ex: Nome do serviço", descricao: "Escopo resumido…" };

  // preview ao vivo
  const preview = useMemo(() => {
    if (!vault || !template) return null;
    return gerarContrato({
      allClauses: clauses,
      selectedSlugs: [...opcionais],
      templateType: tipo,
      vault,
      form,
      contratada,
    });
  }, [vault, template, clauses, opcionais, tipo, form, empresa]);

  const tituloPadrao = template ? `${template.name} — ${vault?.name ?? ""}` : "";
  const [titulo, setTitulo] = useState("");
  useEffect(() => { if (template && !titulo) setTitulo(tituloPadrao); }, [template]); // eslint-disable-line

  const salvar = async (status: "rascunho" | "gerado") => {
    if (!preview || !template) return;
    setSalvando(true);
    try {
      const novo = await createContract({
        client_vault_id: vaultId,
        template_id: template.id,
        title: titulo.trim() || tituloPadrao,
        status,
        form_data: form,
        selected_clause_ids: [...opcionais],
        rendered_html: status === "gerado" ? preview.html : undefined,
        rendered_text: status === "gerado" ? preview.text : undefined,
      });
      if (status === "gerado") { try { await incrementarUso("contratos"); } catch { /* contador best-effort */ } }
      navigate({ to: "/contratos/$vaultId/contrato/$contractId", params: { vaultId, contractId: novo.id } });
    } catch (e: any) {
      alert(e?.message ?? "Erro ao salvar contrato.");
      setSalvando(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  if (!vault) return <div className="p-8 text-sm text-muted-foreground">Cofre não encontrado.</div>;

  const podeAvancar = step === 0 ? !!templateSlug : step === 1 ? !!form.servico_nome?.trim() : true;

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-5 px-4 py-7 md:px-8 md:py-9">
      <Link to="/contratos/$vaultId" params={{ vaultId }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft2 size={14} color="currentColor" variant="Linear" /> {vault.name}
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Novo contrato</h1>
        <p className="text-xs text-muted-foreground">Monte o contrato passo a passo.</p>
      </div>

      {!contratadaConfigurada && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
          <span className="flex-1">
            Os <strong>dados da sua empresa</strong> (razão social e CNPJ) ainda não estão configurados — eles aparecem como CONTRATADA no contrato.
          </span>
          <button onClick={() => setDadosEmpresa(true)} className="shrink-0 rounded-md border border-amber-500/40 px-2.5 py-1 font-medium transition hover:bg-amber-500/20">
            Configurar agora →
          </button>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {PASSOS.map((p, i) => (
          <div key={p} className="flex flex-1 items-center gap-2">
            <div className={cn("flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              i === step ? "bg-primary/10 text-primary" : i < step ? "text-foreground" : "text-muted-foreground")}>
              <span className={cn("grid size-5 place-items-center rounded-full text-[10px]",
                i <= step ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground")}>
                {i < step ? <TickCircle size={12} color="currentColor" variant="Bold" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{p}</span>
            </div>
            {i < PASSOS.length - 1 && <div className={cn("h-px flex-1", i < step ? "bg-primary/40" : "bg-border")} />}
          </div>
        ))}
      </div>

      {/* ── Etapa 1: Modelo ── */}
      {step === 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <button key={t.id} onClick={() => setTemplateSlug(t.slug)}
              className={cn("flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition",
                templateSlug === t.slug ? "border-primary/50 bg-primary/5" : "border-border bg-surface-1/40 hover:border-border/80")}>
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <DocumentText1 size={18} color="currentColor" variant="Linear" />
              </div>
              <p className="font-display text-sm font-semibold">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Etapa 2: Dados comerciais ── */}
      {step === 1 && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface-1/40 p-5">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome do serviço <span className="text-destructive">*</span></Label>
            <Input value={form.servico_nome ?? ""} onChange={e => setField("servico_nome", e.target.value)} placeholder={ex.nome} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição do serviço</Label>
            <Textarea rows={2} value={form.servico_descricao ?? ""} onChange={e => setField("servico_descricao", e.target.value)} placeholder={ex.descricao} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Valor total</Label>
              <CurrencyInput value={form.valor_total ?? 0} onValueChange={v => setField("valor_total", v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Forma de pagamento</Label>
              <Input value={form.forma_pagamento ?? ""} onChange={e => setField("forma_pagamento", e.target.value)} placeholder="Ex: PIX, à vista, 50% entrada…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nº de parcelas</Label>
              <Input type="number" min={1} value={form.numero_parcelas ?? ""} onChange={e => setField("numero_parcelas", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Entregáveis</Label>
              <Input type="number" min={0} value={form.quantidade_entregaveis ?? ""} onChange={e => setField("quantidade_entregaveis", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Revisões inclusas</Label>
              <Input type="number" min={0} value={form.quantidade_revisoes ?? ""} onChange={e => setField("quantidade_revisoes", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prazo de entrega</Label>
              <Input value={form.prazo_entrega ?? ""} onChange={e => setField("prazo_entrega", e.target.value)} placeholder="Ex: 30 dias" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data de início</Label>
              <Input type="date" value={form.data_inicio ?? ""} onChange={e => setField("data_inicio", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data de fim (opcional)</Label>
              <Input type="date" value={form.data_fim ?? ""} onChange={e => setField("data_fim", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Multa de cancelamento (opcional)</Label>
              <Input value={form.multa_cancelamento ?? ""} onChange={e => setField("multa_cancelamento", e.target.value)} placeholder="Ex: 20% do valor" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cidade do foro</Label>
              <Input value={form.cidade_foro ?? ""} onChange={e => setField("cidade_foro", e.target.value)} placeholder="Ex: São Paulo/SP" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Observações comerciais</Label>
            <Textarea rows={2} value={form.observacoes ?? ""} onChange={e => setField("observacoes", e.target.value)} />
          </div>
        </div>
      )}

      {/* ── Etapa 3: Cláusulas ── */}
      {step === 2 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Lock1 size={12} color="currentColor" variant="Linear" /> Cláusulas obrigatórias
              </p>
              <ul className="space-y-1.5">
                {obrigatorias.map(c => (
                  <li key={c.slug} className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-surface-1/40 px-3 py-2">
                    <TickCircle size={15} color="var(--color-primary)" variant="Bold" className="shrink-0" />
                    <span className="text-[13px]">{c.title}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{c.category}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cláusulas opcionais</p>
              <ul className="space-y-1.5">
                {opcionaisDisponiveis.map(c => {
                  const bloqueada = !opcionais.has(c.slug) && incompativelAtiva(c);
                  return (
                    <li key={c.slug}>
                      <label className={cn("flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition",
                        opcionais.has(c.slug) ? "border-primary/40 bg-primary/5" : "border-border/50 bg-surface-1/40 hover:border-border",
                        bloqueada && "cursor-not-allowed opacity-40")}>
                        <input type="checkbox" className="mt-0.5 size-3.5 accent-primary"
                          checked={opcionais.has(c.slug)} disabled={bloqueada}
                          onChange={() => toggleOpcional(c)} />
                        <span className="min-w-0">
                          <span className="block text-[13px]">{c.title}</span>
                          <span className="block text-[11px] text-muted-foreground">{c.category}{bloqueada ? " · incompatível com outra cláusula selecionada" : ""}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          {/* mini preview */}
          <div className="hidden lg:block">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Prévia</p>
            <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-surface-1/30 p-1">
              {preview && <div className="scale-[0.85] origin-top"><ContratoPaper titulo={titulo || tituloPadrao} html={preview.html} /></div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Etapa 4: Revisão ── */}
      {step === 3 && preview && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Título do contrato</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} />
          </div>
          <ContratoPaper titulo={titulo || tituloPadrao} html={preview.html} />
        </div>
      )}

      {/* Navegação */}
      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <Button variant="outline" onClick={() => step === 0 ? navigate({ to: "/contratos/$vaultId", params: { vaultId } }) : setStep(s => s - 1)}>
          {step === 0 ? "Cancelar" : "Voltar"}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!podeAvancar} className="gap-1.5">
            Avançar <ArrowRight2 size={14} color="currentColor" variant="Linear" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => salvar("rascunho")} disabled={salvando}>Salvar rascunho</Button>
            <Button onClick={() => salvar("gerado")} disabled={salvando}>{salvando ? "Gerando…" : "Gerar contrato"}</Button>
          </div>
        )}
      </div>

      <DadosEmpresaModal open={dadosEmpresa} onClose={() => setDadosEmpresa(false)} />
    </div>
  );
}
