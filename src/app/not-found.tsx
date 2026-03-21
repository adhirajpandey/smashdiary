import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <div className="section-block glass page-stack">
        <p className="eyebrow">404</p>
        <h1 className="display" style={{ margin: 0, fontSize: "2rem" }}>
          This court is empty.
        </h1>
        <Link className="primary-button" href="/">
          Back to home
        </Link>
      </div>
    </main>
  );
}
