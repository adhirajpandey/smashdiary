"use client";

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className="shell">
      <div className="section-block glass page-stack">
        <p className="eyebrow">System fault</p>
        <h1 className="display" style={{ margin: 0, fontSize: "2rem" }}>
          Could not load your diary.
        </h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>{error.message}</p>
        <button className="primary-button" onClick={reset} type="button">
          Retry
        </button>
      </div>
    </main>
  );
}
