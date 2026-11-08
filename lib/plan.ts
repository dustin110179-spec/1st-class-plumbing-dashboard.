import { addDays, monthEnd, monthStart, weekStartMonday } from "./calendar";
import {
  cashForecast,
  dailyTargetRemaining,
  endingCash,
  filterJobs,
  jobRevenue,
  monthlyFromWeekly,
  projectMonth,
} from "./finance";
import { CENSUS_HOUSING_DETAIL, CENSUS_HOUSEHOLDS } from "./marketData";
import type {
  AppState,
  BudgetGroup,
  BudgetLine,
  Employee,
  HiringPlan,
  Job,
  MarketAssumptions,
  Plan2027,
  ScorecardPeriod,
  ServiceCity,
} from "./types";

export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const DEFAULT_CHECKLIST = [
  { id: "board", label: "Confirm today’s board covers the daily revenue need" },
  { id: "leads", label: "Check incoming leads and unbooked calls" },
  { id: "cash", label: "Look at cash versus payroll and major bills" },
  { id: "estimates", label: "Follow up on open estimates" },
  { id: "close", label: "Enter yesterday’s completed jobs and collections" },
];

export function zeros(): number[] {
  return Array.from({ length: 12 }, () => 0);
}

export function hoursPerMonthFromWeekly(hoursPerWeek: number): number {
  return (hoursPerWeek * 52) / 12;
}

export function monthlyProfitGoal(annual: number): number {
  return annual / 12;
}

export function sum12(values: number[]): number {
  return values.reduce((n, v) => n + (Number.isFinite(v) ? v : 0), 0);
}

export function lineTotal(line: BudgetLine, field: "monthlyBudget" | "monthlyActual" | "monthlyForecast"): number {
  return sum12(line[field]);
}

export function linesByGroup(lines: BudgetLine[], group: BudgetGroup): BudgetLine[] {
  return lines.filter((l) => l.group === group);
}

export function groupMonth(
  lines: BudgetLine[],
  group: BudgetGroup,
  month: number,
  field: "monthlyBudget" | "monthlyActual" | "monthlyForecast",
): number {
  return lines.filter((l) => l.group === group).reduce((n, l) => n + (l[field][month] ?? 0), 0);
}

export function groupYear(lines: BudgetLine[], group: BudgetGroup, field: "monthlyBudget" | "monthlyActual" | "monthlyForecast"): number {
  return lines.filter((l) => l.group === group).reduce((n, l) => n + lineTotal(l, field), 0);
}

export function variance(budget: number, actual: number, higherIsBetter: boolean) {
  const amount = actual - budget;
  const pct = budget === 0 ? (actual === 0 ? 0 : null) : amount / budget;
  const favorable = higherIsBetter ? amount >= 0 : amount <= 0;
  return { amount, pct, favorable };
}

export function displayValue(line: BudgetLine, month: number): { value: number; source: "actual" | "forecast" | "budget" } {
  const actual = line.monthlyActual[month] ?? 0;
  if (actual !== 0) return { value: actual, source: "actual" };
  const forecast = line.monthlyForecast[month] ?? 0;
  if (forecast !== 0) return { value: forecast, source: "forecast" };
  return { value: line.monthlyBudget[month] ?? 0, source: "budget" };
}

export function hiringStartMonth(hiring: HiringPlan): number {
  const month = Number(hiring.startDate.slice(5, 7));
  if (!Number.isFinite(month) || month < 1) return 1;
  return month - 1;
}

export function planHires(plan: Plan2027): HiringPlan[] {
  return [plan.hiring, plan.secondHire].filter(Boolean);
}

export function hireForEmployee(plan: Plan2027, employeeId: string): HiringPlan | null {
  return planHires(plan).find((h) => h.employeeId === employeeId) ?? null;
}

export function rampForMonth(hiring: HiringPlan, monthIndex: number): number {
  const start = hiringStartMonth(hiring);
  if (monthIndex < start) return 0;
  const offset = monthIndex - start;
  if (offset === 0) return hiring.rampFeb;
  if (offset === 1) return hiring.rampMar;
  return hiring.rampAprOnward;
}

export function employeeActiveInMonth(emp: Employee, monthIndex: number, year: number): boolean {
  if (!emp.active) return false;
  if (emp.startDate) {
    const y = Number(emp.startDate.slice(0, 4));
    const m = Number(emp.startDate.slice(5, 7)) - 1;
    if (y > year || (y === year && m > monthIndex)) return false;
  }
  if (emp.endDate) {
    const y = Number(emp.endDate.slice(0, 4));
    const m = Number(emp.endDate.slice(5, 7)) - 1;
    if (y < year || (y === year && m < monthIndex)) return false;
    if (y === year && m === monthIndex && Number(emp.endDate.slice(8, 10)) <= 1) return false;
  }
  return true;
}

export function employeeProducesInMonth(emp: Employee, monthIndex: number, year: number): boolean {
  if (!emp.canRunCalls) return false;
  if (!employeeActiveInMonth(emp, monthIndex, year)) return false;
  if (emp.producingEndDate) {
    const y = Number(emp.producingEndDate.slice(0, 4));
    const m = Number(emp.producingEndDate.slice(5, 7)) - 1;
    if (y < year) return false;
    if (y === year && monthIndex >= m) return false;
  }
  return true;
}

export function producingTechCount(hiringOrState: HiringPlan | AppState, monthIndex: number): number {
  if ("employees" in hiringOrState) {
    return hiringOrState.employees.filter((e) => employeeProducesInMonth(e, monthIndex, hiringOrState.plan.year)).length;
  }
  return monthIndex < hiringStartMonth(hiringOrState) ? 2 : 3;
}

