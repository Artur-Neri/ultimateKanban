import { ProjectType, TaskPriority } from "@prisma/client";
import type { KanbanCard, ProjectBoardView } from "@/lib/types";
import {
  mapAzureWorkItemToCard,
  resolveColumnForAzureState,
} from "@/lib/azure-devops/mappers";
import { AzureDevOpsClient } from "@/lib/azure-devops/client";
import {
  AZURE_DEFAULT_COLUMNS,
  MANUAL_DEFAULT_COLUMNS,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { decryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";

type ProjectWithRelations = NonNullable<
  Awaited<ReturnType<typeof getProjectWithRelations>>
>;

async function getProjectWithRelations(projectId: string) {
  return db.project.findUnique({
    where: { id: projectId },
    include: {
      columns: {
        orderBy: { order: "asc" },
      },
      tasks: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
      azureConfig: {
        include: {
          statusMappings: true,
        },
      },
    },
  });
}

function mapManualTaskToCard(
  task: ProjectWithRelations["tasks"][number],
): KanbanCard {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    columnId: task.columnId,
    source: "manual",
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() ?? null,
    order: task.order,
  };
}

export async function buildProjectBoard(
  projectId: string,
): Promise<ProjectBoardView | null> {
  const project = await getProjectWithRelations(projectId);

  if (!project) {
    return null;
  }

  const columns = project.columns.map((column) => ({
    id: column.id,
    name: column.name,
    order: column.order,
    isDone: column.isDone,
    cards: [] as KanbanCard[],
  }));

  const columnById = new Map(columns.map((column) => [column.id, column]));
  const firstColumnId = columns[0]?.id;

  if (project.type === ProjectType.MANUAL) {
    for (const task of project.tasks) {
      const column = columnById.get(task.columnId) ?? columns[0];
      column?.cards.push(mapManualTaskToCard(task));
    }
  } else if (project.azureConfig && firstColumnId) {
    const client = new AzureDevOpsClient({
      organization: project.azureConfig.organization,
      pat: decryptSecret(project.azureConfig.encryptedPat),
    });

    const workItems = await client.getAssignedWorkItems(
      project.azureConfig.adoProject,
      project.azureConfig.assignedToEmail,
    );

    workItems.forEach((workItem, index) => {
      const columnId = resolveColumnForAzureState(
        workItem.state,
        project.azureConfig!.statusMappings,
        firstColumnId,
      );
      const column = columnById.get(columnId) ?? columns[0];
      column?.cards.push(mapAzureWorkItemToCard(workItem, columnId, index));
    });
  }

  for (const column of columns) {
    column.cards.sort((a, b) => a.order - b.order);
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
    },
    columns,
  };
}

export async function createDefaultColumns(
  projectId: string,
  type: ProjectType,
) {
  if (type === ProjectType.MANUAL) {
    await db.kanbanColumn.createMany({
      data: MANUAL_DEFAULT_COLUMNS.map((column) => ({
        projectId,
        name: column.name,
        order: column.order,
        isDone: column.isDone,
      })),
    });
    return;
  }

  for (const column of AZURE_DEFAULT_COLUMNS) {
    await db.kanbanColumn.create({
      data: {
        projectId,
        name: column.name,
        order: column.order,
        isDone: column.isDone,
      },
    });
  }
}

export async function createAzureStatusMappings(
  projectId: string,
  configId: string,
) {
  const columns = await db.kanbanColumn.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });

  for (const columnDef of AZURE_DEFAULT_COLUMNS) {
    const column = columns.find((item) => item.name === columnDef.name);
    if (!column) {
      continue;
    }

    await db.taskStatusMapping.create({
      data: {
        configId,
        columnId: column.id,
        azureState: columnDef.azureState,
      },
    });
  }
}

export async function moveManualTask(
  taskId: string,
  targetColumnId: string,
  order?: number,
) {
  const tasksInColumn = await db.task.count({
    where: { columnId: targetColumnId },
  });

  return db.task.update({
    where: { id: taskId },
    data: {
      columnId: targetColumnId,
      order: order ?? tasksInColumn,
    },
  });
}

export async function moveAzureWorkItem(
  projectId: string,
  workItemId: number,
  targetColumnId: string,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      azureConfig: {
        include: {
          statusMappings: true,
        },
      },
    },
  });

  if (!project?.azureConfig) {
    throw new Error("Projeto Azure DevOps não configurado.");
  }

  const mapping = project.azureConfig.statusMappings.find(
    (item) => item.columnId === targetColumnId,
  );

  if (!mapping) {
    throw new Error("Coluna de destino não possui mapeamento Azure.");
  }

  const client = new AzureDevOpsClient({
    organization: project.azureConfig.organization,
    pat: decryptSecret(project.azureConfig.encryptedPat),
  });

  await client.updateWorkItemState(workItemId, mapping.azureState);
}

export function getPriorityLabel(priority: TaskPriority): string {
  return PRIORITY_LABELS[priority];
}
