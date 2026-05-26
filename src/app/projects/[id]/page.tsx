export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectBoardClient } from "@/components/kanban/ProjectBoardClient";
import { buildProjectBoard } from "@/lib/services/board-service";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const board = await buildProjectBoard(id);

  if (!board) {
    notFound();
  }

  return (
    <AppShell>
      <ProjectBoardClient board={board} />
    </AppShell>
  );
}
