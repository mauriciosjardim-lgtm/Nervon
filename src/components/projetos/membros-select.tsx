import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useEquipe } from "@/lib/hooks/useEquipe";
import { cn } from "@/lib/utils";
import { ArrowDown2, TickCircle, People } from "iconsax-react";

/**
 * Multi-seleção da equipe do projeto a partir dos colaboradores do workspace.
 * O valor é uma lista de nomes (compatível com projeto.equipe: string[]).
 */
export function MembrosSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const membros = useEquipe();

  const toggle = (nome: string) => {
    onChange(value.includes(nome) ? value.filter(n => n !== nome) : [...value, nome]);
  };

  const label =
    value.length === 0 ? "Selecionar colaboradores"
      : value.length <= 2 ? value.join(", ")
        : `${value.length} colaboradores`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm transition hover:border-primary/40"
        >
          <span className={cn("truncate", value.length === 0 && "text-muted-foreground")}>{label}</span>
          <ArrowDown2 size={14} color="currentColor" variant="Linear" className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
        {membros.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">Nenhum colaborador na equipe ainda.</p>
        ) : (
          <ul className="max-h-56 overflow-y-auto">
            {membros.map(m => {
              const sel = value.includes(m.nome);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggle(m.nome)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition hover:bg-surface-2"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
                      {m.nome.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{m.nome}</span>
                      {m.role === "admin" && <span className="text-[10px] text-muted-foreground">Admin</span>}
                    </span>
                    {sel
                      ? <TickCircle size={16} color="var(--color-primary)" variant="Bold" className="shrink-0" />
                      : <span className="size-4 shrink-0 rounded-full border border-border" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Seleção única do responsável por uma atividade (membro do workspace).
 */
export function ResponsavelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const membros = useEquipe();
  // garante que um responsável legado (texto livre) ainda apareça
  const nomes = membros.map(m => m.nome);
  const opcoes = value && !nomes.includes(value) ? [value, ...nomes] : nomes;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm transition hover:border-primary/40"
        >
          <span className={cn("flex min-w-0 items-center gap-2 truncate", !value && "text-muted-foreground")}>
            <People size={14} color="currentColor" variant="Linear" className="shrink-0 text-muted-foreground" />
            <span className="truncate">{value || "Selecionar responsável"}</span>
          </span>
          <ArrowDown2 size={14} color="currentColor" variant="Linear" className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
        {opcoes.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">Nenhum colaborador na equipe ainda.</p>
        ) : (
          <ul className="max-h-56 overflow-y-auto">
            {opcoes.map(nome => (
              <li key={nome}>
                <button
                  type="button"
                  onClick={() => onChange(nome)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition hover:bg-surface-2",
                    value === nome && "bg-surface-2",
                  )}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
                    {nome.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{nome}</span>
                  {value === nome && <TickCircle size={16} color="var(--color-primary)" variant="Bold" className="shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
