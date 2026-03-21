import { AppShell } from "@/app/_components/app-shell";

export default function RankingsPage() {
  return (
    <AppShell activePath="/stats">
      <section className="section-block glass page-stack" style={{ padding: "1.25rem" }}>
        <p className="eyebrow" style={{ margin: 0 }}>
          Stats
        </p>
        <h1 className="display" style={{ margin: "0.25rem 0 0", fontSize: "2rem" }}>
          Under Development
        </h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Match stats and deeper breakdowns will land here once the next analytics pass is ready.
        </p>
      </section>
    </AppShell>
  );
}
