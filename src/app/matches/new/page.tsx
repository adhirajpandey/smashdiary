import { AppShell } from "@/app/_components/app-shell";
import { NewMatchPageClient } from "@/app/_components/new-match-page-client";

export default function NewMatchPage() {
  return (
    <AppShell activePath="">
      <NewMatchPageClient />
    </AppShell>
  );
}
