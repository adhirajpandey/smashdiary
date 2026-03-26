import { AppShell } from "@/app/_components/app-shell";
import { MatchDetailView } from "@/app/_components/match-detail-view";

export default async function MatchDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return (
    <AppShell activePath="">
      <MatchDetailView id={id} />
    </AppShell>
  );
}
