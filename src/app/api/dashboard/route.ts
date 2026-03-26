import { jsonServerError, jsonSuccess } from "@/lib/api/responses";
import { getDashboardData } from "@/lib/services/dashboard";
import { parseNumericId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = parseNumericId(String(searchParams.get("playerId") ?? ""));

    return jsonSuccess(await getDashboardData(playerId));
  } catch {
    return jsonServerError("Could not load dashboard.");
  }
}
