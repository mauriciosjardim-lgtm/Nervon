import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

// Landing carregada sob demanda (mesmo chunk lazy usado pelo __root) — sem
// import estático, o texto da landing fica fora do bundle inicial.
export const Route = createFileRoute("/home")({
  component: lazyRouteComponent(
    () => import("@/components/landing/landing-page"),
    "LandingPage",
  ),
});
