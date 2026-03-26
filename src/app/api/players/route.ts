import { jsonServerError, jsonSuccess } from "@/lib/api/responses";
import { getPlayersData } from "@/lib/services/players";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonSuccess(await getPlayersData());
  } catch {
    return jsonServerError("Could not load players.");
  }
}
