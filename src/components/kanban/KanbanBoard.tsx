"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { KanbanCard, ProjectBoardView } from "@/lib/types";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { KanbanCardItem } from "@/components/kanban/KanbanCardItem";

type KanbanBoardProps = {
  initialBoard: ProjectBoardView;
  projectId: string;
  onEditCard?: (card: KanbanCard) => void;
  onBoardChange?: (board: ProjectBoardView) => void;
};

function findCard(board: ProjectBoardView, cardId: string) {
  for (const column of board.columns) {
    const card = column.cards.find((item) => item.id === cardId);
    if (card) {
      return { card, columnId: column.id };
    }
  }
  return null;
}

export function KanbanBoard({
  initialBoard,
  projectId,
  onEditCard,
  onBoardChange,
}: KanbanBoardProps) {
  const router = useRouter();
  const [optimisticBoard, setOptimisticBoard] = useState<ProjectBoardView | null>(
    null,
  );
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const board = optimisticBoard ?? initialBoard;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const cardId = String(event.active.id);
    const found = findCard(board, cardId);
    setActiveCard(found?.card ?? null);
  }, [board]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveCard(null);

      const { active, over } = event;
      if (!over) {
        return;
      }

      const cardId = String(active.id);
      const found = findCard(board, cardId);
      if (!found) {
        return;
      }

      let targetColumnId = found.columnId;
      const overData = over.data.current;

      if (overData?.type === "column") {
        targetColumnId = String(over.id);
      } else if (overData?.type === "card") {
        const overCard = findCard(board, String(over.id));
        if (overCard) {
          targetColumnId = overCard.columnId;
        }
      }

      if (targetColumnId === found.columnId) {
        return;
      }

      const nextOptimisticBoard: ProjectBoardView = {
        ...board,
        columns: board.columns.map((column) => {
          if (column.id === found.columnId) {
            return {
              ...column,
              cards: column.cards.filter((card) => card.id !== cardId),
            };
          }

          if (column.id === targetColumnId) {
            return {
              ...column,
              cards: [
                ...column.cards,
                { ...found.card, columnId: targetColumnId },
              ],
            };
          }

          return column;
        }),
      };

      setOptimisticBoard(nextOptimisticBoard);
      setIsMoving(true);

      try {
        const response = await fetch(`/api/projects/${projectId}/board/move`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId,
            source: found.card.source,
            targetColumnId,
          }),
        });

        if (!response.ok) {
          throw new Error("Falha ao mover card.");
        }

        const updatedBoard = (await response.json()) as ProjectBoardView;
        setOptimisticBoard(null);
        onBoardChange?.(updatedBoard);
        router.refresh();
      } catch {
        setOptimisticBoard(null);
      } finally {
        setIsMoving(false);
      }
    },
    [board, onBoardChange, projectId, router],
  );

  return (
    <div className="relative">
      {isMoving ? (
        <div className="absolute right-0 top-0 z-10 rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
          Sincronizando...
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:gap-4 sm:px-0">
          {board.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onEditCard={onEditCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-[min(100%,18.75rem)] sm:w-80">
              <KanbanCardItem card={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
