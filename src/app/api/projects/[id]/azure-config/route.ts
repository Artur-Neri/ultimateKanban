import { NextResponse } from "next/server";
import { azureConfigSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { AzureDevOpsClient } from "@/lib/azure-devops/client";
import { createAzureStatusMappings } from "@/lib/services/board-service";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const config = await db.azureDevOpsConfig.findUnique({
      where: { projectId: id },
      select: {
        id: true,
        organization: true,
        adoProject: true,
        assignedToEmail: true,
        updatedAt: true,
        statusMappings: {
          include: {
            column: true,
          },
        },
      },
    });

    return NextResponse.json(
      config ?? {
        organization: "",
        adoProject: "",
        assignedToEmail: "",
        statusMappings: [],
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;
    const body = await request.json();
    const data = azureConfigSchema.parse(body);

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { azureConfig: true },
    });

    if (!project) {
      return jsonError("Projeto não encontrado.", 404);
    }

    if (project.type !== "AZURE_DEVOPS") {
      return jsonError("Este projeto não é do tipo Azure DevOps.", 400);
    }

    const existingPat = project.azureConfig?.encryptedPat;
    const resolvedPat = data.pat ?? (existingPat ? decryptSecret(existingPat) : null);

    if (!resolvedPat) {
      return jsonError("PAT é obrigatório na primeira configuração.", 400);
    }

    const client = new AzureDevOpsClient({
      organization: data.organization,
      pat: resolvedPat,
    });

    const resolvedProjectName = await client.validateConnection(data.adoProject);

    const encryptedPat = encryptSecret(resolvedPat);

    const config = await db.azureDevOpsConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        organization: data.organization.trim(),
        adoProject: resolvedProjectName,
        assignedToEmail: data.assignedToEmail.trim(),
        encryptedPat,
      },
      update: {
        organization: data.organization.trim(),
        adoProject: resolvedProjectName,
        assignedToEmail: data.assignedToEmail.trim(),
        encryptedPat,
      },
    });

    const mappingCount = await db.taskStatusMapping.count({
      where: { configId: config.id },
    });

    if (mappingCount === 0) {
      await createAzureStatusMappings(projectId, config.id);
    }

    return NextResponse.json({
      id: config.id,
      organization: config.organization,
      adoProject: config.adoProject,
      assignedToEmail: config.assignedToEmail,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
