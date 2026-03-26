import { AppShell } from "@/app/_components/app-shell";
import { DashboardView } from "@/app/_components/dashboard-view";

export default function HomePage() {
  return (
    <AppShell activePath="/">
      <DashboardView />
    </AppShell>
  );
}
