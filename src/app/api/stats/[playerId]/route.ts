import { handleApiError, jsonResponse } from "@/lib/server/api-response";
import { getPlayerStatsService } from "@/lib/server/diary-service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> },
) {
  try {
    const { playerId } = await params;
    const payload = await getPlayerStatsService(playerId);
    return jsonResponse(payload);
  } catch (error) {
    return handleApiError(error);
  }
}
