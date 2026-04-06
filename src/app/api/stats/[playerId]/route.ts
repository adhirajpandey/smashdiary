import { jsonServerError, jsonSuccess } from "@/lib/api/responses";
import { getStatsData } from "@/lib/services/stats";
import { parseNumericId, parseStatsFormat } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: Readonly<{ params: Promise<{ playerId: string }> }>,
) {
  try {
    const { playerId } = await params;
    const { searchParams } = new URL(request.url);
    const format = parseStatsFormat(searchParams.get("format"));
    return jsonSuccess(await getStatsData(parseNumericId(playerId), format));
  } catch {
    return jsonServerError("Could not load stats.");
  }
}
