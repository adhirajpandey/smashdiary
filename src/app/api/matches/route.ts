import { jsonServerError, jsonSuccess, jsonValidationError } from "@/lib/api/responses";
import { getMatchesData } from "@/lib/services/matches";
import { saveMatchFromJson } from "@/lib/services/save-match";
import { parseNumericId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = parseNumericId(String(searchParams.get("playerId") ?? ""));

    return jsonSuccess(await getMatchesData(playerId));
  } catch {
    return jsonServerError("Could not load matches.");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveMatchFromJson(body);

    if (!result.ok) {
      return jsonValidationError(result.errors.formError, result.errors.fieldErrors);
    }

    return jsonSuccess({ id: result.id }, 201);
  } catch {
    return jsonValidationError("Invalid request payload.");
  }
}
