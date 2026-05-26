import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { createOAuthState } from "@/lib/google-calendar/oauth-state";
import { getAuthorizationUrl } from "@/lib/google-calendar/oauth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId é obrigatório." },
        { status: 400 },
      );
    }

    const state = createOAuthState(projectId);
    const url = getAuthorizationUrl(state);

    return NextResponse.redirect(url);
  } catch (error) {
    return handleApiError(error);
  }
}
