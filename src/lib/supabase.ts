import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Hardcoded to prevent Lovable's build from injecting wrong credentials.
// Must match the project where all data + migrations live (smsqhbbbyjacatxvihks).
export const SUPABASE_URL = "https://smsqhbbbyjacatxvihks.supabase.co";
export const SUPABASE_KEY = "sb_publishable_Kcsq5BKG5RWrv7S9RuoD1w_0b6MS6CU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
