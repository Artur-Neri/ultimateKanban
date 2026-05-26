"use client";

import { useState } from "react";
import Link from "next/link";
import type { KanbanCard, ProjectBoardView } from "@/lib/types";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskFormModal } from "@/components/kanban/TaskFormModal";
import { Badge } from "@/components/ui/Badge";
import { Plus, Settings2 } from "lucide-react";

type ProjectBoardClientProps = {
  board: ProjectBoardView;
};

export function ProjectBoardClient({ board }: ProjectBoardClientProps) {
  const [selectedTask, setSelectedTask] = useState<KanbanCard | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isManual = board.project.type === "MANUAL";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-slate-900">
              {board.project.name}
            </h1>
            <Badge variant={isManual ? "manual" : "azure"}>
              {isManual ? "Manual" : "Azure DevOps"}
            </Badge>
          </div>
          {board.project.description ? (
            <p className="mt-2 text-sm text-slate-500">
              {board.project.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {!isManual ? (
            <Link
              href={`/projects/${board.project.id}/settings`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
            >
              <Settings2 className="h-4 w-4" />
              Configuração Azure
            </Link>
          ) : (
            <>
              <Link
                href={`/projects/${board.project.id}/settings`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
              >
                <Settings2 className="h-4 w-4" />
                Google Calendar
              </Link>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nova tarefa
              </button>
            </>
          )}
        </div>
      </div>

      <KanbanBoard
        initialBoard={board}
        projectId={board.project.id}
        onEditCard={(card) => {
          if (card.source === "manual") {
            setSelectedTask(card);
          }
        }}
      />

      {showCreateModal ? (
        <TaskFormModal
          projectId={board.project.id}
          columns={board.columns.map((column) => ({
            id: column.id,
            name: column.name,
          }))}
          onClose={() => setShowCreateModal(false)}
        />
      ) : null}

      {selectedTask ? (
        <TaskFormModal
          projectId={board.project.id}
          columns={board.columns.map((column) => ({
            id: column.id,
            name: column.name,
          }))}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      ) : null}
    </div>
  );
}
