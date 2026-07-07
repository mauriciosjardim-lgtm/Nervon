import { createFileRoute, Outlet } from "@tanstack/react-router";

// ssr:false — módulo privado, dados 100% client-side (mesmo padrão de /financeiro)
export const Route = createFileRoute("/projetos")({ ssr: false, component: () => <Outlet /> });
