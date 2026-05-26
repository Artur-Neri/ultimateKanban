import type { DashboardProjectGroup } from "@/lib/types";
import { buildProjectBoard } from "@/lib/services/board-service";
import { db } from "@/lib/db";

export async function buildDashboardView(): Promise<DashboardProjectGroup[]> {
  const projects = await db.project.findMany({
    orderBy: { name: "asc" },
  });

  const groups: DashboardProjectGroup[] = [];

  for (const project of projects) {
    const board = await buildProjectBoard(project.id);
    if (!board) {
      continue;
    }

    const doneColumnIds = new Set(
      board.columns.filter((column) => column.isDone).map((column) => column.id),
    );

    const cards = board.columns
      .flatMap((column) => column.cards)
      .filter(
        (card) =>
          !(card.source === "manual" && doneColumnIds.has(card.columnId)),
      );

    if (cards.length === 0) {
      continue;
    }

    const openCount = board.columns
      .filter((column) => !column.isDone)
      .flatMap((column) => column.cards).length;

    groups.push({
      project: {
        id: project.id,
        name: project.name,
        type: project.type,
      },
      cards,
      openCount,
    });
  }

  return groups;
}
