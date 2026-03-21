import { redirect } from "next/navigation";

export default async function GameDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  redirect(`/matches/${id}`);
}
