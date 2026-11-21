import "server-only";

import { BASE_URL } from "@/utils/configs/constant";

export type FlagAuditEntry = {
  action: "created" | "updated" | "deleted";
  flagId: number;
  key: string;
  description: string;
};

/**
 * Records a flag change in the backend audit log, with the admin of the
 * access token. Returns false on any failure: the flag change stays, and
 * the page warns the admin.
 */
export async function writeFlagAudit(accessToken: string | undefined, entry: FlagAuditEntry): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/audit-logs/feature-flag`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify(entry),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
