import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/contratos")({
  ssr: false,
  component: () => <Outlet />,
});
