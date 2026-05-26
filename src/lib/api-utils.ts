import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AzureDevOpsError } from "@/lib/azure-devops/client";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(error.issues[0]?.message ?? "Dados inválidos.", 400);
  }

  if (error instanceof AzureDevOpsError) {
    return jsonError(
      `Azure DevOps: ${error.message}`,
      error.status >= 400 && error.status < 600 ? error.status : 502,
    );
  }

  if (error instanceof Error) {
    return jsonError(error.message, 500);
  }

  return jsonError("Erro interno do servidor.", 500);
}
