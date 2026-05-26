import type { Task } from "@prisma/client";
import {
  deleteEvent,
  insertEvent,
  updateEvent,
} from "@/lib/google-calendar/client";
import { getAuthenticatedClient } from "@/lib/google-calendar/oauth";
import { db } from "@/lib/db";

function buildEventDescription(
  task: Pick<Task, "description" | "projectId" | "id">,
): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const boardUrl = `${baseUrl}/projects/${task.projectId}`;
  const parts: string[] = [];

  if (task.description?.trim()) {
    parts.push(task.description.trim());
  }

  parts.push(`Tarefa no Ultimate Kanban: ${boardUrl}`);
  return parts.join("\n\n");
}

export type CalendarSyncResult = {
  googleEventId: string | null;
  warning?: string;
};

export async function syncTaskWithGoogleCalendar(
  task: Task,
): Promise<CalendarSyncResult> {
  const config = await db.googleCalendarConfig.findUnique({
    where: { projectId: task.projectId },
  });

  if (!config) {
    return { googleEventId: task.googleEventId };
  }

  const auth = await getAuthenticatedClient();
  if (!auth) {
    return {
      googleEventId: task.googleEventId,
      warning: "Conta Google não conectada.",
    };
  }

  const eventInput = {
    title: task.title,
    description: buildEventDescription(task),
    dueDate: task.dueDate!,
  };

  try {
    if (task.dueDate && !task.googleEventId) {
      const eventId = await insertEvent(auth, config.calendarId, eventInput);
      await db.task.update({
        where: { id: task.id },
        data: { googleEventId: eventId },
      });
      return { googleEventId: eventId };
    }

    if (task.dueDate && task.googleEventId) {
      await updateEvent(
        auth,
        config.calendarId,
        task.googleEventId,
        eventInput,
      );
      return { googleEventId: task.googleEventId };
    }

    if (!task.dueDate && task.googleEventId) {
      await deleteEvent(auth, config.calendarId, task.googleEventId);
      await db.task.update({
        where: { id: task.id },
        data: { googleEventId: null },
      });
      return { googleEventId: null };
    }

    return { googleEventId: task.googleEventId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao sincronizar com Google Calendar.";
    return {
      googleEventId: task.googleEventId,
      warning: message,
    };
  }
}

export async function deleteTaskGoogleEvent(
  task: Pick<Task, "projectId" | "googleEventId">,
): Promise<string | undefined> {
  if (!task.googleEventId) {
    return undefined;
  }

  const config = await db.googleCalendarConfig.findUnique({
    where: { projectId: task.projectId },
  });

  if (!config) {
    return undefined;
  }

  const auth = await getAuthenticatedClient();
  if (!auth) {
    return "Conta Google não conectada. O evento pode permanecer na agenda.";
  }

  try {
    await deleteEvent(auth, config.calendarId, task.googleEventId);
    return undefined;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Erro ao excluir evento no Google Calendar.";
  }
}
