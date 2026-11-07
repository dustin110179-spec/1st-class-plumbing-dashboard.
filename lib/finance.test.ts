import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultState } from "./defaults";
import {
  callsNeeded,
  ceilWhole,
  commissionsByJob,
  jobEconomics,
  jobsNeeded,
  marginFromMarkup,
  markupFromMargin,
  minListPrice,
  monthlyFromWeekly,
  priceFromCostAndMargin,
  priceFromCostAndMarkup,
  projectMonth,
  weeklyCommission,
} from "./finance";
import type { Job } from "./types";

describe("break-even math", () => {
  it("converts weekly cash break-even using 52/12 weeks, not monthly overhead", () => {
    assert.equal(monthlyFromWeekly(15750), 68250);
  });

  it("does not add $47,000 overhead onto the $15,750 weekly target", () => {
    const state = createDefaultState();
    const p = projectMonth(state, "2026-11-07");
    assert.equal(p.monthlyCashBreakEven, 68250);
    assert.equal(state.settings.monthlyFixedOverhead, 47000);
    assert.notEqual(p.monthlyCashBreakEven, 15750 * 4 + 47000);
  });

  it("rounds required jobs and incoming calls up to whole numbers", () => {
    assert.equal(jobsNeeded(68250, 1100), 63);
    assert.equal(callsNeeded(63, 0.8), 79);
    assert.equal(ceilWhole(62.045), 63);
    assert.equal(ceilWhole(78.75), 79);
  });

  it("returns zero remaining jobs when already past break-even", () => {
    assert.equal(jobsNeeded(0, 1100), 0);
    assert.equal(callsNeeded(0, 0.8), 0);
  });
});

describe("margin vs markup", () => {
  it("does not treat a 50% markup as a 50% margin", () => {
    assert.equal(marginFromMarkup(0.5), 1 / 3);
    assert.equal(markupFromMargin(0.5), 1);
    const cost = 100;
    assert.equal(priceFromCostAndMarkup(cost, 0.5), 150);
    assert.equal(priceFromCostAndMargin(cost, 0.5), 200);
  });

  it("solves list price for target margin after discount and processing", () => {
    const costs = 400;
    const list = minListPrice({
      jobCosts: costs,
      targetMargin: 0.65,
      processingRate: 0.053,
      discount: 0.1,
    });
    assert.ok(list);
    const net = list * 0.9;
    const processing = net * 0.053;
    const gm = (net - costs - processing) / net;
    assert.ok(Math.abs(gm - 0.65) < 1e-9);
  });
});

describe("labor and commission", () => {
  it("loads Brien at $30 × 1.40 and commissions only above $7,500", () => {
    assert.equal(weeklyCommission({ weeklySoldRevenue: 7500, threshold: 7500, rate: 0.1 }), 0);
    assert.equal(weeklyCommission({ weeklySoldRevenue: 10000, threshold: 7500, rate: 0.1 }), 250);
  });

  it("allocates commission only to revenue above the weekly threshold", () => {
    const state = createDefaultState();
    const jobs: Job[] = [
      {
        id: "a",
        date: "2026-11-02",
        customer: "One",
        jobType: "x",
        category: "service",
        technicianId: "brien",
        helperIds: ["nathan"],
        window: "8-10",
        estimatedRevenue: 4000,
        soldRevenue: 4000,
        completedRevenue: 4000,
        invoicedRevenue: 4000,
        collectedRevenue: 4000,
        status: "completed",
        sold: true,
        estimatedHours: 3,
        paidHoursTech: 3,
        paidHoursHelpers: { nathan: 3 },
        materials: 100,
        subcontractors: 0,
        membershipSold: false,
        callback: false,
        callbackCost: 0,
        optionsPresented: "all",
        financingOffered: false,
        reviewScore: 5,
        opportunityMissed: false,
        sourceId: "organic",
        isSample: false,
        externalId: "",
        notes: "",
      },
      {
        id: "b",
        date: "2026-11-03",
        customer: "Two",
        jobType: "x",
        category: "service",
        technicianId: "brien",
        helperIds: ["nathan"],
        window: "10-12",
        estimatedRevenue: 5000,
        soldRevenue: 5000,
        completedRevenue: 5000,
        invoicedRevenue: 5000,
        collectedRevenue: 5000,
        status: "completed",
        sold: true,
        estimatedHours: 4,
        paidHoursTech: 4,
        paidHoursHelpers: { nathan: 4 },
        materials: 200,
        subcontractors: 0,
        membershipSold: false,
        callback: false,
        callbackCost: 0,
        optionsPresented: "all",
        financingOffered: false,
        reviewScore: 5,
        opportunityMissed: false,
        sourceId: "organic",
        isSample: false,
        externalId: "",
        notes: "",
      },
    ];
    const map = commissionsByJob(jobs, state.employees);
    assert.equal(map.get("a"), 0);
    assert.equal(map.get("b"), 150);
    const econ = jobEconomics(jobs[1], state.employees, state.settings, map);
    const brienLoaded = 4 * 30 * 1.4;
    const nathanLoaded = 4 * 18 * 1.4;
    assert.equal(econ.techLabor, brienLoaded);
    assert.equal(econ.helperLabor, nathanLoaded);
    assert.equal(econ.commission, 150);
    assert.ok(econ.revenuePerCrewHour);
    assert.equal(econ.revenuePerCrewHour, 5000 / 8);
  });
});

describe("month projection", () => {
  it("labels empty books as forecast and uses Dallas working days / holidays", () => {
    const state = createDefaultState();
    const p = projectMonth(state, "2026-11-07");
    assert.equal(p.workingDaysInMonth.length, 19);
    assert.equal(p.dataMode, "forecast");
    assert.equal(p.mtdCompletedRevenue, 0);
    assert.ok(p.missing.length > 0);
    assert.ok(["red", "yellow", "green"].includes(p.status));
  });

  it("says not projected to break even when remaining capacity cannot cover the gap", () => {
    const state = createDefaultState();
    state.settings.incomingCallsPerDay = 0;
    const p = projectMonth(state, "2026-11-07");
    assert.equal(p.notProjectedToBreakEven, true);
    assert.equal(p.projectedBreakEvenDate, null);
    assert.equal(p.status, "red");
  });
});
