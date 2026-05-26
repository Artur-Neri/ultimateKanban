import type { AzureProjectSummary, AzureWorkItem } from "@/lib/types";

type AzureClientOptions = {
  organization: string;
  pat: string;
};

type WiqlResponse = {
  workItems: Array<{ id: number }>;
};

type WorkItemsBatchResponse = {
  value: Array<{
    id: number;
    fields: Record<string, string | number | null>;
    url: string;
  }>;
};

type ProjectsResponse = {
  value: AzureProjectSummary[];
};

export class AzureDevOpsError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AzureDevOpsError";
    this.status = status;
  }
}

export class AzureDevOpsClient {
  private organization: string;
  private pat: string;
  private static readonly WORK_ITEM_BATCH_SIZE = 200;

  constructor({ organization, pat }: AzureClientOptions) {
    this.organization = organization.trim();
    this.pat = pat.trim();
  }

  private get authHeader(): string {
    const token = Buffer.from(`:${this.pat}`).toString("base64");
    return `Basic ${token}`;
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(
      `https://dev.azure.com/${this.organization}${path}`,
      {
        ...init,
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
          ...(init?.headers ?? {}),
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new AzureDevOpsError(
        parseAzureErrorMessage(body, response.status),
        response.status,
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  async resolveProjectName(adoProject: string): Promise<string> {
    const projects = await this.listProjects();
    const match = projects.find(
      (project) => project.name.toLowerCase() === adoProject.trim().toLowerCase(),
    );

    if (!match) {
      const available = projects.map((project) => project.name).join(", ");
      throw new AzureDevOpsError(
        `Projeto "${adoProject}" não encontrado. Projetos disponíveis: ${available || "nenhum"}.`,
        404,
      );
    }

    return match.name;
  }

  async validateConnection(adoProject: string): Promise<string> {
    const projectName = await this.resolveProjectName(adoProject);
    await this.request<{ id: string }>(
      `/_apis/projects/${encodeURIComponent(projectName)}?api-version=7.1`,
    );
    return projectName;
  }

  async listProjects(): Promise<AzureProjectSummary[]> {
    const data = await this.request<ProjectsResponse>(
      "/_apis/projects?api-version=7.1&$top=100",
    );
    return data.value;
  }

  async getAssignedWorkItems(
    adoProject: string,
    assignedToEmail: string,
  ): Promise<AzureWorkItem[]> {
    const projectName = await this.resolveProjectName(adoProject);
    const wiql = {
      query: `
        SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType]
        FROM WorkItems
        WHERE [System.TeamProject] = '${projectName.replace(/'/g, "''")}'
          AND [System.AssignedTo] CONTAINS '${assignedToEmail.trim().replace(/'/g, "''")}'
        ORDER BY [System.ChangedDate] DESC
      `,
    };

    const wiqlResult = await this.request<WiqlResponse>(
      `/${encodeURIComponent(projectName)}/_apis/wit/wiql?api-version=7.1`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(wiql),
      },
    );

    if (wiqlResult.workItems.length === 0) {
      return [];
    }

    const workItems = await this.fetchWorkItemsInBatches(
      wiqlResult.workItems.map((item) => item.id),
    );

    return workItems.map((item) => ({
      id: item.id,
      title: String(item.fields["System.Title"] ?? "Sem título"),
      state: String(item.fields["System.State"] ?? "New"),
      workItemType: String(item.fields["System.WorkItemType"] ?? "Task"),
      description: item.fields["System.Description"]
        ? String(item.fields["System.Description"])
        : undefined,
      url: item.url.replace("_apis/wit/workItems", "_workitems/edit"),
    }));
  }

  private async fetchWorkItemsInBatches(
    ids: number[],
  ): Promise<WorkItemsBatchResponse["value"]> {
    const items: WorkItemsBatchResponse["value"] = [];

    for (
      let index = 0;
      index < ids.length;
      index += AzureDevOpsClient.WORK_ITEM_BATCH_SIZE
    ) {
      const chunk = ids.slice(index, index + AzureDevOpsClient.WORK_ITEM_BATCH_SIZE);
      const batch = await this.request<WorkItemsBatchResponse>(
        `/_apis/wit/workitems?ids=${chunk.join(",")}&$expand=All&api-version=7.1`,
      );
      items.push(...batch.value);
    }

    return items;
  }

  async updateWorkItemState(
    workItemId: number,
    newState: string,
  ): Promise<void> {
    await this.request(
      `/_apis/wit/workitems/${workItemId}?api-version=7.1`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json-patch+json",
        },
        body: JSON.stringify([
          {
            op: "add",
            path: "/fields/System.State",
            value: newState,
          },
        ]),
      },
    );
  }
}

function parseAzureErrorMessage(body: string, status: number): string {
  if (!body) {
    return `Erro na API Azure DevOps (${status})`;
  }

  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message) {
      return parsed.message;
    }
  } catch {
    // Resposta não-JSON; usa texto bruto abaixo.
  }

  return body.length > 240 ? `${body.slice(0, 240)}...` : body;
}
