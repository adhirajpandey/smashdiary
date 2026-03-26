import { jsonServerError, jsonSuccess } from "@/lib/api/responses";
import { getStatsData } from "@/lib/services/stats";
import { parseNumericId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = parseNumericId(String(searchParams.get("playerId") ?? ""));

    return jsonSuccess(await getStatsData(playerId));
  } catch {
    return jsonServerError("Could not load stats.");
  }
}
