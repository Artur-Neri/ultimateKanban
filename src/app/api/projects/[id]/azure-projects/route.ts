import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { AzureDevOpsClient } from "@/lib/azure-devops/client";
import { decryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const config = await db.azureDevOpsConfig.findUnique({
      where: { projectId: id },
    });

    if (!config) {
      return jsonError("Configure a integração Azure DevOps primeiro.", 400);
    }

    const client = new AzureDevOpsClient({
      organization: config.organization,
      pat: decryptSecret(config.encryptedPat),
    });

    const projects = await client.listProjects();
    return NextResponse.json(projects);
  } catch (error) {
    return handleApiError(error);
  }
}
