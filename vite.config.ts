// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    autoCodeSplitting: true,
    server: { entry: "server" },
  },
  vite: {
    define: {
      // Override Lovable's VITE_* env injection with the correct Supabase project
      // (smsqhbbbyjacatxvihks — where all data + migrations live)
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://smsqhbbbyjacatxvihks.supabase.co"),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("sb_publishable_Kcsq5BKG5RWrv7S9RuoD1w_0b6MS6CU"),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify("sb_publishable_Kcsq5BKG5RWrv7S9RuoD1w_0b6MS6CU"),
      "import.meta.env.VITE_TURNSTILE_SITE_KEY": JSON.stringify(
        "0x4AAAAAAD5JtHvdBJAwRVHa",
      ),
    },
    build: {
      rollupOptions: {
        output: {
          // Vendors estáveis em chunks próprios → ficam em cache entre deploys
          // (o usuário não re-baixa React/router/supabase a cada publicação).
          // Só agrupamos o core que TODA página precisa (fica estável em cache).
          // NÃO agrupamos recharts/d3/radix — senão qualquer uso pequeno arrasta
          // o chunk inteiro pro caminho crítico (ex: recharts caía no /login).
          // Supabase fica separado para manter o entry menor e o SDK em cache.
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return;
            if (/[\\/]react(-dom)?[\\/]|[\\/]scheduler[\\/]/.test(id)) return "vendor-react";
            if (id.includes("@tanstack"))  return "vendor-tanstack";
            if (id.includes("@supabase"))  return "vendor-supabase";
          },
        },
      },
    },
  },
});
