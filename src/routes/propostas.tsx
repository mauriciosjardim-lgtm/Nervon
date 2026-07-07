import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/propostas")({ ssr: false, component: Outlet });
