import { describe, expect, it } from "vitest";
import { posthogResultOf, toPosthogError } from "./posthog-errors";

describe("toPosthogError", () => {
  it("maps a 409 to FLAG_CHANGED", () => {
    expect(toPosthogError(409, {})).toMatchObject({ status: 409, code: "FLAG_CHANGED" });
  });

  it("maps a 404 to NOT_FOUND", () => {
    expect(toPosthogError(404, {})).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("maps a 400 to BAD_REQUEST with the PostHog detail", () => {
    expect(toPosthogError(400, { detail: "Key already exists" })).toEqual({
      status: 400,
      code: "BAD_REQUEST",
      message: "Key already exists",
    });
  });

  it("maps a 5xx to POSTHOG_UNAVAILABLE with status 502", () => {
    expect(toPosthogError(503, {})).toMatchObject({ status: 502, code: "POSTHOG_UNAVAILABLE" });
  });

  it("maps another status to POSTHOG_ERROR with status 502", () => {
    expect(toPosthogError(403, {})).toMatchObject({ status: 502, code: "POSTHOG_ERROR" });
  });

  it("never returns a detail that has an API key in it", () => {
    const error = toPosthogError(400, { detail: "Bad key phx_abc123" });
    expect(error.message).not.toContain("phx_");
  });

  it.each([["a string", "Bad Gateway"], ["null", null], ["HTML", "<html>error</html>"]])(
    "gives a generic message for %s",
    (_name, body) => {
      expect(toPosthogError(400, body).message).toBe("PostHog refused the request.");
    },
  );
});

describe("posthogResultOf", () => {
  it("gives the body of a good answer", () => {
    expect(posthogResultOf(200, { results: [] })).toEqual({ ok: true, data: { results: [] } });
  });
  it("treats a good answer without a body that can be read as PostHog unavailable", () => {
    expect(posthogResultOf(200, null)).toEqual({
      ok: false,
      error: expect.objectContaining({ status: 502, code: "POSTHOG_UNAVAILABLE" }),
    });
  });
  it("maps an error answer", () => {
    expect(posthogResultOf(409, null)).toEqual({ ok: false, error: expect.objectContaining({ code: "FLAG_CHANGED" }) });
  });
});
