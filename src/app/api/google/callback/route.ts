import { NextResponse } from "next/server";
import { verifyOAuthState } from "@/lib/google-calendar/oauth-state";
import { exchangeCodeForTokens } from "@/lib/google-calendar/oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/projects?google_error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/projects?google_error=missing_params", request.url),
    );
  }

  try {
    const projectId = verifyOAuthState(state);
    await exchangeCodeForTokens(code);

    return NextResponse.redirect(
      new URL(`/projects/${projectId}/settings?google_connected=1`, request.url),
    );
  } catch (callbackError) {
    const message =
      callbackError instanceof Error
        ? callbackError.message
        : "Erro ao conectar Google.";
    return NextResponse.redirect(
      new URL(
        `/projects?google_error=${encodeURIComponent(message)}`,
        request.url,
      ),
    );
  }
}
