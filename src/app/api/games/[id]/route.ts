import type { GameUpsertRequest } from "@/lib/api/contracts";
import { handleApiError, jsonResponse } from "@/lib/server/api-response";
import { deleteGameService, getGameByIdService, upsertGameService } from "@/lib/server/diary-service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const game = await getGameByIdService(id);
    return jsonResponse(game);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as GameUpsertRequest;
    const response = await upsertGameService(payload, id);
    return jsonResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteGameService(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
