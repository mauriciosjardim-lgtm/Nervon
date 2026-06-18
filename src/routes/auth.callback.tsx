import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LogoMakersHub } from "@/components/logo-nervon";

export const Route = createFileRoute("/auth/callback")({ component: AuthCallback });

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase processa o hash (#access_token=...) automaticamente ao chamar getSession.
    // Aqui só esperamos a sessão ser processada e mandamos pro root que vai decidir
    // se vai pro onboarding ou pro dashboard.
    supabase.auth.getSession().then(() => {
      navigate({ to: "/" });
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LogoMakersHub className="h-12 w-12 animate-pulse rounded-xl" />
        <p className="text-sm text-muted-foreground">Entrando no MakersHub…</p>
      </div>
    </div>
  );
}
