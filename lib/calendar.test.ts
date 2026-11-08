import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDays,
  defaultHolidays,
  monthEnd,
  todayISO,
  weekday,
  weekStartMonday,
  workingDaysInMonth,
} from "./calendar";
import { DEFAULT_SETTINGS } from "./defaults";

describe("calendar", () => {
  it("treats Thanksgiving 2026 and the Friday after as holidays", () => {
    const h = defaultHolidays(2026);
    assert.ok(h.includes("2026-11-26"));
    assert.ok(h.includes("2026-11-27"));
  });

  it("counts 19 Dallas working days in November 2026 with default holidays", () => {
    const days = workingDaysInMonth("2026-11-07", DEFAULT_SETTINGS);
    assert.equal(days.length, 19);
    assert.ok(!days.includes("2026-11-26"));
    assert.ok(!days.includes("2026-11-07"));
  });

  it("uses Monday week starts and UTC-safe date arithmetic", () => {
    assert.equal(weekStartMonday("2026-11-07"), "2026-11-02");
    assert.equal(addDays("2026-11-07", 1), "2026-11-08");
    assert.equal(weekday("2026-11-07"), 6);
    assert.equal(monthEnd("2026-11-07"), "2026-11-30");
  });

  it("formats today as YYYY-MM-DD in America/Chicago", () => {
    assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
  });
});
