import { createFileRoute, Navigate } from "@tanstack/react-router";
import { RedesignLogin } from "@/components/redesign/redesign-login";

export const Route = createFileRoute("/redesign-login")({
  head: () => ({ meta: [{ title: "Redesign Login — Preview" }] }),
  component: RedesignLoginPreview,
});

function RedesignLoginPreview() {
  if (!import.meta.env.DEV) return <Navigate to="/" replace />;
  return (
    <div className="theme-redesign">
      <RedesignLogin />
    </div>
  );
}
