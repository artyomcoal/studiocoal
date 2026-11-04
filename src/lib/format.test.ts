import { describe, expect, it } from "vitest";
import { formatDate } from "./format";

describe("formatDate", () => {
  it("formats like the Figma tags", () => {
    expect(formatDate("2025-08-17T09:00:00Z")).toBe("Aug 17, 2025");
  });

  it("uses UTC, not the local zone", () => {
    expect(formatDate("2025-08-17T23:30:00Z")).toBe("Aug 17, 2025");
    expect(formatDate("2025-08-17")).toBe("Aug 17, 2025");
  });
});
