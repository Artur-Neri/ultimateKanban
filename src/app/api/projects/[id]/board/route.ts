import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { buildProjectBoard } from "@/lib/services/board-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const board = await buildProjectBoard(id);

    if (!board) {
      return jsonError("Projeto não encontrado.", 404);
    }

    return NextResponse.json(board);
  } catch (error) {
    return handleApiError(error);
  }
}
