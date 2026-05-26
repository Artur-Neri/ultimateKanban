import { NextResponse } from "next/server";
import { updateProjectSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const project = await db.project.findUnique({
      where: { id },
      include: {
        columns: { orderBy: { order: "asc" } },
        azureConfig: {
          select: {
            id: true,
            organization: true,
            adoProject: true,
            assignedToEmail: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!project) {
      return jsonError("Projeto não encontrado.", 404);
    }

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    const project = await db.project.update({
      where: { id },
      data,
    });

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await db.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
