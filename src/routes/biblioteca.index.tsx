import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SearchNormal, ArchiveBook } from "iconsax-react";
import { CategoriaCard } from "@/components/biblioteca/categoria-card";
import { RecursoCard } from "@/components/biblioteca/recurso-card";
import { RecursoModal } from "@/components/biblioteca/recurso-modal";
import {
  useBiblioteca, CATEGORIAS, type CategoriaRecurso, type Recurso,
} from "@/lib/mock/biblioteca";

export const Route = createFileRoute("/biblioteca/")({
  head: () => ({ meta: [{ title: "Central de Recursos — MakersHub" }] }),
  component: BibliotecaIndex,
});

function BibliotecaIndex() {
  const recursos = useBiblioteca();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Recurso | null>(null);
  const [openEdit, setOpenEdit] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { favoritos: 0, compartilhados: 0 };
    (Object.keys(CATEGORIAS) as CategoriaRecurso[]).forEach(k => c[k] = 0);
    recursos.forEach(r => {
      c[r.categoria] = (c[r.categoria] || 0) + 1;
      if (r.favorito) c.favoritos++;
      if (r.compartilhado) c.compartilhados++;
    });
    return c;
  }, [recursos]);

  const resultados = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return [];
    return recursos.filter(r => r.titulo.toLowerCase().includes(t) || (r.descricao?.toLowerCase().includes(t)) || r.conteudo.toLowerCase().includes(t));
  }, [recursos, q]);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 py-7 md:px-8 md:py-10">
      <header className="mb-8 text-center">
        <p className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <ArchiveBook size={14} color="currentColor" variant="Linear" className="text-primary" /> Central de Recursos
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Tudo o que sua produtora reusa
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Propostas, contratos, briefings, checklists, roteiros e mensagens — em um só lugar.</p>

        <div className="relative mx-auto mt-6 max-w-xl">
          <SearchNormal size={16} color="currentColor" variant="Linear" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar em todos os recursos…"
            className="h-12 w-full rounded-xl border border-border/60 bg-surface-1/60 pl-10 pr-4 text-sm outline-none transition focus:border-primary/40 focus:bg-surface-1" />
        </div>
      </header>

      {q && (
        <section className="mb-10">
          <h2 className="mb-3 font-display text-base font-semibold">
            {resultados.length} resultado{resultados.length !== 1 ? "s" : ""} para "{q}"
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {resultados.map(r => <RecursoCard key={r.id} r={r} onOpen={(rec) => { setEdit(rec); setOpenEdit(true); }} />)}
          </div>
        </section>
      )}

      <section>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {(Object.keys(CATEGORIAS) as CategoriaRecurso[]).map(k => (
            <CategoriaCard key={k} categoria={k} count={counts[k]} />
          ))}
          <CategoriaCard categoria="favoritos" count={counts.favoritos} />
          <CategoriaCard categoria="compartilhados" count={counts.compartilhados} />
          <CategoriaCard categoria="marketplace" disabled badge="Em breve" />
        </div>
      </section>

      <RecursoModal recurso={edit} open={openEdit} onClose={() => setOpenEdit(false)} />
    </div>
  );
}
