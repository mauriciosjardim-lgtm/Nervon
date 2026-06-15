export type WidgetSize = "sm" | "md" | "lg";

export interface WidgetInstance {
  id: string;        // unique instance id
  type: string;      // widget type key
  size: WidgetSize;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetInstance[];
}

export interface WidgetMeta {
  type: string;
  title: string;
  description: string;
  category: "Financeiro" | "Comercial" | "Operacional" | "Pessoal" | "Inteligência";
  defaultSize: WidgetSize;
  icon: React.ComponentType<{ className?: string }>;
}
