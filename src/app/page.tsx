import { AppShell } from "@/app/_components/app-shell";
import { DashboardView } from "@/app/_components/dashboard-view";
import { getDashboardPageData } from "@/lib/queries/page-data";
import { parseNumericId } from "@/lib/utils";

export default async function HomePage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ savedGameId?: string }>;
}>) {
  const [{ matches, players }, resolvedSearchParams] = await Promise.all([getDashboardPageData(), searchParams]);
  const savedMatchId = parseNumericId(String(resolvedSearchParams.savedGameId ?? ""));

  return (
    <AppShell activePath="/">
      <DashboardView games={matches} players={players} savedMatchId={savedMatchId} />
    </AppShell>
  );
}
