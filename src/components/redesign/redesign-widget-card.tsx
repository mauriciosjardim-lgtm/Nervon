import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { CloseCircle, Maximize } from "iconsax-react";
import { widgetRegistry } from "@/lib/dashboard/widget-catalog";
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

const componentCache = new Map<string, LazyExoticComponent<ComponentType>>();

function getWidgetComponent(type: string) {
  const cached = componentCache.get(type);
  if (cached) return cached;
  const component = lazy(async () => {
    const { widgetComponents } = await import("@/lib/dashboard/widgets");
    return { default: widgetComponents[type] ?? (() => null) };
  });
  componentCache.set(type, component);
  return component;
}

export function RedesignWidgetCard({
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
  const Comp = getWidgetComponent(widget.type);

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
      <div className={`group relative flex h-full flex-col glass-panel-premium hover-redesign-card p-4 sm:p-5 ${editing ? "ring-1 ring-primary/30" : ""}`}>
        {editing && (
          <div className="absolute -top-2 right-3 flex items-center gap-1 rounded-lg border border-border/80 bg-surface-2 px-1 py-0.5 shadow-md z-10">
            <button {...attributes} {...listeners} className="grid size-6 cursor-grab place-items-center rounded text-muted-foreground hover:bg-surface-3 hover:text-foreground active:cursor-grabbing">
              <GripVertical className="size-3.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-surface-3 hover:text-foreground">
                <Maximize size={12} color="currentColor" variant="Linear" />
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
              <CloseCircle size={14} color="currentColor" variant="Linear" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1">
          <Suspense fallback={<div className="h-full min-h-20 animate-pulse rounded-xl bg-surface-2/50" />}>
            <Comp />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
