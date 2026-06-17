import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Target, Rocket, Check, Upload, Palette, Building2, X, User, Bot, Copy, Trash2, Plus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadMetas, saveMetas, type MetasConfig } from "@/lib/mock/metas";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { COR_PRESETS, applyBrandColor } from "@/lib/brandColor";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Nervon" }] }),
  component: ConfiguracoesPage,
});

const sections = [
  { id: "perfil",       label: "Meu Perfil" },
  { id: "produtora",    label: "Minha Produtora" },
  { id: "brand",        label: "Brand Kit" },
  { id: "metas",        label: "Metas Mensais" },
  { id: "equipe",       label: "Equipe" },
  { id: "agente",       label: "Agente IA" },
  { id: "integracoes",  label: "Integrações" },
  { id: "plano",        label: "Plano e Faturamento" },
];

function ConfiguracoesPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personalize sua produtora, equipe e integrações.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-1">
          {sections.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
            >
              {s.label}
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          <PerfilSection />
          <ProdutoraSection />
          <BrandKitSection />
          <MetasSection />
          <PlaceholderSection id="equipe" title="Equipe" desc="Convide membros, defina papéis e permissões." />
          <AgenteIASection />
          <PlaceholderSection id="integracoes" title="Integrações" desc="Google Calendar, Drive, WhatsApp, Stripe." />
          <PlaceholderSection id="plano" title="Plano e Faturamento" desc="Gerencie sua assinatura Nervon." />
        </div>
      </div>
    </div>
  );
}

// ─── Meu Perfil ──────────────────────────────────────────────────────────────

function PerfilSection() {
  const { usuario } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [cargo, setCargo] = useState(usuario?.cargo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNome(usuario?.nome ?? "");
    setCargo(usuario?.cargo ?? "");
  }, [usuario]);

  const salvar = async () => {
    if (!usuario) return;
    setSaving(true);
    await supabase.from("usuarios").update({ nome: nome.trim(), cargo: cargo.trim() || null }).eq("id", usuario.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section id="perfil" className="rounded-2xl border border-border/60 bg-surface-1/60 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-2">
        <User className="size-4 text-primary" />
        <h2 className="font-display text-lg font-semibold tracking-tight">Meu Perfil</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Nome completo</Label>
          <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cargo / função</Label>
          <Input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex: Diretor de Fotografia" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">E-mail</Label>
          <Input value={usuario?.email ?? ""} disabled className="opacity-60" />
          <p className="text-[11px] text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button onClick={salvar} disabled={saving} className="h-9 rounded-lg px-4 text-sm">
          {saving ? "Salvando…" : "Salvar perfil"}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs text-primary">
            <Check className="size-3.5" /> Atualizado
          </span>
        )}
      </div>
    </section>
  );
}

// ─── Minha Produtora ─────────────────────────────────────────────────────────

