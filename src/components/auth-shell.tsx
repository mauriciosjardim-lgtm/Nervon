import { Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { TrialExpirado } from "@/components/trial-expirado";

interface AuthShellProps {
  trialExpirado: boolean;
  sidebarStyle: React.CSSProperties;
}

export function AuthShell({ trialExpirado, sidebarStyle }: AuthShellProps) {
  if (trialExpirado) return <TrialExpirado />;

  return (
    <SidebarProvider defaultOpen={false} style={sidebarStyle} className="pt-2">
      <AppSidebar />
      <SidebarInset className="flex min-h-screen w-full flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden px-2 pb-3 sm:px-3 lg:px-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
