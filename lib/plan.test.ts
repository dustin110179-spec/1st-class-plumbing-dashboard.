import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultState } from "./defaults";
import { marginFromMarkup, markupFromMargin, monthlyFromWeekly, producingTechs } from "./finance";
import {
  groupYear,
  hiringReadiness,
  hoursPerMonthFromWeekly,
  laborMonth,
  latestViewMonth,
  newTechWageMonths,
  patchLine,
  penetrationScenario,
  pnlYear,
  producingTechCount,
  profitTracker,
  rampForMonth,
  revenueRequiredForNetMargin,
  variance,
} from "./plan";

describe("2027 budget construction", () => {
  it("budgets $1,200,000 annual revenue and keeps actuals at zero", () => {
    const state = createDefaultState();
    const budget = pnlYear(state.plan.lines, "monthlyBudget");
    const actual = pnlYear(state.plan.lines, "monthlyActual");
    assert.equal(budget.revenue, 1200000);
    assert.equal(actual.revenue, 0);
    assert.equal(actual.netProfit, 0);
    assert.equal(state.plan.year, 2027);
    assert.equal(state.plan.budgetLocked, false);
    assert.equal(state.plan.draft, true);
    assert.equal(state.settings.goalsApproved, false);
  });

  it("keeps proposed 25% net profit and 10% growth allocation as draft goals", () => {
    const state = createDefaultState();
    const t = profitTracker(state, "2026-11-08");
    assert.ok(Math.abs(t.goalMonthly - 25000) < 1e-9);
    assert.equal(t.goalAnnual, 300000);
    assert.equal(t.goals.targetNetMargin, 0.25);
    assert.equal(t.goals.growthReserveRate, 0.1);
    assert.equal(t.goals.annualGrowthAllocation, 120000);
    assert.equal(t.goals.monthlyGrowthAllocation, 10000);
    assert.equal(t.goals.annualProfitAfterGrowth, 180000);
    assert.equal(t.goals.approved, false);
    assert.equal(t.accountingProfitUntouchedByGrowth, true);
    assert.equal(t.inPlanningYear, false);
    const opexIds = state.plan.lines.filter((l) => l.group === "opex").map((l) => l.id);
    assert.ok(!opexIds.includes("growth_reserve"));
    assert.equal(state.plan.growthAllocated.every((n) => n === 0), true);
  });

  it("does not treat $15,750 weekly cash break-even as monthly overhead", () => {
    assert.equal(monthlyFromWeekly(15750), 68250);
    const state = createDefaultState();
    const t = profitTracker(state, "2026-11-08");
    assert.equal(t.weeklyBreakEven, 15750);
    assert.equal(t.monthlyCashBreakEven, 68250);
    assert.notEqual(t.monthlyCashBreakEven, 47000);
  });
});

describe("locked budget vs forecast", () => {
  it("refuses budget edits after lock and still allows forecast edits", () => {
    const state = createDefaultState();
    state.plan.budgetLocked = true;
    const before = state.plan.lines.find((l) => l.id === "residential_service")!;
    const blocked = patchLine(state.plan, "residential_service", 0, "monthlyBudget", 999);
    assert.equal(blocked.lines.find((l) => l.id === "residential_service")!.monthlyBudget[0], before.monthlyBudget[0]);
    const forecast = patchLine(state.plan, "residential_service", 0, "monthlyForecast", 41000);
    assert.equal(forecast.lines.find((l) => l.id === "residential_service")!.monthlyForecast[0], 41000);
    assert.equal(forecast.lines.find((l) => l.id === "residential_service")!.monthlyBudget[0], before.monthlyBudget[0]);
  });
});

describe("two hired technicians and owner off the truck", () => {
  it("budgets both new techs with February and March start dates", () => {
    const state = createDefaultState();
    assert.equal(newTechWageMonths(state.plan.hiring), 11);
    assert.equal(newTechWageMonths(state.plan.secondHire), 10);
    assert.equal(producingTechCount(state, 0), 2);
    assert.equal(producingTechCount(state, 1), 3);
    assert.equal(producingTechCount(state, 2), 3);
    assert.equal(rampForMonth(state.plan.hiring, 0), 0);
    assert.equal(rampForMonth(state.plan.hiring, 1), 0.5);
    assert.equal(rampForMonth(state.plan.hiring, 2), 0.75);
    assert.equal(rampForMonth(state.plan.hiring, 3), 1);
    assert.equal(rampForMonth(state.plan.secondHire, 1), 0);
    assert.equal(rampForMonth(state.plan.secondHire, 2), 0.5);
    assert.equal(rampForMonth(state.plan.secondHire, 3), 0.75);
    assert.equal(rampForMonth(state.plan.secondHire, 4), 1);
    const wages = state.plan.lines.find((l) => l.id === "tech_wages")!;
    assert.ok(wages.monthlyBudget[0] < wages.monthlyBudget[1]);
    assert.ok(wages.monthlyBudget[1] < wages.monthlyBudget[2]);
    const startup = state.plan.lines.find((l) => l.id === "new_tech_startup")!;
    assert.equal(startup.monthlyBudget[0], 0);
    assert.equal(startup.monthlyBudget[1], 2900);
    assert.equal(startup.monthlyBudget[2], 2900);
    const owner = state.plan.lines.find((l) => l.id === "owner_compensation")!;
    assert.ok(owner.monthlyBudget.every((n) => n === 8000));
  });

  it("counts Dustin as producing through February and not after March 1", () => {
    const state = createDefaultState();
    const now = producingTechs(state.employees, "2026-11-08");
    assert.equal(now.length, 2);
    assert.ok(now.some((e) => e.id === "dustin"));
    assert.ok(now.every((e) => e.id !== "tech3" && e.id !== "tech4"));
    const feb = producingTechs(state.employees, "2027-02-01");
    assert.equal(feb.length, 3);
    assert.ok(feb.some((e) => e.id === "dustin"));
    assert.ok(feb.some((e) => e.id === "tech3"));
    assert.ok(feb.every((e) => e.id !== "tech4"));
    const mar = producingTechs(state.employees, "2027-03-01");
    assert.equal(mar.length, 3);
    assert.ok(mar.every((e) => e.id !== "dustin"));
    assert.ok(mar.some((e) => e.id === "brien"));
    assert.ok(mar.some((e) => e.id === "tech3"));
    assert.ok(mar.some((e) => e.id === "tech4"));
  });

  it("flags hiring unreadiness when call volume is below the planning threshold", () => {
    const state = createDefaultState();
    const r = hiringReadiness(state, "2026-11-08");
    assert.equal(state.settings.incomingCallsPerDay, 6);
    assert.equal(state.plan.hiring.minIncomingCallsPerDay, 12);
    assert.equal(r.callsOk, "red");
    assert.deepEqual(r.wageMonths, [11, 10]);
    assert.equal(r.ownerOffTruckDate, "2027-03-01");
  });
});

