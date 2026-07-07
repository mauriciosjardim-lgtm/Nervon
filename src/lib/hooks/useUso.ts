import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Recurso } from "@/lib/plano";

// RPCs não estão no Database types gerado; cast confinado aqui.
const sb = supabase as any;

/** Uso do mês corrente por recurso ({ contratos: 3, ... }). */
export function useUso() {
  const [uso, setUso] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const recarregar = useCallback(async () => {
    const { data } = await sb.rpc("uso_do_mes");
    const map: Record<string, number> = {};
    (data ?? []).forEach((r: any) => { map[r.recurso] = r.quantidade; });
    setUso(map);
    setLoading(false);
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);

  return { uso, loading, recarregar };
}

/** Incrementa o uso de um recurso no mês e devolve o novo total. */
export async function incrementarUso(recurso: Recurso, inc = 1): Promise<number> {
  const { data } = await sb.rpc("incrementar_uso", { p_recurso: recurso, p_inc: inc });
  return (data as number) ?? 0;
}
