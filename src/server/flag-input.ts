import "server-only";

import { NextResponse } from "next/server";

import { validateFlagForm, type FlagForm } from "@/lib/feature-flag-rules";
import type { SessionTokens } from "./session";
import { withSession } from "./require-permission";

export type FlagWriteInput = { form: FlagForm; updatedAt?: string; version?: number };

/** Reads and checks the body of a flag create or update. */
export async function readFlagInput(
  request: Request,
  newTokens: SessionTokens | null
): Promise<{ ok: true; input: FlagWriteInput } | { ok: false; response: NextResponse }> {
  const body = (await request.json().catch(() => null)) as Partial<FlagWriteInput> | null;
  const form = body?.form;
  if (!form || typeof form !== "object" || !Array.isArray(form.conditions) || !Array.isArray(form.variants)) {
    return {
      ok: false,
      response: withSession(NextResponse.json({ code: "INVALID_FLAG", fields: {} }, { status: 400 }), newTokens),
    };
  }
  const fields = validateFlagForm(form);
  if (Object.keys(fields).length) {
    return {
      ok: false,
      response: withSession(NextResponse.json({ code: "INVALID_FLAG", fields }, { status: 400 }), newTokens),
    };
  }
  return { ok: true, input: { form, updatedAt: body.updatedAt, version: body.version } };
}
