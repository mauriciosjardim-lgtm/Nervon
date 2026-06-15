import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/biblioteca")({
  ssr: false,
  component: () => <Outlet />,
});
