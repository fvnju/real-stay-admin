import { describe, expect, it } from "vitest";
import { joinFormErrors, joinRequestBody } from "./join-requests";

const good = { firstName: "Ada", lastName: "Obi", email: "Ada@Example.com", phone: "+2348012345678", reason: "Support" };

describe("joinFormErrors", () => {
  it("passes a good form", () => {
    expect(joinFormErrors(good)).toEqual({});
  });

  it("names each bad field", () => {
    const e = joinFormErrors({ firstName: " ", lastName: "", email: "nope", phone: "123", reason: "" });
    expect(Object.keys(e).sort()).toEqual(["email", "firstName", "lastName", "phone", "reason"]);
  });

  it("refuses a long reason and letters in the phone", () => {
    expect(joinFormErrors({ ...good, reason: "x".repeat(501) }).reason).toBeTruthy();
    expect(joinFormErrors({ ...good, phone: "080-1234-5678" }).phone).toBeTruthy();
    expect(joinFormErrors({ ...good, phone: "0801 234 5678" })).toEqual({});
  });
});

describe("joinRequestBody", () => {
  it("trims the values and puts the email in lower case", () => {
    expect(joinRequestBody({ ...good, firstName: " Ada ", email: " Ada@Example.com " })).toMatchObject({
      firstName: "Ada",
      email: "ada@example.com",
    });
  });
});
