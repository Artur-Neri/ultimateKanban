export type KanbanCardSource = "manual" | "azure";

export type KanbanCard = {
  id: string;
  title: string;
  description?: string | null;
  columnId: string;
  source: KanbanCardSource;
  priority?: string;
  dueDate?: string | null;
  externalId?: number;
  externalUrl?: string;
  workItemType?: string;
  azureState?: string;
  order: number;
};

export type KanbanColumnView = {
  id: string;
  name: string;
  order: number;
  isDone: boolean;
  cards: KanbanCard[];
};

export type ProjectBoardView = {
  project: {
    id: string;
    name: string;
    description?: string | null;
    type: "MANUAL" | "AZURE_DEVOPS";
  };
  columns: KanbanColumnView[];
};

export type DashboardProjectGroup = {
  project: {
    id: string;
    name: string;
    type: "MANUAL" | "AZURE_DEVOPS";
  };
  cards: KanbanCard[];
  openCount: number;
};

export type AzureWorkItem = {
  id: number;
  title: string;
  state: string;
  workItemType: string;
  description?: string;
  url: string;
};

export type AzureProjectSummary = {
  id: string;
  name: string;
  description?: string;
};
