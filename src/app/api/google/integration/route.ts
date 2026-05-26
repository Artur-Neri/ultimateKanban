export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { disconnectGoogleIntegration } from "@/lib/google-calendar/oauth";

export async function DELETE() {
  try {
    await disconnectGoogleIntegration();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