export function staffingTimeline(state: AppState) {
  return MONTH_SHORT.map((label, monthIndex) => {
    const producers = state.employees.filter((e) => employeeProducesInMonth(e, monthIndex, state.plan.year));
    const ownerProducing = producers.some((e) => e.id === "dustin");
    return {
      monthIndex,
      label,
      trucks: producers.length,
      names: producers.map((e) => e.name),
      ownerProducing,
      ownerRole: ownerProducing ? "producing" : "management",
    };
  });
}

export function newTechWageMonths(hiring: HiringPlan): number {
  return 12 - hiringStartMonth(hiring);
}

export function newTechLoadedMonthly(hiring: HiringPlan): number {
  const wages = hiring.hourlyWage * hoursPerMonthFromWeekly(hiring.paidHoursPerWeek);
  const burdened = wages * hiring.laborBurden;
  const truck = hiring.usesExistingTruck
    ? hiring.toolsMonthly + hiring.uniformsMonthly + hiring.extraMarketingMonthly
    : hiring.vehicleMonthly +
      hiring.fuelMonthly +
      hiring.insuranceMonthly +
      hiring.toolsMonthly +
      hiring.uniformsMonthly +
      hiring.extraMarketingMonthly;
  return burdened + truck;
}

export function newTechStartup(hiring: HiringPlan): number {
  return hiring.startupTools + hiring.startupUniforms;
}

export function expectedNewTechRevenue(hiring: HiringPlan, monthIndex: number, ticket: number, jobsPerDay: number, workingDays: number): number {
  const ramp = rampForMonth(hiring, monthIndex);
  return ramp * jobsPerDay * workingDays * ticket;
}

export function expectedNewTechCommission(hiring: HiringPlan, monthIndex: number, ticket: number, jobsPerDay: number, workingDays: number): number {
  const revenue = expectedNewTechRevenue(hiring, monthIndex, ticket, jobsPerDay, workingDays);
  const weeks = 52 / 12;
  const threshold = hiring.weeklySalesThreshold * weeks;
  return Math.max(0, revenue - threshold) * hiring.commissionRate;
}

export type ReadinessTone = "green" | "yellow" | "red";

export function hiringReadiness(state: AppState, today: string) {
  const hires = planHires(state.plan);
  const p = projectMonth(state, today);
  const loaded = hires.reduce((n, h) => n + newTechLoadedMonthly(h), 0);
  const startupCost = hires.reduce((n, h) => n + newTechStartup(h), 0);
  const cashMonths = Math.max(...hires.map((h) => h.cashMonthsRequired), 0);
  const cashNeed = hires.reduce((n, h) => n + newTechLoadedMonthly(h) * h.cashMonthsRequired, 0) + startupCost;
  const cash = state.settings.beginningBankBalance;
  const callNeed = Math.max(...hires.map((h) => h.minIncomingCallsPerDay), 0);
  const calls = state.settings.incomingCallsPerDay;
  const month = Math.max(0, Number(today.slice(5, 7)) - 1);
  const loadedThisMonth = hires.reduce((n, h) => n + newTechLoadedMonthly(h) * rampForMonth(h, month), 0);
  const profitAfter = p.projectedOperatingProfit - loadedThisMonth;
  const cashOk: ReadinessTone = cash >= cashNeed ? "green" : cash >= cashNeed * 0.7 ? "yellow" : "red";
  const callsOk: ReadinessTone = calls >= callNeed ? "green" : calls >= callNeed * 0.75 ? "yellow" : "red";
  const profitOk: ReadinessTone = profitAfter >= monthlyProfitGoal(state.settings.annualProfitGoal) ? "green" : profitAfter >= 0 ? "yellow" : "red";
  const overall: ReadinessTone = [cashOk, callsOk, profitOk].includes("red")
    ? "red"
    : [cashOk, callsOk, profitOk].includes("yellow")
      ? "yellow"
      : "green";
  return {
    loadedMonthlyCost: loaded,
    startupCost,
    cashNeed,
    cash,
    cashOk,
    calls,
    callNeed,
    callsOk,
    projectedProfitAfterHire: profitAfter,
    profitOk,
    overall,
    wageMonths: hires.map((h) => newTechWageMonths(h)),
    startDate: hires.map((h) => h.startDate).join(" / "),
    ownerOffTruckDate: state.plan.ownerOffTruckDate,
    cashMonths,
  };
}

export function pnlMonth(lines: BudgetLine[], month: number, field: "monthlyBudget" | "monthlyActual" | "monthlyForecast") {
  const revenue = groupMonth(lines, "revenue", month, field);
  const cogs = groupMonth(lines, "cogs", month, field);
  const opex = groupMonth(lines, "opex", month, field);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  const grossMargin = revenue > 0 ? grossProfit / revenue : null;
  const netMargin = revenue > 0 ? netProfit / revenue : null;
  return { revenue, cogs, opex, grossProfit, netProfit, grossMargin, netMargin };
}

export function pnlYear(lines: BudgetLine[], field: "monthlyBudget" | "monthlyActual" | "monthlyForecast") {
  const revenue = groupYear(lines, "revenue", field);
  const cogs = groupYear(lines, "cogs", field);
  const opex = groupYear(lines, "opex", field);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  return {
    revenue,
    cogs,
    opex,
    grossProfit,
    netProfit,
    grossMargin: revenue > 0 ? grossProfit / revenue : null,
    netMargin: revenue > 0 ? netProfit / revenue : null,
  };
}

