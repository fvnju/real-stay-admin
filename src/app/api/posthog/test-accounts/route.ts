import { NextResponse, type NextRequest } from "next/server";

import { markedListQuery, testAccountOf } from "@/lib/test-accounts";
import { posthogFetch } from "@/server/posthog";
import { posthogErrorResponse, requirePermission, withSession } from "@/server/require-permission";

export const dynamic = "force-dynamic";

type Person = { distinct_ids?: string[]; properties?: Record<string, unknown> };

/** The users that the analytics leave out (marked test accounts). */
export async function GET(request: NextRequest) {
  const check = await requirePermission(request, "product-analytics:view");
  if (!check.ok) return check.response;

  const result = await posthogFetch<{ results?: Person[] }>(`/persons/?${markedListQuery()}`);
  if (!result.ok) return posthogErrorResponse(result.error, check.newTokens);
  const data = (result.data.results ?? []).map(testAccountOf);
  return withSession(NextResponse.json({ data }), check.newTokens);
}
