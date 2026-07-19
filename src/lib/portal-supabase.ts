import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase";

// O cliente final precisa manter uma sessão independente da equipe da produtora.
// Sem uma storageKey própria, entrar no portal substitui o login do MakersHub
// porque ambos rodam no mesmo domínio.
export const portalSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storageKey: "makershub-portal-auth",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
