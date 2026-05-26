import { NextResponse } from "next/server";
import { updateTaskSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  deleteTaskGoogleEvent,
  syncTaskWithGoogleCalendar,
} from "@/lib/services/calendar-sync-service";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = updateTaskSchema.parse(body);

    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("Tarefa não encontrada.", 404);
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...data,
        dueDate:
          data.dueDate === undefined
            ? undefined
            : data.dueDate
              ? new Date(data.dueDate)
              : null,
      },
    });

    const syncResult = await syncTaskWithGoogleCalendar(task);
    const refreshed = await db.task.findUnique({ where: { id: task.id } });

    return NextResponse.json({
      ...(refreshed ?? task),
      calendarSyncWarning: syncResult.warning,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("Tarefa não encontrada.", 404);
    }

    const calendarSyncWarning = await deleteTaskGoogleEvent(existing);
    await db.task.delete({ where: { id } });

    return NextResponse.json({ success: true, calendarSyncWarning });
  } catch (error) {
    return handleApiError(error);
  }
}
