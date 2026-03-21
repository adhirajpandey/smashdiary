import { redirect } from "next/navigation";

export default async function EditGamePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  redirect(`/matches/${id}`);
}
