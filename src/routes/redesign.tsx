import { createFileRoute, Navigate } from "@tanstack/react-router";
import { RedesignCockpit } from "@/components/redesign/redesign-cockpit";

export const Route = createFileRoute("/redesign")({
  head: () => ({ meta: [{ title: "Redesign Cockpit — Preview" }] }),
  component: RedesignPreview,
});

function RedesignPreview() {
  if (!import.meta.env.DEV) return <Navigate to="/" replace />;
  return (
    <div className="theme-redesign min-h-screen bg-background text-foreground overflow-x-hidden">
      <RedesignCockpit />
    </div>
  );
}
