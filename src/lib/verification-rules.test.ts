import { describe, expect, it } from "vitest";
import {
  DOCUMENT_KINDS,
  VERIFICATION_QUEUES,
  actionsOf,
  documentKindLabel,
  isPdfUrl,
  reasonError,
  recheckReasonLabel,
  verificationQueueArgs,
  verificationStatusLabel,
  visitNotesError,
} from "./verification-rules";

describe("actionsOf", () => {
  it("permits the paper check of a new request", () => {
    expect(actionsOf("submitted", false)).toEqual(["approve_documents", "reject"]);
  });
  it("permits the visit result after the paper check", () => {
    expect(actionsOf("documents_approved", false)).toEqual(["verify", "reject"]);
  });
  it("permits only the removal of the badge of a verified request", () => {
    expect(actionsOf("verified", false)).toEqual(["revoke"]);
    expect(actionsOf("verified", true)).toEqual(["revoke", "clear_recheck"]);
  });
  it("permits nothing on a closed request", () => {
    for (const s of ["rejected", "cancelled", "revoked"] as const) {
      expect(actionsOf(s, true)).toEqual([]);
    }
  });
});

describe("verificationQueueArgs", () => {
  it("sends the status of a status queue", () => {
    expect(verificationQueueArgs({ queue: "submitted", page: 2, pageSize: 10 })).toEqual({
      page: 2,
      limit: 10,
      status: "submitted",
    });
  });
  it("sends recheck=true for the recheck queue", () => {
    expect(verificationQueueArgs({ queue: "recheck", page: 1, pageSize: 10 })).toEqual({
      page: 1,
      limit: 10,
      recheck: true,
    });
  });
  it("sends no status for all requests, and the state when set", () => {
    expect(verificationQueueArgs({ queue: "all", page: 1, pageSize: 20, state: "Lagos" })).toEqual({
      page: 1,
      limit: 20,
      state: "Lagos",
    });
  });
  it("has a queue for each value", () => {
    expect(VERIFICATION_QUEUES.map((q) => q.value)).toEqual([
      "submitted",
      "documents_approved",
      "recheck",
      "verified",
      "rejected",
      "all",
    ]);
  });
});

describe("labels", () => {
  it("has a label for each paper kind of the backend", () => {
    expect(DOCUMENT_KINDS).toEqual(["title_document", "tenancy_agreement", "owner_letter", "business_registration"]);
    for (const k of DOCUMENT_KINDS) expect(documentKindLabel(k)).not.toBe(k);
  });
  it("labels the statuses and the recheck reasons", () => {
    expect(verificationStatusLabel("documents_approved")).toBe("Papers approved");
    expect(verificationStatusLabel("submitted")).toBe("Papers to check");
    expect(recheckReasonLabel("room_photos")).toBe("Room photos changed");
    expect(recheckReasonLabel("other_thing")).toBe("other_thing");
  });
});

describe("reasonError", () => {
  it("needs 3 to 1000 characters", () => {
    expect(reasonError("  ")).toMatch(/Write/);
    expect(reasonError("ab")).toMatch(/3/);
    expect(reasonError("a".repeat(1001))).toMatch(/1000/);
    expect(reasonError(" The title is not readable. ")).toBeNull();
  });
});

describe("visitNotesError", () => {
  it("permits empty notes and refuses more than 2000 characters", () => {
    expect(visitNotesError("")).toBeNull();
    expect(visitNotesError("a".repeat(2001))).toMatch(/2000/);
  });
});

describe("isPdfUrl", () => {
  it("finds a PDF from the link of the paper", () => {
    // Cloudinary private_download_url: the format is a query value.
    const link = (format: string) =>
      `https://api.cloudinary.com/v1_1/x/image/download?api_key=1&expires_at=2&format=${format}&public_id=listing_verification%2F1%2Fa&signature=s&type=authenticated`;
    expect(isPdfUrl(link("pdf"))).toBe(true);
    expect(isPdfUrl(link("jpg"))).toBe(false);
    expect(isPdfUrl("https://res.cloudinary.com/x/image/authenticated/a.pdf")).toBe(true);
    expect(isPdfUrl("not a url")).toBe(false);
  });
});
