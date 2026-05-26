import { NextResponse } from "next/server";
import { createProjectSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-utils";
import { createDefaultColumns } from "@/lib/services/board-service";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { tasks: true },
        },
        azureConfig: {
          select: {
            organization: true,
            adoProject: true,
            assignedToEmail: true,
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createProjectSchema.parse(body);

    const project = await db.project.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
      },
    });

    await createDefaultColumns(project.id, project.type);

    const fullProject = await db.project.findUnique({
      where: { id: project.id },
      include: {
        columns: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(fullProject, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