export function latestViewMonth(lines: BudgetLine[], month: number) {
  const revenue = lines
    .filter((l) => l.group === "revenue")
    .reduce((n, l) => n + displayValue(l, month).value, 0);
  const cogs = lines.filter((l) => l.group === "cogs").reduce((n, l) => n + displayValue(l, month).value, 0);
  const opex = lines.filter((l) => l.group === "opex").reduce((n, l) => n + displayValue(l, month).value, 0);
  const hasActual = lines.some((l) => (l.monthlyActual[month] ?? 0) !== 0);
  return {
    revenue,
    cogs,
    opex,
    grossProfit: revenue - cogs,
    netProfit: revenue - cogs - opex,
    source: hasActual ? ("actual" as const) : ("forecast" as const),
  };
}

export function yearEndProjection(state: AppState) {
  const { lines } = state.plan;
  const months = Array.from({ length: 12 }, (_, m) => latestViewMonth(lines, m));
  const revenue = months.reduce((n, m) => n + m.revenue, 0);
  const cogs = months.reduce((n, m) => n + m.cogs, 0);
  const opex = months.reduce((n, m) => n + m.opex, 0);
  const netProfit = revenue - cogs - opex;
  const ytdActual = {
    revenue: groupYear(lines, "revenue", "monthlyActual"),
    netProfit:
      groupYear(lines, "revenue", "monthlyActual") -
      groupYear(lines, "cogs", "monthlyActual") -
      groupYear(lines, "opex", "monthlyActual"),
  };
  return { months, revenue, cogs, opex, grossProfit: revenue - cogs, netProfit, ytdActual };
}

export function proposedGoals(state: AppState) {
  const revenue = state.settings.annualRevenueGoal;
  const netMargin = state.settings.targetNetMargin;
  const growthRate = state.settings.growthReserveRate;
  const annualProfit = state.settings.annualProfitGoal;
  const monthlyRevenue = state.settings.monthlyRevenueGoal;
  return {
    approved: state.settings.goalsApproved,
    annualRevenue: revenue,
    monthlyRevenue,
    targetNetMargin: netMargin,
    growthReserveRate: growthRate,
    annualProfit,
    monthlyProfit: monthlyProfitGoal(annualProfit),
    annualGrowthAllocation: revenue * growthRate,
    monthlyGrowthAllocation: monthlyRevenue * growthRate,
    annualProfitAfterGrowth: annualProfit - revenue * growthRate,
    monthlyProfitAfterGrowth: monthlyProfitGoal(annualProfit) - monthlyRevenue * growthRate,
  };
}

export function growthReserveBalance(state: AppState) {
  const allocated = sum12(state.plan.growthAllocated ?? zeros());
  const goals = proposedGoals(state);
  const ytdRevenue = groupYear(state.plan.lines, "revenue", "monthlyActual");
  const ytdTarget = ytdRevenue * goals.growthReserveRate;
  const annualTarget = goals.annualGrowthAllocation;
  return {
    allocated,
    annualTarget,
    ytdTarget,
    remainingToAnnual: Math.max(0, annualTarget - allocated),
    progressVsAnnual: annualTarget > 0 ? allocated / annualTarget : 0,
    progressVsYtdRevenue: ytdTarget > 0 ? allocated / ytdTarget : allocated === 0 ? 0 : null,
  };
}

export function profitTracker(state: AppState, today: string) {
  const goals = proposedGoals(state);
  const goalAnnual = goals.annualProfit;
  const goalMonthly = goals.monthlyProfit;
  const month = Number(today.slice(5, 7)) - 1;
  const inPlanningYear = Number(today.slice(0, 4)) === state.plan.year;
  const live = projectMonth(state, today);
  const yep = yearEndProjection(state);
  const budgetMonth = pnlMonth(state.plan.lines, inPlanningYear ? month : 0, "monthlyBudget");
  const actualMonth = inPlanningYear ? latestViewMonth(state.plan.lines, month) : { netProfit: 0, revenue: 0, source: "forecast" as const };
  const liveProfit = live.projectedOperatingProfit;
  const actualMonthlyProfit = inPlanningYear && actualMonth.source === "actual" ? actualMonth.netProfit : liveProfit;
  const ytd = inPlanningYear ? yep.ytdActual.netProfit : 0;
  const projectedYearEnd = yep.netProfit;
  const remainingToGoal = Math.max(0, goalAnnual - projectedYearEnd);
  const liveRevenue = live.projectedMonthEndRevenue;
  const margin =
    actualMonth.revenue > 0
      ? actualMonthlyProfit / actualMonth.revenue
      : liveRevenue > 0
        ? liveProfit / liveRevenue
        : null;
  const growth = growthReserveBalance(state);
  const profitAfterGrowthAnnual = projectedYearEnd - growth.allocated;
  return {
    goalMonthly,
    goalAnnual,
    actualMonthlyProfit,
    ytdProfit: ytd,
    projectedYearEnd,
    netMargin: margin,
    targetNetMargin: goals.targetNetMargin,
    remainingToGoal,
    monthlyRevenueGoal: state.settings.monthlyRevenueGoal,
    weeklyBreakEven: state.settings.weeklyBreakEven,
    monthlyCashBreakEven: monthlyFromWeekly(state.settings.weeklyBreakEven),
    monthlyCostBreakEven: live.monthlyCostBreakEven,
    cashAvailable: state.settings.beginningBankBalance,
    revenueNeededToGoal: live.revenueRemainingToGoal,
    live,
    budgetMonth,
    inPlanningYear,
    planningYear: state.plan.year,
    goals,
    growth,
    profitAfterGrowthAnnual,
    accountingProfitUntouchedByGrowth: true,
  };
}

