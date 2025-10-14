import { describe, it, expect } from "vitest";
import { errorToUserMessage } from "./../src/ddClient";

describe("errorToUserMessage", () => {
  it("maps 401 to sign-in message", () => {
    expect(errorToUserMessage({ status: 401, error: "Unauthorized" })).toContain("Sign in");
  });
  it("maps 403 to permission message", () => {
    expect(errorToUserMessage({ status: 403, error: "Forbidden" })).toContain("permission");
  });
  it("maps 429 to rate-limit message", () => {
    expect(errorToUserMessage({ status: 429, error: "Too many requests" })).toContain("Too many requests");
  });
  it("maps 500 to service unavailable", () => {
    expect(errorToUserMessage({ status: 500, error: "Server error" })).toContain("temporarily unavailable");
  });
});
