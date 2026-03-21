"use client";

import { AppShell } from "@/app/_components/app-shell";
import { StatusView } from "@/app/_components/status-view";

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <AppShell activePath="">
      <StatusView
        eyebrow="System fault"
        title="Could not load your diary"
        description={error.message}
        action={
          <button className="primary-button" onClick={reset} type="button">
            Retry
          </button>
        }
      />
    </AppShell>
  );
}
