import { listPlayersService } from "@/lib/server/diary-service";
import { handleApiError, jsonResponse } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const players = await listPlayersService();
    return jsonResponse(players);
  } catch (error) {
    return handleApiError(error);
  }
}
