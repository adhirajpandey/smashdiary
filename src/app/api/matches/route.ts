import { jsonServerError, jsonSuccess, jsonValidationError } from "@/lib/api/responses";
import { getMatchesData } from "@/lib/services/matches";
import { saveMatchFromJson } from "@/lib/services/save-match";
import { parseNumericId, parseStatsFormat } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = parseNumericId(String(searchParams.get("playerId") ?? ""));
    const format = parseStatsFormat(searchParams.get("format"));

    return jsonSuccess(await getMatchesData(playerId, format));
  } catch {
    return jsonServerError("Could not load matches.");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveMatchFromJson(body);

    switch (result.type) {
      case "success":
        return jsonSuccess({ id: result.id }, 201);
      case "validation_error":
        return jsonValidationError(result.errors.formError, result.errors.fieldErrors);
      case "internal_error":
        return jsonServerError(result.message);
      case "not_found":
        return jsonServerError("Could not save match. Please try again.");
    }
  } catch {
    return jsonValidationError("Invalid request payload.");
  }
}
