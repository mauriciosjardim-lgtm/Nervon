import { Star, Share, Copy, Trash, Edit2 } from "iconsax-react";
import { bibliotecaActions, type Recurso } from "@/lib/mock/biblioteca";

export function RecursoCard({ r, onOpen }: { r: Recurso; onOpen: (r: Recurso) => void }) {
  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-surface-1/40 p-4 transition hover:border-primary/30 hover:bg-surface-1">
      <header className="flex items-start justify-between gap-2">
        <button onClick={() => onOpen(r)} className="min-w-0 flex-1 text-left">
          <h3 className="truncate font-display text-sm font-semibold">{r.titulo}</h3>
          {r.descricao && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.descricao}</p>}
        </button>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
          <Icon onClick={() => bibliotecaActions.toggleFavorito(r.id)} active={r.favorito} title="Favoritar">
            <Star size={14} color="currentColor" variant="Linear" className={r.favorito ? "fill-warning text-warning" : ""} />
          </Icon>
          <Icon onClick={() => bibliotecaActions.toggleCompartilhado(r.id)} active={r.compartilhado} title="Compartilhar">
            <Share size={14} color="currentColor" variant="Linear" />
          </Icon>
          <Icon onClick={() => bibliotecaActions.duplicar(r.id)} title="Duplicar"><Copy size={14} color="currentColor" variant="Linear" /></Icon>
          <Icon onClick={() => onOpen(r)} title="Editar"><Edit2 size={14} color="currentColor" variant="Linear" /></Icon>
          <Icon onClick={() => { if (confirm("Remover este recurso?")) bibliotecaActions.remover(r.id); }} title="Remover" danger>
            <Trash size={14} color="currentColor" variant="Linear" />
          </Icon>
        </div>
      </header>
      <p className="line-clamp-3 rounded-lg bg-background/40 p-2 text-[11px] text-muted-foreground">
        {r.conteudo.slice(0, 200)}{r.conteudo.length > 200 ? "…" : ""}
      </p>
      <footer className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Atualizado {new Date(r.atualizadoEm).toLocaleDateString("pt-BR")}</span>
        <div className="flex gap-1">
          {r.favorito && <Star size={12} color="currentColor" variant="Linear" className="fill-warning text-warning" />}
          {r.compartilhado && <Share size={12} color="currentColor" variant="Linear" className="text-info" />}
        </div>
      </footer>
    </div>
  );
}

function Icon({ children, onClick, active, danger, title }: { children: React.ReactNode; onClick: () => void; active?: boolean; danger?: boolean; title: string }) {
  return (
    <button onClick={onClick} title={title}
      className={`grid size-7 place-items-center rounded-md text-muted-foreground transition ${
        danger ? "hover:bg-destructive/10 hover:text-destructive" :
        active ? "text-primary hover:bg-primary/10" :
        "hover:bg-surface-2 hover:text-foreground"
      }`}>
      {children}
    </button>
  );
}
