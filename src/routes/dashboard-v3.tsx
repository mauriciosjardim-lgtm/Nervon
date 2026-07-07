import { createFileRoute, Navigate } from "@tanstack/react-router";
import { DashboardV3 } from "@/components/dashboard-v3/dashboard-v3";

export const Route = createFileRoute("/dashboard-v3")({
  head: () => ({ meta: [{ title: "Dashboard V3 — Preview local" }] }),
  component: DashboardV3Preview,
});

function DashboardV3Preview() {
  if (!import.meta.env.DEV) return <Navigate to="/" replace />;
  return <DashboardV3 />;
}
