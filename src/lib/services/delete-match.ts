import { deleteMatch } from "@/lib/commands/delete-match";

export async function deleteMatchById(id: number) {
  return deleteMatch(id);
}
