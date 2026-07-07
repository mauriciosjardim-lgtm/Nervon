// Reexporta o client canônico do navegador (src/lib/supabase.ts).
// NÃO criar outro createClient aqui: dois clients com autoRefreshToken sobre a
// mesma storageKey disputam o refresh token (single-use) e causam
// "Invalid Refresh Token" / logout intermitente.
// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export { supabase } from "@/lib/supabase";
