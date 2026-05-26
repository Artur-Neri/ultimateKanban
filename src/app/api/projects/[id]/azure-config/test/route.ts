import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { AzureDevOpsClient } from "@/lib/azure-devops/client";
import { decryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const testBodySchema = z.object({
  organization: z.string().min(1),
  adoProject: z.string().min(1),
  assignedToEmail: z.string().email(),
  pat: z.string().min(1).optional(),
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;
    const body = await request.json();
    const data = testBodySchema.parse(body);

    const savedConfig = await db.azureDevOpsConfig.findUnique({
      where: { projectId },
    });

    const pat =
      data.pat ??
      (savedConfig ? decryptSecret(savedConfig.encryptedPat) : null);

    if (!pat) {
      return jsonError("Informe o PAT para testar a conexão.", 400);
    }

    const client = new AzureDevOpsClient({
      organization: data.organization,
      pat,
    });

    const projectName = await client.validateConnection(data.adoProject);
    const workItems = await client.getAssignedWorkItems(
      projectName,
      data.assignedToEmail,
    );

    return NextResponse.json({
      success: true,
      workItemCount: workItems.length,
      sampleTitles: workItems.slice(0, 5).map((item) => item.title),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
