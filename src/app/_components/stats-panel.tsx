import type { StatsSummary } from "@/lib/types";

function StatTile({
  label,
  value,
  accent,
}: Readonly<{
  label: string;
  value: string | number;
  accent?: string;
}>) {
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "1.25rem",
        background: "linear-gradient(180deg, rgba(32,32,31,0.94), rgba(23,23,23,0.94))",
      }}
    >
      <p className="section-title" style={{ marginBottom: "0.45rem" }}>
        {label}
      </p>
      <p className="display" style={{ margin: 0, fontSize: "2rem", color: accent }}>
        {value}
      </p>
    </div>
  );
}

export function StatsPanel({ stats }: Readonly<{ stats: StatsSummary }>) {
  return (
    <section className="page-stack">
      <div className="section-block glass page-stack">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>
            Form line
          </p>
          <h2 className="display" style={{ margin: "0.25rem 0 0", fontSize: "2.2rem" }}>
            Your court pulse.
          </h2>
        </div>

        <div style={{ display: "grid", gap: "0.85rem", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          <StatTile label="Total matches" value={stats.totalGames} />
          <StatTile label="Wins" value={stats.wins} accent="var(--primary-deep)" />
          <StatTile label="Losses" value={stats.losses} accent="var(--secondary)" />
          <StatTile label="Singles" value={stats.singlesGames} />
          <StatTile label="Doubles" value={stats.doublesGames} />
        </div>
      </div>

      <section className="section-block page-stack">
        <p className="section-title" style={{ margin: 0 }}>
          Recent form
        </p>
        <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
          {stats.recentForm.length ? (
            stats.recentForm.map((result, index) => (
              <div
                key={`${result}-${index}`}
                style={{
                  minWidth: "3rem",
                  padding: "0.95rem 0.85rem",
                  borderRadius: "999px",
                  textAlign: "center",
                  background:
                    result === "W"
                      ? "linear-gradient(45deg, rgba(243,255,202,0.95), rgba(202,253,0,0.92))"
                      : "linear-gradient(45deg, rgba(125,152,255,0.95), rgba(0,77,234,0.92))",
                  color: result === "W" ? "var(--on-primary)" : "white",
                  fontWeight: 800,
                }}
              >
                {result}
              </div>
            ))
          ) : (
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>No recent matches yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
