import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Star, Users } from "lucide-react";
import { ArrowLeft2, Add } from "iconsax-react";
import { RecursoCard } from "@/components/biblioteca/recurso-card";
import { RecursoModal } from "@/components/biblioteca/recurso-modal";
import {
  useBiblioteca, CATEGORIAS, CATEGORIA_ICONS, type CategoriaRecurso, type Recurso,
} from "@/lib/mock/biblioteca";

export const Route = createFileRoute("/biblioteca/$categoria")({
  head: () => ({ meta: [{ title: "Recursos — MakersHub" }] }),
  component: BibliotecaCategoria,
});

function BibliotecaCategoria() {
  const { categoria } = Route.useParams();
  const recursos = useBiblioteca();
  const [edit, setEdit] = useState<Recurso | null>(null);
  const [openEdit, setOpenEdit] = useState(false);

  const isFav = categoria === "favoritos";
  const isShared = categoria === "compartilhados";
  const cat = (!isFav && !isShared) ? categoria as CategoriaRecurso : undefined;
  if (!isFav && !isShared && !(cat && cat in CATEGORIAS)) throw notFound();

  const meta = isFav ? { label: "Favoritos", Icon: Star, descricao: "Seus modelos mais usados." }
              : isShared ? { label: "Compartilhados", Icon: Users, descricao: "Visíveis para sua equipe." }
              : { ...CATEGORIAS[cat!], Icon: CATEGORIA_ICONS[cat!] };
  const MetaIcon = meta.Icon;

  const filtrados = useMemo(() => {
    if (isFav) return recursos.filter(r => r.favorito);
    if (isShared) return recursos.filter(r => r.compartilhado);
    return recursos.filter(r => r.categoria === cat);
  }, [recursos, isFav, isShared, cat]);

  const novo = () => { setEdit(null); setOpenEdit(true); };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 py-7 md:px-8 md:py-10">
      <Link to="/biblioteca" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
        <ArrowLeft2 size={14} color="currentColor" variant="Linear" /> Voltar para Central de Recursos
      </Link>

      <header className="mb-8 flex items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20"><MetaIcon className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{meta.label}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{meta.descricao}</p>
          </div>
        </div>
        {cat && (
          <button onClick={novo} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-glow">
            <Add size={16} color="currentColor" variant="Linear" /> Novo
          </button>
        )}
      </header>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-surface-1/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum recurso nesta categoria ainda.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtrados.map(r => <RecursoCard key={r.id} r={r} onOpen={(rec) => { setEdit(rec); setOpenEdit(true); }} />)}
        </div>
      )}

      <RecursoModal recurso={edit} categoria={cat} open={openEdit} onClose={() => setOpenEdit(false)} />
    </div>
  );
}
