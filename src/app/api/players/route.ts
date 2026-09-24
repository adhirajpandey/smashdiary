import { jsonServerError, jsonSuccess, logRouteError } from "@/lib/api/responses";
import { getPlayersData } from "@/lib/services/players";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonSuccess(await getPlayersData());
  } catch (error) {
    logRouteError("GET /api/players", error);
    return jsonServerError("Could not load players.");
  }
}