export function patchGrowthAllocated(plan: Plan2027, month: number, amount: number): Plan2027 {
  const next = (plan.growthAllocated ?? zeros()).slice();
  if (month < 0 || month > 11) return plan;
  next[month] = Number.isFinite(amount) ? amount : 0;
  return { ...plan, growthAllocated: next, lastForecastEdit: new Date().toISOString() };
}

export function plannedMarketingMonthly(state: AppState, technicians: number) {
  const base = state.settings.marketingBudgetMonthly;
  return technicians >= 3 ? base + state.plan.hiring.extraMarketingMonthly : base;
}

export function plannedVehicleMonthly(state: AppState, technicians: number) {
  const vehicle = state.plan.lines.find((l) => l.id === "vehicle");
  const jan = vehicle?.monthlyBudget[0] ?? 2400;
  const withThird = vehicle?.monthlyBudget[1] ?? jan + state.plan.hiring.vehicleMonthly;
  return technicians >= 3 ? withThird : jan;
}

export interface TargetWhatIfInput {
  annualRevenue: number;
  technicians: number;
  marketingMonthly: number;
  vehicleMonthly: number;
  materialsPct: number;
  subPct: number;
}

export function defaultTargetWhatIf(state: AppState): TargetWhatIfInput {
  const technicians = 3;
  return {
    annualRevenue: state.settings.annualRevenueGoal,
    technicians,
    marketingMonthly: plannedMarketingMonthly(state, technicians),
    vehicleMonthly: plannedVehicleMonthly(state, technicians),
    materialsPct: state.settings.assumedMaterialsPct,
    subPct: state.settings.assumedSubPct,
  };
}

export function lineAnnual(lines: BudgetLine[], id: string, field: "monthlyBudget" | "monthlyActual" | "monthlyForecast" = "monthlyBudget"): number {
  const found = lines.find((l) => l.id === id);
  return found ? lineTotal(found, field) : 0;
}

export function threeTechLaborAnnual(state: AppState, technicians = 3) {
  const hours = hoursPerMonthFromWeekly(40);
  const brien = state.employees.find((e) => e.id === "brien");
  const nathan = state.employees.find((e) => e.id === "nathan");
  const hires = technicians >= 3 ? planHires(state.plan) : [];
  const brienAnnual = (brien?.hourlyPay ?? 30) * hours * (brien?.laborBurden ?? 1.4) * 12;
  const apprenticeAnnual = (nathan?.hourlyPay ?? 18) * hours * (nathan?.laborBurden ?? 1.4) * 12;
  const hireAnnual = hires.map((h) => ({
    id: h.employeeId,
    name: h.displayName,
    months: newTechWageMonths(h),
    annual: h.hourlyWage * hours * h.laborBurden * newTechWageMonths(h),
  }));
  const hiredLabor = hireAnnual.reduce((n, h) => n + h.annual, 0);
  return {
    brienAnnual,
    apprenticeAnnual,
    tech3Annual: hireAnnual[0]?.annual ?? 0,
    tech4Annual: hireAnnual[1]?.annual ?? 0,
    hireAnnual,
    monthsAt3: hireAnnual[0]?.months ?? 0,
    fieldLabor: brienAnnual + apprenticeAnnual + hiredLabor,
    ownerWagesInField: 0,
  };
}

export function annualRevenueCapacity(state: AppState) {
  const months = MONTH_SHORT.map((label, i) => {
    const labor = laborMonth(state, i);
    const staff = staffingTimeline(state)[i];
    return {
      label,
      monthIndex: i,
      trucks: staff.trucks,
      names: staff.names,
      ownerProducing: staff.ownerProducing,
      revenue: labor.revenue,
      jobs: labor.jobs,
      laborExpense: labor.laborExpense,
    };
  });
  const revenue = months.reduce((n, m) => n + m.revenue, 0);
  const jobs = months.reduce((n, m) => n + m.jobs, 0);
  return { months, revenue, jobs, vsInitialTarget: revenue - state.settings.annualRevenueGoal };
}

export function revenueRequiredForNetMargin(state: AppState, targetMargin = state.settings.targetNetMargin) {
  const variableIds = new Set(["materials", "subcontractors", "merchant", "commissions"]);
  let fixed = 0;
  let variableAtBudgetRev = 0;
  for (const line of state.plan.lines) {
    if (line.group === "revenue") continue;
    const total = lineTotal(line, "monthlyBudget");
    if (variableIds.has(line.id)) variableAtBudgetRev += total;
    else fixed += total;
  }
  const budget = pnlYear(state.plan.lines, "monthlyBudget");
  const budgetRevenue = budget.revenue;
  const variableRatio = budgetRevenue > 0 ? variableAtBudgetRev / budgetRevenue : 0;
  const contributionToNet = 1 - targetMargin - variableRatio;
  const requiredRevenue = contributionToNet > 0 ? fixed / contributionToNet : null;
  const projected = budget.netProfit;
  const projectedMargin = budget.netMargin;
  const supportedAtInitialTarget =
    requiredRevenue != null && budgetRevenue + 0.5 >= requiredRevenue && (projectedMargin ?? 0) + 1e-9 >= targetMargin;
  const growthReserveAtRequired = requiredRevenue != null ? requiredRevenue * state.settings.growthReserveRate : null;
  const profitAtRequired = requiredRevenue != null ? requiredRevenue * targetMargin : null;
  return {
    targetMargin,
    fixedCosts: fixed,
    variableRatio,
    variableAtBudgetRev,
    budgetRevenue,
    projectedNetProfit: projected,
    projectedNetMargin: projectedMargin,
    requiredRevenue,
    gap: requiredRevenue != null ? Math.max(0, requiredRevenue - budgetRevenue) : null,
    supportedAtInitialTarget,
    growthReserveAtRequired,
    profitAtRequired,
    remainingAfterGrowthAtRequired:
      profitAtRequired != null && growthReserveAtRequired != null ? profitAtRequired - growthReserveAtRequired : null,
    impossible: contributionToNet <= 0,
  };
}

