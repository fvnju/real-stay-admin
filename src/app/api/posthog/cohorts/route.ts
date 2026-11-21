import { NextResponse, type NextRequest } from "next/server";

import { posthogFetch } from "@/server/posthog";
import { posthogErrorResponse, requirePermission, withSession } from "@/server/require-permission";

export const dynamic = "force-dynamic";

type Cohort = { id: number; name: string | null; deleted?: boolean };

/** The cohorts of the project, for the cohort filter of the flag form. */
export async function GET(request: NextRequest) {
  const check = await requirePermission(request, "feature-flags:details");
  if (!check.ok) return check.response;

  const result = await posthogFetch<{ results: Cohort[] }>("/cohorts/?limit=200");
  if (!result.ok) return posthogErrorResponse(result.error, check.newTokens);
  const data = (result.data.results ?? [])
    .filter((c) => !c.deleted)
    .map((c) => ({ id: c.id, name: c.name || `Cohort ${c.id}` }));
  return withSession(NextResponse.json({ data }), check.newTokens);
}
