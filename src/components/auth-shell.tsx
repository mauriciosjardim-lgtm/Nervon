import { Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { TrialExpirado } from "@/components/trial-expirado";
import { AjudaWidget } from "@/components/ajuda/ajuda-widget";

interface AuthShellProps {
  trialExpirado: boolean;
  sidebarStyle: React.CSSProperties;
}

export function AuthShell({ trialExpirado, sidebarStyle }: AuthShellProps) {
  if (trialExpirado) return <TrialExpirado />;

  return (
    <SidebarProvider style={sidebarStyle} className="pt-2">
      <AppSidebar />
      <SidebarInset className="flex min-h-screen w-full flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </SidebarInset>
      <AjudaWidget />
    </SidebarProvider>
  );
}