export function targetWhatIf(state: AppState, input: TargetWhatIfInput) {
  const goals = proposedGoals(state);
  const revenue = input.annualRevenue;
  const targetNetProfit = revenue * goals.targetNetMargin;
  const growthAllocation = revenue * goals.growthReserveRate;
  const remainingProfitAfterGrowth = targetNetProfit - growthAllocation;
  const maxTotalCosts = revenue - targetNetProfit;
  const labor = threeTechLaborAnnual(state, input.technicians);
  const materials = revenue * input.materialsPct;
  const subcontractors = revenue * input.subPct;
  const commissions = revenue * state.settings.assumedCommissionPct;
  const cogs = labor.fieldLabor + materials + subcontractors + commissions;
  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? grossProfit / revenue : null;
  const marketing = input.marketingMonthly * 12;
  const vehicles = input.vehicleMonthly * 12;
  const merchant = revenue * state.settings.processingFeeRate;
  const opexBudget = groupYear(state.plan.lines, "opex", "monthlyBudget");
  const advertisingBudget = lineAnnual(state.plan.lines, "advertising");
  const vehicleBudget = lineAnnual(state.plan.lines, "vehicle");
  const merchantBudget = lineAnnual(state.plan.lines, "merchant");
  const otherFixedOpex = Math.max(0, opexBudget - advertisingBudget - vehicleBudget - merchantBudget);
  const requiredForMargin = revenueRequiredForNetMargin(state, goals.targetNetMargin);
  const requiredOpex = maxTotalCosts - cogs;
  const plannedOpex = marketing + vehicles + merchant + otherFixedOpex;
  const projectedNetProfit = revenue - cogs - plannedOpex;
  const projectedNetMargin = revenue > 0 ? projectedNetProfit / revenue : null;
  const opexRoomAfterKnown = requiredOpex - marketing - vehicles - merchant;
  const requiredGrossMarginAtPlannedOpex = revenue > 0 ? (targetNetProfit + plannedOpex) / revenue : null;
  const requiredOpexAtGm60 = revenue * 0.6 - targetNetProfit;
  const requiredOpexAtGm65 = revenue * 0.65 - targetNetProfit;
  const gmMid = (state.settings.targetGrossMarginLow + state.settings.targetGrossMarginHigh) / 2;
  const requiredRevenueAtTargetGm =
    gmMid > goals.targetNetMargin ? plannedOpex / (gmMid - goals.targetNetMargin) : null;
  const requiredRevenueAtGm60 = 0.6 > goals.targetNetMargin ? plannedOpex / (0.6 - goals.targetNetMargin) : null;
  const requiredRevenueAtGm65 = 0.65 > goals.targetNetMargin ? plannedOpex / (0.65 - goals.targetNetMargin) : null;
  const gapToTarget = targetNetProfit - projectedNetProfit;
  return {
    revenue,
    technicians: input.technicians,
    targetNetProfit,
    growthAllocation,
    remainingProfitAfterGrowth,
    maxTotalCosts,
    labor,
    materials,
    subcontractors,
    commissions,
    cogs,
    grossProfit,
    grossMargin,
    marketing,
    vehicles,
    merchant,
    otherFixedOpex,
    plannedOpex,
    requiredOpex,
    opexRoomAfterKnown,
    projectedNetProfit,
    projectedNetMargin,
    requiredGrossMarginAtPlannedOpex,
    requiredOpexAtGm60,
    requiredOpexAtGm65,
    requiredRevenueAtTargetGm,
    requiredRevenueAtGm60,
    requiredRevenueAtGm65,
    gapToTarget,
    hitsTarget: gapToTarget <= 0.5,
    requiredForMargin,
    growthIsNotExpense: true,
    monthly: {
      revenue: revenue / 12,
      netProfit: targetNetProfit / 12,
      growthAllocation: growthAllocation / 12,
      remainingAfterGrowth: remainingProfitAfterGrowth / 12,
    },
  };
}

export function safeGrowthCash(state: AppState, today: string) {
  const goals = proposedGoals(state);
  const months = twelveMonthCash(state);
  const weeks = cashForecast(state.cashWeeks, state.settings.beginningBankBalance);
  const reserve = state.settings.cashReserveTarget;
  const monday = weekStartMonday(today);
  const thisWeek = weeks.find((w) => w.weekStart === monday) ?? weeks[0];
  const cashNow = thisWeek ? thisWeek.beginningBalance : state.settings.beginningBankBalance;
  const upcomingWeeks = weeks.filter((w) => w.weekStart >= monday).slice(0, 4);
  const weekPayroll = upcomingWeeks.reduce((n, w) => n + w.payroll + w.payrollTaxes + (w.ownerSalary ?? 0), 0);
  const weekTaxes = upcomingWeeks.reduce((n, w) => n + (w.taxes ?? 0), 0);
  const weekDebt = upcomingWeeks.reduce((n, w) => n + w.loanPayments + (w.debtPrincipal ?? 0), 0);
  const monthIdx = Math.max(0, Math.min(11, Number(today.slice(5, 7)) - 1));
  const thisMonth = months[monthIdx] ?? months[0];
  const payroll = weekPayroll > 0 ? weekPayroll : thisMonth?.payroll ?? 0;
  const taxes = weekTaxes > 0 ? weekTaxes : thisMonth?.taxes ?? 0;
  const debt = weekDebt > 0 ? weekDebt : thisMonth?.debtPrincipal ?? 0;
  const obligated = payroll + taxes + debt + reserve;
  const safeNow = cashNow - obligated;
  const minProjectedEnding = months.length ? Math.min(...months.map((m) => m.ending)) : cashNow;
  const safeFromProjection = minProjectedEnding - reserve;
  const safest = Math.min(safeNow, safeFromProjection);
  return {
    cashNow,
    reserve,
    upcomingPayroll: payroll,
    upcomingTaxes: taxes,
    upcomingDebt: debt,
    obligated,
    safeNow,
    minProjectedEnding,
    safeFromProjection,
    cashSafelyAvailable: Math.max(0, safest),
    monthlyGrowthTarget: goals.monthlyGrowthAllocation,
    canFundThisMonth: safest >= goals.monthlyGrowthAllocation,
    growthIsNotExpense: true,
  };
}

