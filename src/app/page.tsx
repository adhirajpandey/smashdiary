import { AppShell } from "@/app/_components/app-shell";
import { DashboardPageClient } from "@/app/_components/dashboard-page-client";

export default function HomePage() {
  return (
    <AppShell activePath="/">
      <DashboardPageClient />
    </AppShell>
  );
}