function ProdutoraSection() {
  const { empresa, refreshEmpresa } = useAuth();
  const [nome, setNome] = useState(empresa?.nome ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(empresa?.logo_url ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNome(empresa?.nome ?? "");
    setLogoPreview(empresa?.logo_url ?? null);
  }, [empresa]);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removerLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const salvar = async () => {
    if (!empresa) return;
    setSaving(true);
    let logo_url = empresa.logo_url;

    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${empresa.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, logoFile, { upsert: true });
      if (!uploadError) {
        const { data } = supabase.storage.from("logos").getPublicUrl(path);
        logo_url = data.publicUrl + `?t=${Date.now()}`;
      }
    } else if (logoPreview === null && empresa.logo_url) {
      logo_url = null;
    }

    await supabase.from("empresas").update({ nome: nome.trim(), logo_url }).eq("id", empresa.id);
    await refreshEmpresa();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section id="produtora" className="rounded-2xl border border-border/60 bg-surface-1/60 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-2">
        <Building2 className="size-4 text-primary" />
        <h2 className="font-display text-lg font-semibold tracking-tight">Minha Produtora</h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative grid size-24 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-surface-2/60 transition hover:border-primary/40">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="size-full object-contain p-2" />
            ) : (
              <Upload className="size-6 text-muted-foreground" />
            )}
            <input ref={fileRef} type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={handleLogo} />
          </div>
          {logoPreview && (
            <button onClick={removerLogo} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive">
              <X className="size-3" /> Remover
            </button>
          )}
          <p className="text-center text-[10px] text-muted-foreground">PNG ou SVG<br />Recomendado 200×200px</p>
        </div>

        {/* Nome */}
        <div className="flex flex-col justify-center gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome da produtora</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Visão Filmes" className="max-w-sm" />
          </div>
          <div>
            <Button onClick={salvar} disabled={saving} className="h-9 rounded-lg px-4 text-sm">
              {saving ? "Salvando…" : "Salvar"}
            </Button>
            {saved && (
              <span className="ml-3 inline-flex items-center gap-1.5 text-xs text-primary">
                <Check className="size-3.5" /> Atualizado
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Brand Kit ───────────────────────────────────────────────────────────────

function BrandKitSection() {
  const { empresa, refreshEmpresa } = useAuth();
  const [cor, setCor] = useState(empresa?.accent_color ?? COR_PRESETS[0].value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCor(empresa?.accent_color ?? COR_PRESETS[0].value);
  }, [empresa]);

  const aplicarCor = (c: string) => {
    setCor(c);
    applyBrandColor(c);
  };

  const salvar = async () => {
    if (!empresa) return;
    setSaving(true);
    await supabase.from("empresas").update({ accent_color: cor }).eq("id", empresa.id);
    await refreshEmpresa();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section id="brand" className="rounded-2xl border border-border/60 bg-surface-1/60 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-2">
        <Palette className="size-4 text-primary" />
        <h2 className="font-display text-lg font-semibold tracking-tight">Brand Kit</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">Cor de destaque usada em botões, badges e gráficos.</p>

      <div className="flex flex-wrap gap-3">
        {COR_PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => aplicarCor(p.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition",
              cor === p.value ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-primary/40",
            )}
          >
            <span className="size-8 rounded-full shadow" style={{ backgroundColor: p.value }} />
            <span className="text-[11px] text-muted-foreground">{p.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={salvar} disabled={saving} className="h-9 rounded-lg px-4 text-sm">
          {saving ? "Salvando…" : "Salvar cor"}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs text-primary">
            <Check className="size-3.5" /> Cor salva
          </span>
        )}
      </div>
    </section>
  );
}

// ─── Metas Mensais ───────────────────────────────────────────────────────────

function MetasSection() {
  const [config, setConfig] = useState<MetasConfig>({ meta: 100000, superMeta: 150000 });
  const [saved, setSaved] = useState(false);

  useEffect(() => { setConfig(loadMetas()); }, []);

  const handleSave = () => {
    saveMetas(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section id="metas" className="rounded-2xl border border-border/60 bg-surface-1/60 p-6 backdrop-blur-sm">
      <div className="mb-1 font-display text-lg font-semibold tracking-tight">Metas Mensais</div>
      <p className="mb-5 text-sm text-muted-foreground">Alimentam o Progresso do Mês no Dashboard.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyField icon={Target} label="Meta mensal" hint="Receita-alvo do mês."
          value={config.meta} onChange={v => setConfig(c => ({ ...c, meta: v }))} />
        <MoneyField icon={Rocket} label="Super Meta mensal" hint="Ambição que vai além da meta."
          value={config.superMeta} onChange={v => setConfig(c => ({ ...c, superMeta: v }))} />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={handleSave} className="h-9 rounded-lg px-4 text-sm">Salvar metas</Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Check className="size-3.5" /> Atualizado
          </span>
        )}
      </div>
    </section>
  );
}

function MoneyField({ icon: Icon, label, hint, value, onChange }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; hint: string; value: number; onChange: (v: number) => void;
}) {
  const fmt = (v: number) =>
    Number.isFinite(v) ? v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    onChange(raw ? Number(raw) : 0);
  };

  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 focus-within:border-primary/40">
        <span className="text-sm text-muted-foreground">R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={fmt(value)}
          onChange={handleChange}
          className="h-10 w-full bg-transparent font-display text-base tabular-nums text-foreground outline-none"
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </label>
  );
}

// ─── Agente IA (MCP) ─────────────────────────────────────────────────────────

// URL do servidor MCP (Cloudflare Worker). Após o primeiro `wrangler deploy`,
// confirme/atualize aqui com a URL que o deploy imprimir.
const MCP_URL = "https://mcp.nervon.com.br";

interface McpToken {
  id: string;
  nome: string;
  criado_em: string;
  ultimo_uso: string | null;
  revogado: boolean;
}