export interface LaborRow {
  employeeId: string;
  name: string;
  role: string;
  producing: boolean;
  paidHours: number;
  productiveHours: number;
  availableDays: number;
  laborCost: number;
  expectedJobs: number;
  expectedRevenue: number;
  expectedCommission: number;
  grossProfit: number;
  revenuePerPaidHour: number | null;
  laborCostPerJob: number | null;
  bookedCallsRequired: number | null;
}

export function laborMonth(state: AppState, monthIndex: number, jobsPerDayOverride?: number) {
  const days = state.settings.monthlyOperatingDays;
  const s = state.settings;
  const year = state.plan.year;
  const gm = (s.targetGrossMarginLow + s.targetGrossMarginHigh) / 2;
  const rows: LaborRow[] = [];
  for (const emp of state.employees.filter((e) => employeeActiveInMonth(e, monthIndex, year))) {
    const produces = employeeProducesInMonth(emp, monthIndex, year);
    const hire = hireForEmployee(state.plan, emp.id);
    const ramp = hire ? rampForMonth(hire, monthIndex) : produces ? 1 : 0;
    const pto = emp.ptoDaysPerYear / 12;
    const training = emp.trainingDaysPerYear / 12;
    const availableDays = Math.max(0, days - pto - training);
    const paidHours = emp.paidHoursPerDay * availableDays + emp.overtimeHoursMonthly;
    const productiveHours = produces ? emp.productiveHoursPerDay * availableDays * ramp : 0;
    const onPayroll = hire ? rampForMonth(hire, monthIndex) > 0 || hiringStartMonth(hire) <= monthIndex : true;
    const wage = onPayroll ? emp.hourlyPay * emp.laborBurden * paidHours : 0;
    const jobsPerDay = jobsPerDayOverride ?? emp.targetCallsPerDay;
    const completedJobs = produces ? jobsPerDay * availableDays * (1 - emp.callbackRate) * ramp : 0;
    const expectedRevenue = produces ? completedJobs * (emp.targetAvgTicket || s.averageTicket) : 0;
    const weeks = 52 / 12;
    const commission = produces
      ? Math.max(0, expectedRevenue - emp.weeklySalesThreshold * weeks) * emp.commissionRate
      : 0;
    const laborCost = emp.payInFixedOverhead ? 0 : wage + commission;
    const materials = expectedRevenue * s.assumedMaterialsPct;
    const subs = expectedRevenue * s.assumedSubPct;
    const grossProfit = expectedRevenue - laborCost - materials - subs;
    rows.push({
      employeeId: emp.id,
      name: emp.name,
      role: emp.id === "dustin" && !produces ? "owner-management" : emp.role,
      producing: produces,
      paidHours: onPayroll ? paidHours : 0,
      productiveHours,
      availableDays,
      laborCost: emp.payInFixedOverhead ? wage : laborCost,
      expectedJobs: completedJobs,
      expectedRevenue,
      expectedCommission: commission,
      grossProfit,
      revenuePerPaidHour: paidHours > 0 && expectedRevenue > 0 ? expectedRevenue / paidHours : null,
      laborCostPerJob: completedJobs > 0 ? (emp.payInFixedOverhead ? 0 : laborCost / completedJobs) : null,
      bookedCallsRequired: produces && emp.targetCloseRate > 0 ? Math.ceil(completedJobs / emp.targetCloseRate - 1e-12) : null,
    });
  }
  const producing = rows.filter((r) => r.producing);
  const revenue = producing.reduce((n, r) => n + r.expectedRevenue, 0);
  const labor = rows.reduce((n, r) => n + (r.producing && !state.employees.find((e) => e.id === r.employeeId)?.payInFixedOverhead ? r.laborCost : r.producing ? 0 : r.laborCost), 0);
  return {
    days,
    gm,
    rows,
    producingCount: producing.length,
    revenue,
    laborExpense: rows.reduce((n, r) => n + r.laborCost, 0),
    jobs: producing.reduce((n, r) => n + r.expectedJobs, 0),
    bookedRequired: producing.reduce((n, r) => n + (r.bookedCallsRequired ?? 0), 0),
  };
}

export function productionGrid(state: AppState, monthIndex: number) {
  return [2, 2.5, 3, 3.5].map((jobs) => {
    const m = laborMonth(state, monthIndex, jobs);
    return { jobsPerDay: jobs, ...m };
  });
}

export function serviceableHouseholds(city: "richardson" | "plano", m: MarketAssumptions): number {
  const hh = city === "richardson" ? m.richardsonHouseholds : m.planoHouseholds;
  const owner = city === "richardson" ? m.richardsonOwnerOccupied : m.planoOwnerOccupied;
  const detached = city === "richardson" ? m.richardsonDetachedShare : m.planoDetachedShare;
  if (m.serviceableMode === "all_households") return hh;
  if (m.serviceableMode === "owner_detached") return owner * detached;
  return owner;
}

