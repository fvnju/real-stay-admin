import "server-only";

import { NextResponse } from "next/server";

import { validateFlagForm, type FlagForm } from "@/lib/feature-flag-rules";
import { parseFlagForm } from "./flag-route-rules";
import type { SessionTokens } from "./session";
import { withSession } from "./require-permission";

export type FlagWriteInput = { form: FlagForm; updatedAt?: string; version?: number };

function invalid(fields: Record<string, string>, newTokens: SessionTokens | null) {
  return {
    ok: false as const,
    response: withSession(NextResponse.json({ code: "INVALID_FLAG", fields }, { status: 400 }), newTokens),
  };
}

/** Reads and checks the body of a flag create or update. */
export async function readFlagInput(
  request: Request,
  newTokens: SessionTokens | null
): Promise<{ ok: true; input: FlagWriteInput } | { ok: false; response: NextResponse }> {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const form = parseFlagForm(body?.form);
  if (!form) return invalid({}, newTokens);
  const { updatedAt, version } = body ?? {};
  if (updatedAt !== undefined && typeof updatedAt !== "string") return invalid({}, newTokens);
  if (version !== undefined && version !== null && typeof version !== "number") return invalid({}, newTokens);

  const fields = validateFlagForm(form);
  if (Object.keys(fields).length) return invalid(fields, newTokens);
  return {
    ok: true,
    input: { form, updatedAt: updatedAt as string | undefined, version: (version ?? undefined) as number | undefined },
  };
}
