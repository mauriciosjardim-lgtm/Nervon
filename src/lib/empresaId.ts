import { supabase } from "./supabase";
import { registerSessionDisposer } from "./sessionScope";

let cached: string | null = null;
registerSessionDisposer(() => { cached = null; });

export async function getEmpresaId(): Promise<string> {
  if (cached) return cached;
  const { data } = await supabase.rpc("minha_empresa_id");
  cached = data as string;
  return cached;
}

export function clearEmpresaId() {
  cached = null;
}
