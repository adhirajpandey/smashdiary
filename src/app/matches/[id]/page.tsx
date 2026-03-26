import { notFound } from "next/navigation";

import { AppShell } from "@/app/_components/app-shell";
import { MatchDetailPageClient } from "@/app/_components/match-detail-page-client";
import { parseNumericId } from "@/lib/utils";

export default async function MatchDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const matchId = parseNumericId(id);

  if (!matchId) {
    notFound();
  }

  return (
    <AppShell activePath="">
      <MatchDetailPageClient matchId={matchId} />
    </AppShell>
  );
}
