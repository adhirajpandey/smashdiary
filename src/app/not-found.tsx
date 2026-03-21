import Link from "next/link";

import { AppShell } from "@/app/_components/app-shell";
import { StatusView } from "@/app/_components/status-view";

export default function NotFound() {
  return (
    <AppShell activePath="">
      <StatusView
        eyebrow="404"
        title="This court is empty"
        description="That page does not exist or the match record could not be found."
        action={
          <Link className="primary-button" href="/">
            Back to dashboard
          </Link>
        }
      />
    </AppShell>
  );
}