describe("margin vs markup and variances", () => {
  it("keeps a 50% markup distinct from a 50% margin", () => {
    assert.equal(markupFromMargin(0.5), 1);
    assert.equal(marginFromMarkup(0.5), 1 / 3);
  });

  it("treats extra revenue as favorable and extra expense as unfavorable", () => {
    const rev = variance(100000, 110000, true);
    const exp = variance(47000, 50000, false);
    assert.equal(rev.favorable, true);
    assert.equal(exp.favorable, false);
  });
});

describe("market penetration model", () => {
  it("uses ACS 2020–2024 household counts and labels hypothetical demand", () => {
    const state = createDefaultState();
    assert.equal(state.plan.market.richardsonHouseholds, 45818);
    assert.equal(state.plan.market.planoHouseholds, 112438);
    const onePct = penetrationScenario("richardson", state.plan.market, 0.01, 3, 19);
    assert.ok(Math.abs(onePct.householdsTouched - 45818 * state.plan.market.richardsonOwnerShare * 0.01) < 1);
    assert.equal(onePct.jobs, onePct.householdsTouched * 0.35);
    assert.equal(onePct.revenue, onePct.jobs * 1100);
  });
});

describe("owner pay vs cash", () => {
  it("does not put debt principal in the operating budget", () => {
    const state = createDefaultState();
    const opexIds = state.plan.lines.filter((l) => l.group === "opex").map((l) => l.id);
    assert.ok(!opexIds.includes("debt_principal"));
    assert.ok(state.plan.monthlyCash.every((m) => m.debtPrincipal === 0));
    assert.ok(state.plan.monthlyCash.every((m) => m.ownerSalary === 0));
  });

  it("keeps Linda in office payroll and Nathan out of producing trucks", () => {
    const state = createDefaultState();
    const linda = state.employees.find((e) => e.id === "linda")!;
    assert.equal(linda.role, "office");
    assert.equal(linda.canRunCalls, false);
    assert.equal(linda.payInFixedOverhead, true);
    const nathan = state.employees.find((e) => e.id === "nathan")!;
    assert.equal(nathan.canRunCalls, false);
    const office = state.plan.lines.find((l) => l.id === "office_payroll")!;
    assert.ok(groupYear([office], "opex", "monthlyBudget") > 0);
  });
});

describe("hours", () => {
  it("uses 52/12 paid hours, not 8 billable hours as a substitute for paid time", () => {
    assert.ok(Math.abs(hoursPerMonthFromWeekly(40) - 173.3333333333) < 0.01);
    const jan = latestViewMonth(createDefaultState().plan.lines, 0);
    assert.ok(jan.revenue > 0);
    assert.equal(jan.source, "forecast");
  });
});

describe("revenue required for 25% net profit", () => {
  it("keeps $1.2M as the initial target and does not assume 25% is already achieved", () => {
    const state = createDefaultState();
    const req = revenueRequiredForNetMargin(state);
    assert.equal(req.budgetRevenue, 1200000);
    assert.equal(req.targetMargin, 0.25);
    assert.ok(req.requiredRevenue != null && req.requiredRevenue > 0);
    const jan = laborMonth(state, 0);
    const mar = laborMonth(state, 2);
    const dustinJan = jan.rows.find((r) => r.employeeId === "dustin")!;
    const dustinMar = mar.rows.find((r) => r.employeeId === "dustin")!;
    assert.equal(dustinJan.producing, true);
    assert.ok(dustinJan.expectedRevenue > 0);
    assert.equal(dustinMar.producing, false);
    assert.equal(dustinMar.expectedRevenue, 0);
    if ((req.projectedNetMargin ?? 0) + 1e-9 < 0.25) {
      assert.equal(req.supportedAtInitialTarget, false);
      assert.ok(req.requiredRevenue! > 1200000);
    }
  });
});
