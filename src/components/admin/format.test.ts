import { describe, expect, it } from "vitest";
import { formatPhone, phoneToCopy } from "./format";

describe("formatPhone", () => {
  it.each([
    ["2349139220241", "+234 913 922 0241"],
    ["+234 913 922 0241", "+234 913 922 0241"],
    ["09139220241", "+234 913 922 0241"],
    ["9139220241", "+234 913 922 0241"],
    ["+2347051307512", "+234 705 130 7512"],
    // A 0 kept after 234.
    ["23408031234567", "+234 803 123 4567"],
    ["+234 0803 123 4567", "+234 803 123 4567"],
  ])("formats the valid number %p", (stored, shown) => {
    expect(formatPhone(stored)).toBe(shown);
  });

  it.each([
    ["234909000009", "+234 909 000 009"],
    ["234909000000", "+234 909 000 000"],
    ["23488009911838", "+234 880 099 11838"],
    ["23400409998888", "+234 004 099 98888"],
    ["+23412", "+234 12"],
  ])("groups a 234 number of the wrong length the same way: %p", (stored, shown) => {
    expect(formatPhone(stored)).toBe(shown);
  });

  it.each([
    ["+44 20 7946 0958", "+44 20 7946 0958"],
    ["call me", "call me"],
  ])("keeps another number as it is: %p", (stored, shown) => {
    expect(formatPhone(stored)).toBe(shown);
  });

  it.each([null, undefined, "", "  "])("shows a dash for %p", (stored) => {
    expect(formatPhone(stored)).toBe("–");
  });
});

describe("phoneToCopy", () => {
  it.each([
    ["2349139220241", "+2349139220241"],
    ["23408031234567", "+2348031234567"],
    ["234909000009", "+234909000009"],
    ["+44 20 7946 0958", "+44 20 7946 0958"],
  ])("gives %p as %p", (stored, copied) => {
    expect(phoneToCopy(stored)).toBe(copied);
  });
});
