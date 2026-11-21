import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/store/store", () => ({ default: { dispatch: () => undefined, getState: () => ({}) } }));

describe("adminsArgs", () => {
  it("sends removed=true, and no status, for the Removed filter", async () => {
    const { adminsArgs } = await import("./page-queries");
    const { params } = adminsArgs({ page: 1, pageSize: 10, status: "removed" });
    expect(params).toMatchObject({ removed: "true", status: undefined });
  });
  it("keeps a real status as it is", async () => {
    const { adminsArgs } = await import("./page-queries");
    const { params } = adminsArgs({ page: 1, pageSize: 10, status: "pending" });
    expect(params).toMatchObject({ status: "pending" });
    expect(params).not.toHaveProperty("removed");
  });
});
