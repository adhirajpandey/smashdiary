import { jsonServerError, jsonSuccess, logRouteError } from "@/lib/api/responses";
import { getStatsData } from "@/lib/services/stats";
import { parseNumericId, parseStatsFormat } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = parseNumericId(String(searchParams.get("playerId") ?? ""));
    const format = parseStatsFormat(searchParams.get("format"));

    return jsonSuccess(await getStatsData(playerId, format));
  } catch (error) {
    logRouteError("GET /api/stats", error);
    return jsonServerError("Could not load stats.");
  }
}