export function cityDemand(city: "richardson" | "plano", m: MarketAssumptions) {
  const households = city === "richardson" ? m.richardsonHouseholds : m.planoHouseholds;
  const owner = city === "richardson" ? m.richardsonOwnerOccupied : m.planoOwnerOccupied;
  const serviceable = serviceableHouseholds(city, m);
  const jobs = serviceable * m.jobsPerServiceableHhYear;
  const revenue = jobs * m.averageTicket;
  const customers = city === "richardson" ? m.existingCustomersRichardson : m.existingCustomersPlano;
  const penetration = serviceable > 0 && customers > 0 ? customers / serviceable : 0;
  return { households, owner, serviceable, jobs, revenue, customers, penetration };
}

export function penetrationScenario(city: "richardson" | "plano", m: MarketAssumptions, rate: number, jobsPerTechDay: number, workingDays: number) {
  const base = cityDemand(city, m);
  const householdsTouched = base.serviceable * rate;
  const jobs = householdsTouched * m.jobsPerServiceableHhYear;
  const revenue = jobs * m.averageTicket;
  const techDays = jobsPerTechDay > 0 ? jobs / jobsPerTechDay : null;
  const techs = techDays != null ? techDays / workingDays : null;
  return { rate, householdsTouched, jobs, revenue, techs };
}

export function driveTimeEffect(m: MarketAssumptions, jobsPerDay: number) {
  if (!(m.driveMinutesSavedPerJob > 0) || !(m.minutesPerCompletedJob > 0)) {
    return { extraJobsPerTechDay: 0, note: "Set drive-time minutes saved to model productivity. No travel savings are assumed." };
  }
  const extra = (jobsPerDay * m.driveMinutesSavedPerJob) / m.minutesPerCompletedJob;
  return { extraJobsPerTechDay: extra, note: "Planning estimate from your drive-time inputs, not a measured result." };
}

export function geographicMix(jobs: Job[]) {
  const buckets: Record<ServiceCity, { revenue: number; jobs: number }> = {
    richardson: { revenue: 0, jobs: 0 },
    plano: { revenue: 0, jobs: 0 },
    other: { revenue: 0, jobs: 0 },
  };
  for (const job of jobs) {
    if (job.status === "canceled") continue;
    const rev = jobRevenue(job);
    const city = job.city ?? "other";
    buckets[city].revenue += rev;
    buckets[city].jobs += 1;
  }
  const total = buckets.richardson.revenue + buckets.plano.revenue + buckets.other.revenue;
  return { ...buckets, total, focusShare: total > 0 ? (buckets.richardson.revenue + buckets.plano.revenue) / total : null };
}

export function twelveMonthCash(state: AppState) {
  let cash = state.settings.beginningBankBalance;
  const reserve = state.settings.cashReserveTarget;
  return state.plan.monthlyCash.map((row, i) => {
    const beginning = cash;
    const inflows = row.collections;
    const outflows =
      row.payroll +
      row.materials +
      row.subcontractors +
      row.overhead +
      row.taxes +
      row.debtPrincipal +
      row.ownerSalary +
      row.ownerDistributions +
      row.other;
    const ending = beginning + inflows - outflows;
    cash = ending;
    const pnl = latestViewMonth(state.plan.lines, i);
    return {
      ...row,
      beginning,
      ending,
      inflows,
      outflows,
      belowReserve: ending < reserve,
      accountingProfit: pnl.netProfit,
      profitVsCash: ending - beginning - pnl.netProfit,
    };
  });
}

export function ownerPayPlan(state: AppState) {
  const months = twelveMonthCash(state);
  const reserve = state.settings.cashReserveTarget;
  const minEnding = Math.min(...months.map((m) => m.ending));
  const salary = state.settings.ownerMonthlySalary * 12;
  const distributions = state.settings.plannedMonthlyDistribution * 12;
  const maxExtraMonthly = Math.max(0, (minEnding - reserve) / 12);
  return {
    salaryMonthly: state.settings.ownerMonthlySalary,
    distributionMonthly: state.settings.plannedMonthlyDistribution,
    salaryAnnual: salary,
    distributionAnnual: distributions,
    minEndingCash: minEnding,
    reserve,
    maxExtraMonthly,
    safe: minEnding >= reserve,
    months,
  };
}

export function periodWindow(period: ScorecardPeriod, today: string): { from: string; to: string; label: string } {
  if (period === "day") return { from: today, to: today, label: "Today" };
  if (period === "week") {
    const from = weekStartMonday(today);
    return { from, to: addDays(from, 6), label: "This week" };
  }
  if (period === "month") return { from: monthStart(today), to: monthEnd(today), label: "This month" };
  if (period === "quarter") {
    const q = Math.floor((Number(today.slice(5, 7)) - 1) / 3) * 3 + 1;
    const from = `${today.slice(0, 4)}-${String(q).padStart(2, "0")}-01`;
    const toMonth = q + 2;
    const to = monthEnd(`${today.slice(0, 4)}-${String(toMonth).padStart(2, "0")}-01`);
    return { from, to, label: `Q${Math.floor((q - 1) / 3) + 1}` };
  }
  const from = `${today.slice(0, 4)}-01-01`;
  return { from, to: period === "ytd" ? today : `${today.slice(0, 4)}-12-31`, label: period === "ytd" ? "Year to date" : "Full year" };
}

