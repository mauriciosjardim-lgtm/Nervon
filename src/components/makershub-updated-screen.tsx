export function MakersHubUpdatedScreen({ manualReload = false }: { manualReload?: boolean }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-surface-1/80 p-7 text-center shadow-[0_0_60px_-28px_var(--primary)]">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-primary/25 bg-primary/10">
          <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          Atualizamos o MakersHub
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Uma nova versão está pronta. Estamos carregando as melhorias para você.
        </p>

        {manualReload ? (
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary-glow"
          >
            Carregar nova versão
          </button>
        ) : (
          <p className="mt-5 text-xs font-medium text-primary">Carregando nova versão...</p>
        )}
      </div>
    </div>
  );
}
