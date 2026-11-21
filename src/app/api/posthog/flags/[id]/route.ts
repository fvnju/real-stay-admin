import { NextResponse, type NextRequest } from "next/server";

import {
  describeFlagChange,
  flagBodyFromForm,
  formFromFlag,
  readOnlyReason,
  type PosthogFlag,
} from "@/lib/feature-flag-rules";
import { writeFlagAudit } from "@/server/flag-audit";
import { readFlagInput } from "@/server/flag-input";
import { isStaleEdit, parseFlagId } from "@/server/flag-route-rules";
import { posthogFetch } from "@/server/posthog";
import { toPosthogError } from "@/server/posthog-errors";
import { posthogErrorResponse, requirePermission, withSession } from "@/server/require-permission";
import type { SessionTokens } from "@/server/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function json(body: object, status: number, newTokens: SessionTokens | null) {
  return withSession(NextResponse.json(body, { status }), newTokens);
}

async function flagId(params: Params["params"]) {
  return parseFlagId((await params).id);
}

/** One flag, with its full filters. */
export async function GET(request: NextRequest, { params }: Params) {
  const check = await requirePermission(request, "feature-flags:details");
  if (!check.ok) return check.response;
  const id = await flagId(params);
  if (!id) return json({ code: "NOT_FOUND", message: "No such flag." }, 404, check.newTokens);

  const result = await posthogFetch<PosthogFlag>(`/feature_flags/${id}/`);
  if (!result.ok) return posthogErrorResponse(result.error, check.newTokens);
  if (result.data.deleted) return json({ code: "NOT_FOUND", message: "No such flag." }, 404, check.newTokens);
  return json({ data: result.data }, 200, check.newTokens);
}

/**
 * Reads the current flag before a change: a deleted, read-only, or
 * changed flag stops the write.
 */
async function currentFlag(id: number, newTokens: SessionTokens | null) {
  const current = await posthogFetch<PosthogFlag>(`/feature_flags/${id}/`);
  if (!current.ok) return { ok: false as const, response: posthogErrorResponse(current.error, newTokens) };
  if (current.data.deleted) {
    return { ok: false as const, response: json({ code: "NOT_FOUND", message: "No such flag." }, 404, newTokens) };
  }
  const reason = readOnlyReason(current.data);
  if (reason) {
    return { ok: false as const, response: json({ code: "READ_ONLY_FLAG", message: reason }, 400, newTokens) };
  }
  return { ok: true as const, flag: current.data };
}

/** Changes a flag. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const check = await requirePermission(request, "feature-flags:actions");
  if (!check.ok) return check.response;
  const id = await flagId(params);
  if (!id) return json({ code: "NOT_FOUND", message: "No such flag." }, 404, check.newTokens);
  const read = await readFlagInput(request, check.newTokens);
  if (!read.ok) return read.response;

  const current = await currentFlag(id, check.newTokens);
  if (!current.ok) return current.response;
  if (isStaleEdit(read.input, current.flag)) {
    return posthogErrorResponse(toPosthogError(409, null), check.newTokens);
  }

  const result = await posthogFetch<PosthogFlag>(`/feature_flags/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ ...flagBodyFromForm(read.input.form), version: current.flag.version }),
  });
  if (!result.ok) return posthogErrorResponse(result.error, check.newTokens);

  const audited = await writeFlagAudit(check.accessToken, {
    action: "updated",
    flagId: id,
    key: result.data.key,
    description: describeFlagChange(formFromFlag(current.flag), read.input.form),
  });
  return json({ data: result.data, auditFailed: !audited }, 200, check.newTokens);
}

/** Deletes a flag (the soft delete of PostHog, which PostHog can undo). */
export async function DELETE(request: NextRequest, { params }: Params) {
  const check = await requirePermission(request, "feature-flags:actions");
  if (!check.ok) return check.response;
  const id = await flagId(params);
  if (!id) return json({ code: "NOT_FOUND", message: "No such flag." }, 404, check.newTokens);

  const current = await currentFlag(id, check.newTokens);
  if (!current.ok) return current.response;

  const result = await posthogFetch<PosthogFlag>(`/feature_flags/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ deleted: true, version: current.flag.version }),
  });
  if (!result.ok) return posthogErrorResponse(result.error, check.newTokens);

  const audited = await writeFlagAudit(check.accessToken, {
    action: "deleted",
    flagId: id,
    key: current.flag.key,
    description: describeFlagChange(formFromFlag(current.flag), null),
  });
  return json({ data: { id }, auditFailed: !audited }, 200, check.newTokens);
}