export function periodSnapshot(state: AppState, today: string, period: ScorecardPeriod) {
  const { from, to, label } = periodWindow(period, today);
  const jobs = filterJobs(state.jobs, from, to);
  const revenue = jobs.reduce((n, j) => n + jobRevenue(j), 0);
  const logs = state.dailyLogs.filter((l) => l.date >= from && l.date <= to);
  const completedRevenue = Math.max(
    revenue,
    logs.reduce((n, l) => n + l.completedRevenue, 0),
  );
  const booked = jobs.filter((j) => j.status === "scheduled" || j.sold).length + logs.reduce((n, l) => n + l.booked, 0);
  return { from, to, label, completedRevenue, jobCount: jobs.length, booked };
}

export function marketingNeedForThreeTechs(state: AppState) {
  const s = state.settings;
  const days = s.monthlyOperatingDays;
  const jobsNeeded = 3 * ((s.targetCallsPerTechDayLow + s.targetCallsPerTechDayHigh) / 2) * days;
  const booked = s.closeRate > 0 ? jobsNeeded / s.closeRate : null;
  const leads = booked != null && s.bookingRate > 0 ? booked / s.bookingRate : booked != null && s.funnel.leadToBook > 0 ? booked / s.funnel.leadToBook : null;
  const spend = s.marketingBudgetMonthly;
  return { jobsNeeded, booked, leads, spend, extraSpendForThird: state.plan.hiring.extraMarketingMonthly };
}

export function upcomingBills(state: AppState, today: string) {
  const weeks = cashForecast(state.cashWeeks, state.settings.beginningBankBalance);
  const upcoming = weeks
    .filter((w) => w.weekStart >= weekStartMonday(today))
    .slice(0, 4)
    .map((w) => ({
      weekStart: w.weekStart,
      payroll: w.payroll + w.payrollTaxes,
      loans: w.loanPayments + (w.debtPrincipal ?? 0),
      other: w.other,
      majorBills: w.majorBills ?? "",
      ending: endingCash(w),
    }));
  return upcoming;
}

export function dailyAction(state: AppState, today: string) {
  const live = projectMonth(state, today);
  const week = dailyTargetRemaining(state, today, state.settings.weeklyRevenueGoal);
  const profitGoal = monthlyProfitGoal(state.settings.annualProfitGoal);
  const cash = twelveMonthCash(state);
  const thisMonthCash = cash[Math.max(0, Number(today.slice(5, 7)) - 1)];
  const weeks = cashForecast(state.cashWeeks, state.settings.beginningBankBalance);
  const thisWeek = weeks.find((w) => w.weekStart === weekStartMonday(today));
  const expectedCash = thisWeek ? endingCash(thisWeek) : thisMonthCash?.ending ?? state.settings.beginningBankBalance;
  const bills = upcomingBills(state, today);
  const todayJobs = state.jobs.filter((j) => j.date === today && j.status !== "canceled");
  const bookedToday = todayJobs.length;
  const extraCalls = Math.max(0, (live.callsPerDayToGoal ?? 0) - state.settings.incomingCallsPerDay);
  return {
    live,
    week,
    dailyRevenueNeed: week.remainingToday,
    weeklyRevenueNeed: week.weekRemaining,
    bookedToday,
    additionalCalls: extraCalls,
    onPaceBreakEven: !live.notProjectedToBreakEven,
    onPaceProfit: live.projectedOperatingProfit >= profitGoal,
    expectedCash,
    bills,
    profitGoal,
  };
}

export function estimatedOwnerOccupied(households: number, share: number): number {
  return households * share;
}

export function marketDefaults(): MarketAssumptions {
  return {
    richardsonHouseholds: CENSUS_HOUSEHOLDS.richardson.households,
    planoHouseholds: CENSUS_HOUSEHOLDS.plano.households,
    richardsonOwnerShare: CENSUS_HOUSING_DETAIL.richardson.ownerShare,
    planoOwnerShare: CENSUS_HOUSING_DETAIL.plano.ownerShare,
    richardsonOwnerOccupied: estimatedOwnerOccupied(CENSUS_HOUSEHOLDS.richardson.households, CENSUS_HOUSING_DETAIL.richardson.ownerShare),
    planoOwnerOccupied: estimatedOwnerOccupied(CENSUS_HOUSEHOLDS.plano.households, CENSUS_HOUSING_DETAIL.plano.ownerShare),
    richardsonMedianYearBuilt: CENSUS_HOUSING_DETAIL.richardson.medianYearBuilt,
    planoMedianYearBuilt: CENSUS_HOUSING_DETAIL.plano.medianYearBuilt,
    richardsonDetachedShare: CENSUS_HOUSING_DETAIL.richardson.detachedShare,
    planoDetachedShare: CENSUS_HOUSING_DETAIL.plano.detachedShare,
    jobsPerServiceableHhYear: 0.35,
    averageTicket: 1100,
    existingCustomersRichardson: 0,
    existingCustomersPlano: 0,
    driveMinutesSavedPerJob: 0,
    minutesPerCompletedJob: 45,
    serviceableMode: "owner_occupied",
  };
}

export function patchLine(
  plan: Plan2027,
  id: string,
  month: number,
  field: "monthlyBudget" | "monthlyActual" | "monthlyForecast",
  value: number,
): Plan2027 {
  if (field === "monthlyBudget" && plan.budgetLocked) return plan;
  const now = new Date().toISOString();
  return {
    ...plan,
    lines: plan.lines.map((l) => {
      if (l.id !== id) return l;
      const next = { ...l, [field]: l[field].map((n, i) => (i === month ? value : n)) };
      return next;
    }),
    lastBudgetEdit: field === "monthlyBudget" ? now : plan.lastBudgetEdit,
    lastActualEdit: field === "monthlyActual" ? now : plan.lastActualEdit,
    lastForecastEdit: field === "monthlyForecast" ? now : plan.lastForecastEdit,
  };
}