function gerarTokenPlano(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return "nvn_" + [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function AgenteIASection() {
  const { empresa } = useAuth();
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [novoToken, setNovoToken] = useState<string | null>(null);

  const carregar = async () => {
    if (!empresa) return;
    const { data } = await (supabase as any)
      .from("mcp_tokens")
      .select("id, nome, criado_em, ultimo_uso, revogado")
      .eq("revogado", false)
      .order("criado_em", { ascending: false });
    setTokens((data as McpToken[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [empresa]);

  const gerar = async () => {
    if (!empresa) return;
    setGerando(true);
    const plano = gerarTokenPlano();
    const hash = await sha256Hex(plano);
    const { error } = await (supabase as any)
      .from("mcp_tokens")
      .insert({ empresa_id: empresa.id, token_hash: hash, nome: "Agente IA" });
    setGerando(false);
    if (error) { alert("Erro ao gerar token: " + error.message); return; }
    setNovoToken(plano);
    carregar();
  };

  const revogar = async (id: string) => {
    if (!confirm("Revogar este token? O agente conectado com ele perde o acesso imediatamente.")) return;
    await (supabase as any).from("mcp_tokens").update({ revogado: true }).eq("id", id);
    carregar();
  };

  return (
    <section id="agente" className="rounded-2xl border border-border/60 bg-surface-1/60 p-6 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        <Bot className="size-4 text-primary" />
        <h2 className="font-display text-lg font-semibold tracking-tight">Agente IA</h2>
      </div>
      <p className="mb-5 max-w-2xl text-sm text-muted-foreground">
        Conecte seu próprio agente do Claude ao Nervon. Ele passa a criar leads, consultar o funil
        e mover etapas sozinho — em linguagem natural, sem você abrir o sistema.
      </p>

      {novoToken ? (
        <NovoTokenReveal token={novoToken} onClose={() => setNovoToken(null)} />
      ) : (
        <Button onClick={gerar} disabled={gerando} className="h-9 rounded-lg px-4 text-sm">
          <Plus className="mr-1.5 size-4" /> {gerando ? "Gerando…" : "Gerar token de acesso"}
        </Button>
      )}

      {/* Lista de tokens ativos */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <KeyRound className="size-3" /> Tokens ativos
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum token ativo. Gere um para conectar seu agente.</p>
        ) : (
          <ul className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/50">
            {tokens.map(t => (
              <li key={t.id} className="flex items-center justify-between gap-3 bg-surface-2/30 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.nome}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Criado em {new Date(t.criado_em).toLocaleDateString("pt-BR")}
                    {t.ultimo_uso
                      ? ` · Último uso ${new Date(t.ultimo_uso).toLocaleString("pt-BR")}`
                      : " · Nunca usado"}
                  </p>
                </div>
                <button
                  onClick={() => revogar(t.id)}
                  className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" /> Revogar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function NovoTokenReveal({ token, onClose }: { token: string; onClose: () => void }) {
  const comando = `claude mcp add --transport http nervon ${MCP_URL} --header "Authorization: Bearer ${token}"`;
  const [copiado, setCopiado] = useState<"cmd" | "token" | null>(null);

  const copiar = async (texto: string, qual: "cmd" | "token") => {
    await navigator.clipboard.writeText(texto);
    setCopiado(qual);
    setTimeout(() => setCopiado(null), 1800);
  };

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
        <Check className="size-4" /> Token gerado! Copie agora — ele não será mostrado de novo.
      </div>

      {/* Comando pronto */}
      <div className="relative mt-3 rounded-lg border border-border/60 bg-background/70 p-3 pr-12">
        <code className="block break-all font-mono text-[12px] leading-relaxed text-foreground">{comando}</code>
        <button
          onClick={() => copiar(comando, "cmd")}
          className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-border/60 bg-surface-2 px-2 py-1 text-[11px] transition hover:bg-surface-1"
        >
          {copiado === "cmd" ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
          {copiado === "cmd" ? "Copiado" : "Copiar"}
        </button>
      </div>

      {/* Passo a passo */}
      <div className="mt-4 rounded-lg bg-surface-2/40 p-3 text-xs text-muted-foreground">
        <p className="mb-1.5 font-medium text-foreground">Como conectar:</p>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Copie o comando acima.</li>
          <li>Abra o Terminal no seu computador.</li>
          <li>Cole, pressione Enter e reinicie o Claude.</li>
        </ol>
        <p className="mt-2">Pronto — seu agente Claude já tem acesso ao Nervon. 🎬</p>
      </div>

      <button onClick={onClose} className="mt-3 text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground">
        Já copiei, fechar
      </button>
    </div>
  );
}

function PlaceholderSection({ id, title, desc }: { id: string; title: string; desc: string }) {
  return (
    <section id={id} className="rounded-2xl border border-dashed border-border/60 bg-surface-1/30 p-6">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <span className="mt-3 inline-block rounded-md border border-border/60 bg-surface-2 px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Em breve</span>
    </section>
  );
}
