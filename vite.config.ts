// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    define: {
      // Override Lovable's VITE_* env injection with the correct Supabase project
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://emivrhkmwqofylsedyxa.supabase.co"),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtaXZyaGttd3FvZnlsc2VkeXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDA4OTEsImV4cCI6MjA5NzA3Njg5MX0.Obs5QhWR-T9oi4iSJgJL3IUoXbNqINZ1ELLeRjNGZvs"),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtaXZyaGttd3FvZnlsc2VkeXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDA4OTEsImV4cCI6MjA5NzA3Njg5MX0.Obs5QhWR-T9oi4iSJgJL3IUoXbNqINZ1ELLeRjNGZvs"),
    },
  },
});
