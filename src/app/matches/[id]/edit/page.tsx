import { notFound } from "next/navigation";

import { AppShell } from "@/app/_components/app-shell";
import { EditMatchPageClient } from "@/app/_components/edit-match-page-client";
import { parseNumericId } from "@/lib/utils";

export default async function EditMatchPage({
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
      <EditMatchPageClient matchId={matchId} />
    </AppShell>
  );
}
