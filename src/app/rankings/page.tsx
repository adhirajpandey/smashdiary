import { redirect } from "next/navigation";

import { appRoutes } from "@/lib/config/routes";

export default function RankingsPage() {
  redirect(appRoutes.stats);
}
