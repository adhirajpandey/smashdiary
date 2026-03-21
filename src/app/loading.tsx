import { AppShell } from "@/app/_components/app-shell";
import { StatusView } from "@/app/_components/status-view";

export default function Loading() {
  return (
    <AppShell activePath="">
      <StatusView
        eyebrow="Loading"
        title="Loading Smash Diary"
        description="Pulling your recent matches and player context."
      />
    </AppShell>
  );
}
