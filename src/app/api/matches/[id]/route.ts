import { deleteMatchById } from "@/lib/services/delete-match";
import { jsonNotFound, jsonServerError, jsonSuccess, jsonValidationError, logRouteError, logRouteWarning } from "@/lib/api/responses";
import { getMatchDetailData } from "@/lib/services/matches";
import { saveMatchFromJson } from "@/lib/services/save-match";
import { parseNumericId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id } = await params;
  const matchId = parseNumericId(id);

  if (!matchId) {
    return jsonNotFound("Match not found.");
  }

  try {
    const data = await getMatchDetailData(matchId);
    return data ? jsonSuccess(data) : jsonNotFound("Match not found.");
  } catch (error) {
    logRouteError("GET /api/matches/[id]", error);
    return jsonServerError("Could not load match.");
  }
}

export async function PUT(
  request: Request,
  { params }: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id } = await params;
  const matchId = parseNumericId(id);

  if (!matchId) {
    return jsonNotFound("Match not found.");
  }

  try {
    const body = await request.json();
    const result = await saveMatchFromJson(body, matchId);

    switch (result.type) {
      case "success":
        return jsonSuccess({ id: result.id });
      case "validation_error":
        return jsonValidationError(result.errors.formError, result.errors.fieldErrors);
      case "not_found":
        return jsonNotFound(result.message);
      case "internal_error":
        return jsonServerError(result.message);
    }
  } catch (error) {
    logRouteWarning("PUT /api/matches/[id]", error);
    return jsonValidationError("Invalid request payload.");
  }
}

export async function DELETE(
  _: Request,
  { params }: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id } = await params;
  const matchId = parseNumericId(id);

  if (!matchId) {
    return jsonNotFound("Match not found.");
  }

  try {
    const deleted = await deleteMatchById(matchId);
    return deleted ? jsonSuccess({ id: matchId }) : jsonNotFound("Match not found.");
  } catch (error) {
    logRouteError("DELETE /api/matches/[id]", error);
    return jsonServerError("Could not delete match.");
  }
}
