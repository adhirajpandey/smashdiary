import { jsonNotFound, jsonServerError, jsonSuccess, jsonValidationError } from "@/lib/api/responses";
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
  } catch {
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

    if (!result.ok) {
      return jsonValidationError(result.errors.formError, result.errors.fieldErrors);
    }

    return jsonSuccess({ id: result.id });
  } catch {
    return jsonValidationError("Invalid request payload.");
  }
}
