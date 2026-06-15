import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/orcamentos")({
  ssr: false,
  component: () => <Outlet />,
});
