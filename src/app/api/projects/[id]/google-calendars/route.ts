export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { listCalendars } from "@/lib/google-calendar/client";
import { getAuthenticatedClient } from "@/lib/google-calendar/oauth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return jsonError("Projeto não encontrado.", 404);
    }
    if (project.type !== "MANUAL") {
      return jsonError("Disponível apenas para projetos manuais.", 400);
    }

    const auth = await getAuthenticatedClient();
    if (!auth) {
      return jsonError("Conta Google não conectada.", 400);
    }

    const calendars = await listCalendars(auth);
    return NextResponse.json(calendars);
  } catch (error) {
    return handleApiError(error);
  }
}
