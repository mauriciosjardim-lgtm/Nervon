import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Maximize2 } from "lucide-react";
import { widgetRegistry } from "@/lib/dashboard/widgets";
import type { WidgetInstance, WidgetSize } from "@/lib/dashboard/types";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colSpan: Record<WidgetSize, string> = {
  sm: "col-span-12 sm:col-span-6 lg:col-span-3",
  md: "col-span-12 sm:col-span-6 lg:col-span-6",
  lg: "col-span-12",
};

const rowSpan: Record<WidgetSize, string> = {
  sm: "min-h-[148px]",
  md: "min-h-[260px]",
  lg: "min-h-[320px]",
};

export function WidgetCard({
  widget, editing, onRemove, onResize,
}: {
  widget: WidgetInstance;
  editing: boolean;
  onRemove: () => void;
  onResize: (s: WidgetSize) => void;
}) {
  const meta = widgetRegistry[widget.type];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id, disabled: !editing });
  if (!meta) return null;
  const Comp = meta.component;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${colSpan[widget.size]} ${rowSpan[widget.size]}`}
    >
      <div className={`group relative flex h-full flex-col rounded-2xl border border-border/60 bg-surface-1/60 p-5 backdrop-blur-sm transition hover:border-border ${editing ? "ring-1 ring-primary/30" : ""}`}>
        {editing && (
          <div className="absolute -top-2 right-3 flex items-center gap-1 rounded-lg border border-border/80 bg-surface-2 px-1 py-0.5 shadow-md">
            <button {...attributes} {...listeners} className="grid size-6 cursor-grab place-items-center rounded text-muted-foreground hover:bg-surface-3 hover:text-foreground active:cursor-grabbing">
              <GripVertical className="size-3.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-surface-3 hover:text-foreground">
                <Maximize2 className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(["sm", "md", "lg"] as WidgetSize[]).map(s => (
                  <DropdownMenuItem key={s} onClick={() => onResize(s)} className={widget.size === s ? "text-primary" : ""}>
                    {s === "sm" ? "Pequeno" : s === "md" ? "Médio" : "Grande"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={onRemove} className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1"><Comp /></div>
      </div>
    </div>
  );
}
