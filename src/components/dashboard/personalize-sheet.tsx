import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { widgetCatalog } from "@/lib/dashboard/widgets";
import type { WidgetInstance } from "@/lib/dashboard/types";
import { Plus, Check } from "lucide-react";

export function PersonalizeSheet({
  open, onOpenChange, widgets, onAdd,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  widgets: WidgetInstance[];
  onAdd: (type: string) => void;
}) {
  const used = new Set(widgets.map(w => w.type));
  const byCat = widgetCatalog.reduce<Record<string, typeof widgetCatalog>>((acc, w) => {
    (acc[w.category] ||= []).push(w);
    return acc;
  }, {});

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-border/60 bg-background/95 backdrop-blur-xl sm:max-w-md">
        <SheetHeader className="space-y-1 text-left">
          <SheetTitle className="font-display text-xl tracking-tight">Personalizar Dashboard</SheetTitle>
          <SheetDescription>Adicione, remova e organize widgets do seu jeito.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-border/60 bg-surface-1/60 p-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Dica:</span> arraste pelo ícone de alça para reorganizar e use o menu de tamanho em cada widget para ajustar a largura.
          </div>

          {Object.entries(byCat).map(([cat, items]) => (
            <div key={cat} className="space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{cat}</div>
              <div className="space-y-1.5">
                {items.map(w => {
                  const added = used.has(w.type);
                  const Icon = w.icon;
                  return (
                    <button
                      key={w.type}
                      onClick={() => !added && onAdd(w.type)}
                      disabled={added}
                      className={`group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-surface-1/40 p-3 text-left transition hover:border-border hover:bg-surface-2 ${added ? "opacity-50" : ""}`}
                    >
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-surface-2 text-muted-foreground group-hover:text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{w.title}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{w.description}</div>
                      </div>
                      {added
                        ? <Check className="size-4 text-primary" />
                        : <Plus className="size-4 text-muted-foreground group-hover:text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
