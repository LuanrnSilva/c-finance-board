import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./authRedirect";

describe("invite authentication return", () => {
  it("returns to the invitation after login", () => {
    expect(safeReturnPath("/join/12345678-1234-1234-1234-123456789012")).toBe("/join/12345678-1234-1234-1234-123456789012");
  });
  it("rejects external redirect destinations", () => {
    expect(safeReturnPath("//external.example")).toBe("/");
    expect(safeReturnPath("/\\external.example")).toBe("/");
    expect(safeReturnPath("https://external.example")).toBe("/");
  });
});