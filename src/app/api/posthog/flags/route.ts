import { NextResponse, type NextRequest } from "next/server";

import { describeFlagChange, flagBodyFromForm, type PosthogFlag } from "@/lib/feature-flag-rules";
import { writeFlagAudit } from "@/server/flag-audit";
import { readFlagInput } from "@/server/flag-input";
import { flagListQuery } from "@/server/flag-route-rules";
import { posthogFetch } from "@/server/posthog";
import { posthogErrorResponse, requirePermission, withSession } from "@/server/require-permission";

export const dynamic = "force-dynamic";

/** The flags of the PostHog project. */
export async function GET(request: NextRequest) {
  const check = await requirePermission(request, "feature-flags:view");
  if (!check.ok) return check.response;

  const q = flagListQuery(request.nextUrl.searchParams.get("search"), request.nextUrl.searchParams.get("active"));
  const result = await posthogFetch<{ results: PosthogFlag[] }>(`/feature_flags/?${q}`);
  if (!result.ok) return posthogErrorResponse(result.error, check.newTokens);
  return withSession(NextResponse.json({ data: result.data.results ?? [] }), check.newTokens);
}

/** Makes a flag. */
export async function POST(request: NextRequest) {
  const check = await requirePermission(request, "feature-flags:actions");
  if (!check.ok) return check.response;
  const read = await readFlagInput(request, check.newTokens);
  if (!read.ok) return read.response;

  const result = await posthogFetch<PosthogFlag>("/feature_flags/", {
    method: "POST",
    body: JSON.stringify(flagBodyFromForm(read.input.form)),
  });
  if (!result.ok) return posthogErrorResponse(result.error, check.newTokens);

  const audited = await writeFlagAudit(check.accessToken, {
    action: "created",
    flagId: result.data.id,
    key: result.data.key,
    description: describeFlagChange(null, read.input.form),
  });
  return withSession(
    NextResponse.json({ data: result.data, auditFailed: !audited }, { status: 201 }),
    check.newTokens
  );
}
