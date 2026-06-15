import { Construction } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ComingSoon({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1400px] flex-col items-center justify-center p-8">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
            <Construction className="size-5" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <p className="mt-6 text-xs text-muted-foreground">
            Este módulo será construído nos próximos passos. Por enquanto, foque no{" "}
            <Link to="/" className="font-medium text-primary hover:underline">Cockpit</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
