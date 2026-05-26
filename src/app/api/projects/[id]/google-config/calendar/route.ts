import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { createCalendar } from "@/lib/google-calendar/client";
import { getAuthenticatedClient } from "@/lib/google-calendar/oauth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

    const calendar = await createCalendar(auth, project.name);

    const config = await db.googleCalendarConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        calendarId: calendar.id,
        calendarSummary: calendar.summary,
      },
      update: {
        calendarId: calendar.id,
        calendarSummary: calendar.summary,
      },
    });

    return NextResponse.json({
      calendarId: config.calendarId,
      calendarSummary: config.calendarSummary,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
