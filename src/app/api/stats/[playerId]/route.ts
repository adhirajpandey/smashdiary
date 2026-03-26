import { jsonServerError, jsonSuccess } from "@/lib/api/responses";
import { getStatsData } from "@/lib/services/stats";
import { parseNumericId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: Readonly<{ params: Promise<{ playerId: string }> }>,
) {
  try {
    const { playerId } = await params;
    return jsonSuccess(await getStatsData(parseNumericId(playerId)));
  } catch {
    return jsonServerError("Could not load stats.");
  }
}
