import { useState, useEffect } from "react";
import { X, Eye, Save, Sparkles } from "lucide-react";
import {
  bibliotecaActions, aplicarVariaveis, VARIAVEIS_DISPONIVEIS, VARIAVEIS_EXEMPLO,
  type Recurso, type CategoriaRecurso, CATEGORIAS, CATEGORIA_ICONS,
} from "@/lib/mock/biblioteca";

export function RecursoModal({
  recurso, categoria, open, onClose,
}: { recurso: Recurso | null; categoria?: CategoriaRecurso; open: boolean; onClose: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitulo(recurso?.titulo ?? "");
    setDescricao(recurso?.descricao ?? "");
    setConteudo(recurso?.conteudo ?? "");
    setPreview(false);
  }, [open, recurso]);

  if (!open) return null;

  const salvar = () => {
    if (!titulo.trim()) return;
    if (recurso) bibliotecaActions.atualizar(recurso.id, { titulo, descricao, conteudo });
    else if (categoria) bibliotecaActions.criar({ categoria, titulo, descricao, conteudo });
    onClose();
  };

  const insertVar = (v: string) => {
    setConteudo(c => c + `{{${v}}}`);
  };

  const cat = recurso?.categoria ?? categoria;
  const CatIcon = cat ? CATEGORIA_ICONS[cat] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-elevated)]">
        <header className="flex items-center justify-between border-b border-border/60 p-5">
          <div className="flex items-center gap-3">
            {CatIcon && <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20"><CatIcon className="size-4" /></span>}
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">{recurso ? "Editar recurso" : "Novo recurso"}</h2>
              {cat && <p className="text-xs text-muted-foreground">{CATEGORIAS[cat].label}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground"><X className="size-4" /></button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Título</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background/40 px-3 text-sm outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background/40 px-3 text-sm outline-none focus:border-primary/50" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Conteúdo</label>
              <button onClick={() => setPreview(p => !p)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Eye className="size-3.5" /> {preview ? "Editar" : "Pré-visualizar"}
              </button>
            </div>
            {preview ? (
              <div className="min-h-[280px] whitespace-pre-wrap rounded-lg border border-primary/30 bg-background/40 p-4 text-sm">
                {aplicarVariaveis(conteudo, VARIAVEIS_EXEMPLO)}
              </div>
            ) : (
              <textarea value={conteudo} onChange={e => setConteudo(e.target.value)}
                rows={12}
                className="w-full rounded-lg border border-border/60 bg-background/40 p-3 font-mono text-xs outline-none focus:border-primary/50" />
            )}
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3" /> Variáveis disponíveis (clique para inserir)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {VARIAVEIS_DISPONIVEIS.map(v => (
                <button key={v} onClick={() => insertVar(v)}
                  className="rounded-md border border-border/60 bg-surface-1/60 px-2 py-1 font-mono text-[11px] text-primary transition hover:border-primary/40 hover:bg-primary/10">
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border/60 p-4">
          <button onClick={onClose} className="rounded-lg border border-border/60 px-4 py-2 text-sm hover:bg-surface-2">Cancelar</button>
          <button onClick={salvar} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-glow">
            <Save className="size-3.5" /> Salvar
          </button>
        </footer>
      </div>
    </div>
  );
}
