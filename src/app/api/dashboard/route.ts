import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { buildDashboardView } from "@/lib/services/dashboard-service";

export async function GET() {
  try {
    const dashboard = await buildDashboardView();
    return NextResponse.json(dashboard);
  } catch (error) {
    return handleApiError(error);
  }
}
