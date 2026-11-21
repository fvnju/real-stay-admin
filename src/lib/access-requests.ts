/** The longest reason or decline note that the backend takes. */
export const MAX_REASON_LENGTH = 500;

/** The error of the "Ask for access" form, or null. */
export function accessRequestError(input: { permissions: string[]; roleId: string; reason: string }): string | null {
  if (!input.permissions.length && !input.roleId) return "Ask for at least one permission or a role.";
  const reason = input.reason.trim();
  if (!reason) return "Tell the team why.";
  if (reason.length > MAX_REASON_LENGTH) return `Write ${MAX_REASON_LENGTH} characters or less.`;
  return null;
}

/** The asked permissions that `role` does not give. The backend refuses such an approval. */
export function missingFromRole(asked: string[], role: { slug: string; permissions?: string[] }): string[] {
  if (role.slug === "superadmin") return [];
  const gives = new Set(role.permissions ?? []);
  return asked.filter((p) => !gives.has(p));
}

/**
 * The permissions of a role made for an approval: the ones that the
 * requester has now, then the asked ones. An approval replaces the role, so
 * a role with only the asked permissions takes the others away.
 */
export function permissionsForApproval(current: string[], asked: string[]): string[] {
  return [...new Set([...current, ...asked])];
}
