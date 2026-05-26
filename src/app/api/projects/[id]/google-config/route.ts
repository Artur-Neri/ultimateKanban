export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { googleCalendarConfigSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  getGoogleAccountEmail,
  isGoogleConnected,
} from "@/lib/google-calendar/oauth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getManualProject(projectId: string) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return { error: jsonError("Projeto não encontrado.", 404) };
  }
  if (project.type !== "MANUAL") {
    return {
      error: jsonError(
        "Google Calendar só está disponível para projetos manuais.",
        400,
      ),
    };
  }
  return { project };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await getManualProject(id);
    if ("error" in result && result.error) {
      return result.error;
    }

    const [connected, accountEmail, config] = await Promise.all([
      isGoogleConnected(),
      getGoogleAccountEmail(),
      db.googleCalendarConfig.findUnique({ where: { projectId: id } }),
    ]);

    return NextResponse.json({
      connected,
      accountEmail,
      calendarId: config?.calendarId ?? null,
      calendarSummary: config?.calendarSummary ?? null,
      updatedAt: config?.updatedAt ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;
    const result = await getManualProject(projectId);
    if ("error" in result && result.error) {
      return result.error;
    }

    const connected = await isGoogleConnected();
    if (!connected) {
      return jsonError("Conecte sua conta Google antes de vincular uma agenda.", 400);
    }

    const body = await request.json();
    const data = googleCalendarConfigSchema.parse(body);

    const config = await db.googleCalendarConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        calendarId: data.calendarId,
        calendarSummary: data.calendarSummary,
      },
      update: {
        calendarId: data.calendarId,
        calendarSummary: data.calendarSummary,
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

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;
    const result = await getManualProject(projectId);
    if ("error" in result && result.error) {
      return result.error;
    }

    await db.googleCalendarConfig.deleteMany({ where: { projectId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
