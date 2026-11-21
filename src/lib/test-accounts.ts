/**
 * Test accounts: users that the analytics leave out. The PostHog cohort
 * "Internal / Test users" (the test-account setting of the project) has the
 * persons with this property set to true. The app identifies each signed-in
 * user with the backend user ID, so the panel marks a user by that ID.
 */
export const TEST_USER_PROPERTY = "$internal_or_test_user";

const USER_ID = /^[0-9a-f]{24}$/;

/** True for a backend user ID (a Mongo ObjectId). */
export function isUserId(id: string): boolean {
  return USER_ID.test(id);
}

/**
 * The capture event that sets the mark. PostHog makes the person when it
 * does not exist yet, and joins it to the user at the first sign-in.
 */
export function markEvent(token: string, userId: string, marked: boolean) {
  return {
    api_key: token,
    event: "$set",
    distinct_id: userId,
    properties: { $set: { [TEST_USER_PROPERTY]: marked } },
  };
}

type PersonLike = { properties?: Record<string, unknown>; distinct_ids?: string[] } | undefined | null;

export function isMarkedPerson(person: PersonLike): boolean {
  const value = person?.properties?.[TEST_USER_PROPERTY];
  return value === true || value === "true";
}

/** The query of the PostHog persons list for the marked persons. */
export function markedListQuery(): string {
  return new URLSearchParams({
    limit: "100",
    properties: JSON.stringify([{ key: TEST_USER_PROPERTY, value: ["true"], operator: "exact", type: "person" }]),
  }).toString();
}

export type TestAccount = { userId: string | null; email: string | null; name: string | null };

const text = (v: unknown) => (typeof v === "string" && v ? v : null);

/** The user of a marked person: the backend ID among its IDs, its email and name. */
export function testAccountOf(person: PersonLike): TestAccount {
  return {
    userId: person?.distinct_ids?.find(isUserId) ?? null,
    email: text(person?.properties?.email),
    name: text(person?.properties?.name),
  };
}
