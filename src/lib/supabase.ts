import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Hardcoded to prevent Lovable's build from injecting wrong credentials
const SUPABASE_URL = "https://emivrhkmwqofylsedyxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtaXZyaGttd3FvZnlsc2VkeXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDA4OTEsImV4cCI6MjA5NzA3Njg5MX0.Obs5QhWR-T9oi4iSJgJL3IUoXbNqINZ1ELLeRjNGZvs";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
