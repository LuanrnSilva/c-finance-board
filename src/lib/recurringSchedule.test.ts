import { describe, expect, it } from "vitest";
import { upcomingDates, scheduleInputError } from "./recurringSchedule";

describe("monthly scheduled expenses", () => {
  it("programs consecutive monthly charges", () => {
    expect(upcomingDates({ next_date: "2026-11-10", billing_day: 10, state: "active", end_date: null }))
      .toEqual(["2026-11-10", "2026-12-10", "2027-01-10"]);
  });
  it("clamps short months and restores the original billing day", () => {
    expect(upcomingDates({ next_date: "2027-01-31", billing_day: 31, state: "active", end_date: null }))
      .toEqual(["2027-01-31", "2027-02-28", "2027-03-31"]);
  });
  it("includes the end date but no later charges", () => {
    expect(upcomingDates({ next_date: "2026-11-10", billing_day: 10, state: "active", end_date: "2026-12-10" }))
      .toEqual(["2026-11-10", "2026-12-10"]);
  });
  it("does not project paused or ended schedules", () => {
    for (const state of ["paused", "ended"]) expect(upcomingDates({ next_date: "2026-11-10", billing_day: 10, state, end_date: null })).toEqual([]);
  });
  it("rejects non-positive expense values", () => {
    expect(scheduleInputError(0, "2026-11-03", "", "2026-11-03")).not.toBeNull();
    expect(scheduleInputError(-20, "2026-11-03", "", "2026-11-03")).not.toBeNull();
    expect(scheduleInputError(20, "2026-11-03", "", "2026-11-03")).toBeNull();
  });
  it("rejects a first charge in the past", () => {
    expect(scheduleInputError(20, "2026-11-02", "", "2026-11-03")).not.toBeNull();
  });
  it("rejects an end before the next charge", () => {
    expect(scheduleInputError(20, "2026-11-10", "2026-11-09", "2026-11-03")).not.toBeNull();
  });
});