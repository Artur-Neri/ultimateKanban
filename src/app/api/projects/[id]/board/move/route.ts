import { NextResponse } from "next/server";
import { moveCardSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  buildProjectBoard,
  moveAzureWorkItem,
  moveManualTask,
} from "@/lib/services/board-service";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;
    const body = await request.json();
    const data = moveCardSchema.parse(body);

    const column = await db.kanbanColumn.findFirst({
      where: { id: data.targetColumnId, projectId },
    });

    if (!column) {
      return jsonError("Coluna de destino inválida.", 400);
    }

    if (data.source === "manual") {
      const task = await db.task.findFirst({
        where: { id: data.cardId, projectId },
      });

      if (!task) {
        return jsonError("Tarefa não encontrada.", 404);
      }

      await moveManualTask(data.cardId, data.targetColumnId, data.order);
    } else {
      const workItemId = Number(data.cardId.replace(/^azure-/, ""));
      if (Number.isNaN(workItemId)) {
        return jsonError("Work item inválido.", 400);
      }

      await moveAzureWorkItem(projectId, workItemId, data.targetColumnId);
    }

    const board = await buildProjectBoard(projectId);
    return NextResponse.json(board);
  } catch (error) {
    return handleApiError(error);
  }
}
