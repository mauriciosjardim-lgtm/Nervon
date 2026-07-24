import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjetosErrorState({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry: () => void | Promise<void>;
}) {
  return (
    <section
      role="alert"
      className="mx-auto grid min-h-72 w-full max-w-2xl place-items-center rounded-2xl border border-destructive/25 bg-destructive/[0.035] p-8 text-center"
    >
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold">
          Não foi possível carregar os projetos
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
          {message ||
            "A operação não foi alterada. Verifique sua conexão e tente carregar os dados novamente."}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => void onRetry()}>
          <RefreshCw className="size-3.5" />
          Tentar novamente
        </Button>
      </div>
    </section>
  );
}

export function ProjetosLoadingState() {
  return (
    <div className="space-y-4" aria-label="Carregando projetos" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-2xl border border-border/60 bg-surface-1/35"
          />
        ))}
      </div>
      <div className="h-28 animate-pulse rounded-2xl border border-border/60 bg-surface-1/25" />
      <div className="h-[420px] animate-pulse rounded-2xl border border-border/60 bg-surface-1/25" />
    </div>
  );
}
