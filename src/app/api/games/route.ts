import type { GameUpsertRequest } from "@/lib/api/contracts";
import { handleApiError, jsonResponse } from "@/lib/server/api-response";
import { listGamesService, upsertGameService } from "@/lib/server/diary-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId") ?? undefined;
    const rawLimit = searchParams.get("limit");
    const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
    const games = await listGamesService(playerId, Number.isFinite(limit) ? limit : undefined);
    return jsonResponse(games);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GameUpsertRequest;
    const response = await upsertGameService(payload);
    return jsonResponse(response, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
