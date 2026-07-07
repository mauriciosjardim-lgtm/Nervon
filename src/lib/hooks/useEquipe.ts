import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registerSessionDisposer } from "@/lib/sessionScope";

export interface MembroEquipe {
  id: string;
  nome: string;
  email: string;
  role: string;
}

// cache em memória para exibição instantânea; sempre revalida no mount
let cache: MembroEquipe[] | null = null;
registerSessionDisposer(() => { cache = null; });

/**
 * Membros do workspace atual (RLS já limita à empresa do usuário logado).
 */
export function useEquipe() {
  const [membros, setMembros] = useState<MembroEquipe[]>(cache ?? []);

  useEffect(() => {
    let alive = true;
    supabase
      .from("usuarios")
      .select("id, nome, email, role")
      .order("nome")
      .then(({ data }) => {
        if (!alive) return;
        cache = (data ?? []) as MembroEquipe[];
        setMembros(cache);
      });
    return () => { alive = false; };
  }, []);

  return membros;
}
