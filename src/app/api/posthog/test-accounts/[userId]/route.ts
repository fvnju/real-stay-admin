import { NextResponse, type NextRequest } from "next/server";

import { isMarkedPerson, isUserId, markEvent } from "@/lib/test-accounts";
import { posthogCapture, posthogFetch } from "@/server/posthog";
import { posthogErrorResponse, requirePermission, withSession } from "@/server/require-permission";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ userId: string }> };
type Person = { properties?: Record<string, unknown> };

const notFound = () => NextResponse.json({ code: "NOT_FOUND", message: "No such user." }, { status: 404 });

/** Is this user a test account? `known` is false when PostHog has no person for the user yet. */
export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = await params;
  if (!isUserId(userId)) return notFound();
  const check = await requirePermission(request, "product-analytics:view");
  if (!check.ok) return check.response;

  const result = await posthogFetch<{ results?: Person[] }>(
    `/persons/?${new URLSearchParams({ distinct_id: userId })}`
  );
  if (!result.ok) return posthogErrorResponse(result.error, check.newTokens);
  const person = result.data.results?.[0];
  return withSession(
    NextResponse.json({ data: { marked: isMarkedPerson(person), known: !!person } }),
    check.newTokens
  );
}

/** Marks the user as a test account (`marked: true`) or counts them again (`false`). */
export async function PUT(request: NextRequest, { params }: Params) {
  const { userId } = await params;
  if (!isUserId(userId)) return notFound();
  const check = await requirePermission(request, "product-analytics:actions");
  if (!check.ok) return check.response;

  const body = (await request.json().catch(() => null)) as { marked?: unknown } | null;
  if (typeof body?.marked !== "boolean") {
    return withSession(
      NextResponse.json({ code: "BAD_REQUEST", message: "Send marked: true or false." }, { status: 400 }),
      check.newTokens
    );
  }
  const marked = body.marked;
  const result = await posthogCapture((token) => markEvent(token, userId, marked));
  if (!result.ok) return posthogErrorResponse(result.error, check.newTokens);
  return withSession(NextResponse.json({ data: { marked } }), check.newTokens);
}
