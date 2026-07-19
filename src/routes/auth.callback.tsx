import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LogoMakersHub } from "@/components/logo-makershub";
import { consumeAuthSessionFromUrl } from "@/lib/auth-url-session";

export const Route = createFileRoute("/auth/callback")({ component: AuthCallback });

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    void consumeAuthSessionFromUrl(supabase).then(({ data, error }) => {
      if (!active) return;
      navigate({ to: error || !data.session ? "/login" : "/" });
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LogoMakersHub className="h-12 w-12 animate-pulse rounded-xl" />
        <p className="text-sm text-muted-foreground">Entrando no MakersHub…</p>
      </div>
    </div>
  );
}
