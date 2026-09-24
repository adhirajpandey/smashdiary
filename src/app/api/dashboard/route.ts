import { jsonServerError, jsonSuccess, logRouteError } from "@/lib/api/responses";
import { getDashboardData } from "@/lib/services/dashboard";
import { parseNumericId, parseStatsFormat } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = parseNumericId(String(searchParams.get("playerId") ?? ""));
    const format = parseStatsFormat(searchParams.get("format"));

    return jsonSuccess(await getDashboardData(playerId, format));
  } catch (error) {
    logRouteError("GET /api/dashboard", error);
    return jsonServerError("Could not load dashboard.");
  }
}
