import { redirect } from "next/navigation";

export default async function NewGamePage() {
  redirect("/matches/new");
}
