import { AppShell } from "@/app/_components/app-shell";
import { MatchEditView } from "@/app/_components/match-edit-view";

export default async function MatchEditPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return (
    <AppShell activePath="">
      <MatchEditView id={id} />
    </AppShell>
  );
}
