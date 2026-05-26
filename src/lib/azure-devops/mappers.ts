import type { AzureWorkItem, KanbanCard } from "@/lib/types";

export function mapAzureWorkItemToCard(
  workItem: AzureWorkItem,
  columnId: string,
  order: number,
): KanbanCard {
  return {
    id: `azure-${workItem.id}`,
    title: workItem.title,
    description: workItem.description,
    columnId,
    source: "azure",
    externalId: workItem.id,
    externalUrl: workItem.url,
    workItemType: workItem.workItemType,
    azureState: workItem.state,
    order,
  };
}

export function resolveColumnForAzureState(
  azureState: string,
  mappings: Array<{ azureState: string; columnId: string }>,
  fallbackColumnId: string,
): string {
  const mapping = mappings.find(
    (item) => item.azureState.toLowerCase() === azureState.toLowerCase(),
  );

  return mapping?.columnId ?? fallbackColumnId;
}
