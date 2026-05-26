import { NextResponse } from "next/server";
import { createTaskSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const tasks = await db.task.findMany({
      where: { projectId: id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;
    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return jsonError("Projeto não encontrado.", 404);
    }

    if (project.type !== "MANUAL") {
      return jsonError("Tarefas manuais só podem ser criadas em projetos manuais.", 400);
    }

    const column = await db.kanbanColumn.findFirst({
      where: { id: data.columnId, projectId },
    });

    if (!column) {
      return jsonError("Coluna inválida para este projeto.", 400);
    }

    const order = await db.task.count({
      where: { columnId: data.columnId },
    });

    const task = await db.task.create({
      data: {
        projectId,
        columnId: data.columnId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        order,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
