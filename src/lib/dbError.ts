import { toast } from "sonner";

/**
 * Surface de erros de banco. Em vez de engolir (`if (!error)`), toda gravação
 * deve passar por aqui: loga no console e mostra um toast pro usuário.
 * Retorna true se houve erro (pra o chamador abortar).
 *
 * Uso:
 *   const { data, error } = await supabase.from("x").insert(...);
 *   if (dbErro(error, "salvar lançamento")) return;
 */
export function dbErro(
  error: { message?: string; code?: string } | null | undefined,
  contexto = "salvar",
): boolean {
  if (!error) return false;
  console.error(`[db] erro ao ${contexto}:`, error);
  toast.error(`Erro ao ${contexto}: ${error.message ?? "tente novamente"}`);
  return true;
}
