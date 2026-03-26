import { AppShell } from "@/app/_components/app-shell";
import { GameForm } from "@/app/_components/game-form";

export default function NewMatchPage() {
  return (
    <AppShell activePath="">
      <GameForm />
    </AppShell>
  );
}
