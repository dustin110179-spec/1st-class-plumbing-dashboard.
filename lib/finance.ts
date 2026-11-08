import {
  addDays,
  monthEnd,
  monthKey,
  monthStart,
  todayISO,
  weekStartMonday,
  workingDaysInMonth,
  workingDaysInRange,
} from "./calendar";
import type {
  AppState,
  CashWeek,
  Employee,
  FunnelRates,
  Job,
  JobEconomics,
  MarketingSource,
  Membership,
  MissingInfo,
  MonthProjection,
  ScenarioAssumptions,
  Settings,
} from "./types";

export function ceilWhole(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.ceil(n - 1e-12);
}

export function monthlyFromWeekly(weekly: number): number {
  return (weekly * 52) / 12;
}

export function dailyFromWeekly(weekly: number, workdaysPerWeek = 5): number {
  if (workdaysPerWeek <= 0) return 0;
  return weekly / workdaysPerWeek;
}

export function jobsNeeded(revenueNeeded: number, avgTicket: number): number | null {
  if (!(avgTicket > 0)) return null;
  if (revenueNeeded <= 0) return 0;
  return ceilWhole(revenueNeeded / avgTicket);
}

export function callsNeeded(jobs: number | null, closeRate: number): number | null {
  if (jobs == null) return null;
  if (!(closeRate > 0)) return null;
  if (jobs <= 0) return 0;
  return ceilWhole(jobs / closeRate);
}

export function callsPerDay(calls: number | null, remainingDays: number): number | null {
  if (calls == null) return null;
  if (remainingDays <= 0) return calls > 0 ? null : 0;
  return ceilWhole(calls / remainingDays);
}

export function markupFromMargin(margin: number): number | null {
  if (!(margin < 1)) return null;
  return margin / (1 - margin);
}

export function marginFromMarkup(markup: number): number | null {
  if (!(markup > -1) || 1 + markup === 0) return null;
  return markup / (1 + markup);
}

export function priceFromCostAndMargin(cost: number, margin: number): number | null {
  if (!(margin < 1)) return null;
  return cost / (1 - margin);
}

export function priceFromCostAndMarkup(cost: number, markup: number): number {
  return cost * (1 + markup);
}

/**
 * Minimum selling PRICE (list) so that after discount, processing, and job costs,
 * collected sales achieve target gross margin.
 *
 * net = list * (1 - discount)
 * processing = net * processingRate
 * GM = (net - costs - processing) / net = target
 * list = costs / ((1-discount) * (1 - processingRate - target))
 */
export function minListPrice(args: {
  jobCosts: number;
  targetMargin: number;
  processingRate: number;
  discount: number;
}): number | null {
  const keep = (1 - args.discount) * (1 - args.processingRate - args.targetMargin);
  if (!(keep > 0)) return null;
  if (!(args.jobCosts >= 0)) return null;
  return args.jobCosts / keep;
}

export function loadedWage(employee: Employee): number {
  return employee.hourlyPay * employee.laborBurden;
}

export function laborCountsAsVariable(employee: Employee, settings: Settings): boolean {
  if ((employee.role === "owner" || employee.id === "dustin") && settings.overheadIncludesOwnerSalary) return false;
  if (employee.id === "noah" && settings.overheadIncludesNoahSalary) return false;
  return !employee.payInFixedOverhead;
}

export function variableLaborDollars(employee: Employee, hours: number, settings: Settings): number {
  if (hours <= 0 || !laborCountsAsVariable(employee, settings)) return 0;
  return hours * loadedWage(employee);
}

export function fixedOperatingExpenses(state: AppState): number {
  const s = state.settings;
  let fixed = s.monthlyFixedOverhead;
  if (!s.overheadIncludesMarketing) {
    const spend = state.marketing.reduce((n, m) => n + m.monthlySpend, 0);
    fixed += spend > 0 ? spend : s.marketingBudgetMonthly;
  }
  if (!s.overheadIncludesSoftware) fixed += s.softwareMonthly;
  if (!s.overheadIncludesLoans) fixed += s.loanMonthly;
  if (!s.overheadIncludesOwnerSalary) {
    const owner = state.employees.find((e) => e.role === "owner");
    if (owner) fixed += owner.ownerCompMonthly;
  }
  if (!s.overheadIncludesNoahSalary) {
    const noah = state.employees.find((e) => e.id === "noah");
    if (noah) fixed += noah.ownerCompMonthly;
  }
  return fixed;
}

export function costBreakEvenRevenue(fixed: number, contributionMargin: number | null): number | null {
  if (contributionMargin == null || !(contributionMargin > 0) || !(fixed >= 0)) return null;
  return fixed / contributionMargin;
}

/** Forecast variable costs on one typical sold ticket. Dustin/Noah pay is not included when it sits in fixed overhead. */
export function forecastUnitEconomics(state: AppState, ticket: number) {
  const s = state.settings;
  const producers = producingTechs(state.employees);
  const laborPerJob =
    producers.length === 0
      ? 0
      : producers.reduce((sum, tech) => {
          const lead = variableLaborDollars(tech, s.assumedPaidHoursPerSoldJob, s);
          const helpers = helpersOn(state.employees, tech.id);
          const helper = helpers.reduce(
            (h, emp) => h + variableLaborDollars(emp, s.assumedHelperHoursPerSoldJob, s),
            0,
          );
          return sum + lead + helper;
        }, 0) / producers.length;
  const materials = ticket * s.assumedMaterialsPct;
  const subs = ticket * s.assumedSubPct;
  const processing = ticket * s.processingFeeRate;
  const commission = ticket * s.assumedCommissionPct;
  const otherVariable = ticket * s.assumedOtherVariablePct;
  const cogs = laborPerJob + materials + subs;
  const variable = cogs + processing + commission + otherVariable;
  return {
    laborPerJob,
    materials,
    subs,
    processing,
    commission,
    otherVariable,
    cogs,
    variable,
    grossMargin: ticket > 0 ? (ticket - cogs) / ticket : null,
    contributionMargin: ticket > 0 ? (ticket - variable) / ticket : null,
  };
}

export function producingTechs(employees: Employee[], asOf = todayISO()): Employee[] {
  return employees.filter((e) => {
    if (!e.active || !e.canRunCalls) return false;
    if (e.startDate && e.startDate > asOf) return false;
    if (e.endDate && e.endDate < asOf) return false;
    if (e.producingEndDate && e.producingEndDate <= asOf) return false;
    return true;
  });
}

export function helpersOn(employees: Employee[], techId: string): Employee[] {
  return employees.filter((e) => e.active && e.assignedToId === techId);
}

export function jobRevenue(job: Job): number {
  if (job.completedRevenue > 0) return job.completedRevenue;
  if (job.sold && job.soldRevenue > 0) return job.soldRevenue;
  return 0;
}

export function earnedRevenue(jobs: Job[]): {
  sold: number;
  completed: number;
  invoiced: number;
  collected: number;
} {
  let sold = 0;
  let completed = 0;
  let invoiced = 0;
  let collected = 0;
  for (const job of jobs) {
    if (job.status === "canceled") continue;
    if (job.sold) sold += job.soldRevenue || job.completedRevenue || 0;
    if (job.status === "completed") completed += job.completedRevenue || job.soldRevenue || 0;
    invoiced += job.invoicedRevenue || 0;
    collected += job.collectedRevenue || 0;
  }
  return { sold, completed, invoiced, collected };
}

export function weeklyCommission(args: {
  weeklySoldRevenue: number;
  threshold: number;
  rate: number;
}): number {
  if (!(args.rate > 0)) return 0;
  return Math.max(0, args.weeklySoldRevenue - args.threshold) * args.rate;
}

function weekKey(date: string): string {
  return weekStartMonday(date);
}

export function commissionsByJob(jobs: Job[], employees: Employee[]): Map<string, number> {
  const byTechWeek = new Map<string, Job[]>();
  for (const job of jobs) {
    if (!job.sold || job.status === "canceled") continue;
    const key = `${job.technicianId}|${weekKey(job.date)}`;
    const list = byTechWeek.get(key) ?? [];
    list.push(job);
    byTechWeek.set(key, list);
  }
  const out = new Map<string, number>();
  const empById = new Map(employees.map((e) => [e.id, e]));
  for (const [key, list] of byTechWeek) {
    const techId = key.split("|")[0];
    const emp = empById.get(techId);
    if (!emp || emp.commissionRate <= 0) continue;
    const ordered = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    let remainingFree = emp.weeklySalesThreshold;
    for (const job of ordered) {
      const rev = job.soldRevenue || job.completedRevenue || 0;
      const taxable = Math.max(0, rev - remainingFree);
      remainingFree = Math.max(0, remainingFree - rev);
      out.set(job.id, taxable * emp.commissionRate);
    }
  }
  return out;
}

export function jobEconomics(
  job: Job,
  employees: Employee[],
  settings: Settings,
  commissionMap?: Map<string, number>,
): JobEconomics {
  const missing: MissingInfo[] = [];
  const empById = new Map(employees.map((e) => [e.id, e]));
  const tech = empById.get(job.technicianId);
  const revenue = jobRevenue(job);
  if (!(revenue > 0) && job.sold) {
    missing.push({ field: "soldRevenue", reason: "Sold job is missing revenue." });
  }
  let techLabor = 0;
  let helperLabor = 0;
  let overheadLaborExcluded = 0;
  if (!tech) {
    missing.push({ field: "technicianId", reason: "Technician not found." });
  } else if (job.paidHoursTech > 0) {
    const loaded = job.paidHoursTech * loadedWage(tech);
    if (!laborCountsAsVariable(tech, settings)) overheadLaborExcluded += loaded;
    else techLabor = loaded;
  } else if (job.status === "completed") {
    missing.push({ field: "paidHoursTech", reason: "Completed job is missing paid technician hours." });
  }
  for (const helperId of job.helperIds) {
    const helper = empById.get(helperId);
    const hours = job.paidHoursHelpers[helperId] ?? 0;
    if (!helper) continue;
    if (hours > 0) {
      const loaded = hours * loadedWage(helper);
      if (!laborCountsAsVariable(helper, settings)) overheadLaborExcluded += loaded;
      else helperLabor += loaded;
    } else if (job.status === "completed") {
      missing.push({
        field: `paidHoursHelpers.${helperId}`,
        reason: `Missing paid hours for ${helper.name}.`,
      });
    }
  }
  const crewHours =
    job.paidHoursTech + job.helperIds.reduce((s, id) => s + (job.paidHoursHelpers[id] ?? 0), 0);
  const commission = commissionMap?.get(job.id) ?? 0;
  const processing = revenue * settings.processingFeeRate;
  const otherVariable = job.callback ? job.callbackCost : 0;
  const grossProfit = revenue - techLabor - helperLabor - job.materials - job.subcontractors;
  const contributionProfit = grossProfit - processing - commission - otherVariable;
  const grossMargin = revenue > 0 ? grossProfit / revenue : null;
  const contributionMargin = revenue > 0 ? contributionProfit / revenue : null;
  const laborPct = revenue > 0 ? (techLabor + helperLabor) / revenue : null;
  return {
    jobId: job.id,
    revenue,
    techLabor,
    helperLabor,
    overheadLaborExcluded,
    materials: job.materials,
    subcontractors: job.subcontractors,
    processing,
    commission,
    otherVariable,
    grossProfit,
    grossMargin,
    contributionProfit,
    contributionMargin,
    revenuePerCrewHour: crewHours > 0 && revenue > 0 ? revenue / crewHours : null,
    laborPct,
    laborHigh: laborPct != null && laborPct > settings.laborPercentWarning,
    missing,
  };
}

export function filterJobs(jobs: Job[], from: string, to: string): Job[] {
  return jobs.filter((j) => j.date >= from && j.date <= to && j.status !== "canceled");
}

export function mtdLogs(state: AppState, from: string, to: string) {
  const logs = state.dailyLogs.filter((l) => l.date >= from && l.date <= to);
  return logs.reduce(
    (acc, l) => {
      acc.incomingLeads += l.incomingLeads;
      acc.booked += l.booked;
      acc.completed += l.completed;
      acc.soldJobs += l.soldJobs;
      acc.collectedRevenue += l.collectedRevenue;
      acc.completedRevenue += l.completedRevenue;
      return acc;
    },
    {
      incomingLeads: 0,
      booked: 0,
      completed: 0,
      soldJobs: 0,
      collectedRevenue: 0,
      completedRevenue: 0,
    },
  );
}

function ticketFromJobs(jobs: Job[]): number | null {
  const sold = jobs.filter((j) => j.sold && jobRevenue(j) > 0);
  if (sold.length === 0) return null;
  return sold.reduce((s, j) => s + jobRevenue(j), 0) / sold.length;
}

function closeRateFromActivity(
  logs: ReturnType<typeof mtdLogs>,
  jobs: Job[],
  assumed: number,
): { rate: number | null; usingAssumed: boolean } {
  const completedFromJobs = jobs.filter((j) => j.status === "completed" || j.sold).length;
  const soldFromJobs = jobs.filter((j) => j.sold).length;
  const completed = logs.completed || completedFromJobs;
  const sold = logs.soldJobs || soldFromJobs;
  if (completed > 0 && sold >= 0) {
    return { rate: sold / completed, usingAssumed: false };
  }
  if (logs.incomingLeads > 0 && sold > 0) {
    return { rate: sold / logs.incomingLeads, usingAssumed: false };
  }
  return { rate: assumed, usingAssumed: true };
}

export function funnelSoldFromIncoming(incoming: number, funnel: FunnelRates, closeRate: number): number {
  const stageClose = funnel.completeToSold || closeRate;
  return incoming * funnel.leadToBook * funnel.bookToComplete * stageClose;
}

export function forecastDailyRevenue(settings: Settings, avgTicket: number, closeRate: number): number {
  const soldCalls = settings.incomingCallsPerDay * closeRate;
  return soldCalls * avgTicket;
}

function scheduledRevenueOn(jobs: Job[], date: string): number {
  return jobs
    .filter((j) => j.date === date && j.status !== "canceled")
    .reduce((s, j) => s + (j.sold ? jobRevenue(j) || j.estimatedRevenue : j.estimatedRevenue), 0);
}

export function projectMonth(state: AppState, today = todayISO()): MonthProjection {
  const { settings, jobs, employees } = state;
  const missing: MissingInfo[] = [];
  const start = monthStart(today);
  const end = monthEnd(today);
  const working = workingDaysInMonth(today, settings);
  const elapsed = working.filter((d) => d < today);
  const remaining = working.filter((d) => d >= today);
  const monthJobs = filterJobs(jobs, start, end);
  const completedJobs = monthJobs.filter((j) => j.status === "completed");
  const earned = earnedRevenue(monthJobs);
  const logs = mtdLogs(state, start, today);
  const monthlyCashBreakEven = monthlyFromWeekly(settings.weeklyBreakEven);
  const mtdCompletedRevenue = Math.max(earned.completed, logs.completedRevenue);
  const mtdSoldRevenue = Math.max(earned.sold, logs.completedRevenue);
  const mtdCollectedRevenue = Math.max(earned.collected, logs.collectedRevenue);
  const mtdInvoicedRevenue = earned.invoiced;
  const jobTicket = ticketFromJobs(monthJobs);
  const currentAvgTicket = jobTicket ?? settings.averageTicket;
  const usingAssumedTicket = jobTicket == null;
  const close = closeRateFromActivity(logs, monthJobs, settings.closeRate);
  const currentCloseRate = close.rate;
  const usingAssumedClose = close.usingAssumed;
  if (usingAssumedTicket) {
    missing.push({
      field: "averageTicket",
      reason: "No sold jobs this month yet — using the assumed average ticket from Settings.",
    });
  }
  if (usingAssumedClose) {
    missing.push({
      field: "closeRate",
      reason: "No completed-call history this month yet — using the assumed close rate from Settings.",
    });
  }

  const closeForCalls = currentCloseRate && currentCloseRate > 0 ? currentCloseRate : null;
  const assumedDaily = forecastDailyRevenue(settings, currentAvgTicket, closeForCalls ?? settings.closeRate);
  const actualDaysWithRevenue = elapsed.filter((d) => {
    const dayJobs = monthJobs.filter((j) => j.date === d);
    const log = state.dailyLogs.find((l) => l.date === d);
    return jobRevenueSum(dayJobs) > 0 || (log?.completedRevenue ?? 0) > 0;
  });
  const actualDailyAvg =
    actualDaysWithRevenue.length > 0
      ? actualDaysWithRevenue.reduce((s, d) => {
          const dayJobs = monthJobs.filter((j) => j.date === d);
          const log = state.dailyLogs.find((l) => l.date === d);
          return s + Math.max(jobRevenueSum(dayJobs), log?.completedRevenue ?? 0);
        }, 0) / actualDaysWithRevenue.length
      : null;
  const forecastDailyRevenueValue = actualDailyAvg ?? assumedDaily;
  const todayRevenueLogged =
    jobRevenueSum(monthJobs.filter((j) => j.date === today)) > 0 ||
    (state.dailyLogs.find((l) => l.date === today)?.completedRevenue ?? 0) > 0;

  const dailyAdds = remaining.map((day) => {
    const scheduled = scheduledRevenueOn(monthJobs, day);
    const alreadyCountedToday = day === today && todayRevenueLogged;
    return alreadyCountedToday ? 0 : scheduled > 0 ? scheduled : forecastDailyRevenueValue;
  });
  const projectedMonthEndRevenue = mtdCompletedRevenue + dailyAdds.reduce((s, n) => s + n, 0);

  const costJobs = completedJobs.filter(
    (j) => j.paidHoursTech > 0 || j.materials > 0 || j.subcontractors > 0,
  );
  const commissionMap = commissionsByJob(monthJobs, employees);
  const actualEcon = costJobs.map((j) => jobEconomics(j, employees, settings, commissionMap));
  const hasCostData = actualEcon.length > 0;
  const actualRev = actualEcon.reduce((s, e) => s + e.revenue, 0);
  const actualGp = actualEcon.reduce((s, e) => s + e.grossProfit, 0);
  const actualCp = actualEcon.reduce((s, e) => s + e.contributionProfit, 0);
  const unit = forecastUnitEconomics(state, currentAvgTicket);
  const grossMargin = hasCostData && actualRev > 0 ? actualGp / actualRev : unit.grossMargin;
  const contributionMargin =
    hasCostData && actualRev > 0 ? actualCp / actualRev : unit.contributionMargin;
  if (!hasCostData) {
    missing.push({
      field: "jobCosts",
      reason:
        "No job-level labor/material costs yet. Contribution margin is a forecast from assumed hours, materials, subs, processing, and commissions. Dustin’s and Noah’s pay are not counted again as variable labor because they sit in the $47,000 fixed expenses.",
    });
  }

  const fixed = fixedOperatingExpenses(state);
  const monthlyCostBreakEven = costBreakEvenRevenue(fixed, contributionMargin);
  if (monthlyCostBreakEven == null) {
    missing.push({
      field: "contributionMargin",
      reason: "Cost-based break-even needs a positive contribution margin (revenue after variable costs). Enter job costs or check assumed hours and material percentages.",
    });
  }

  const primaryBreakEven = monthlyCostBreakEven ?? monthlyCashBreakEven;
  const revenueRemainingToBreakEven = Math.max(0, primaryBreakEven - mtdCompletedRevenue);
  const revenueRemainingToGoal = Math.max(0, settings.monthlyRevenueGoal - mtdCompletedRevenue);
  const jobsNeededToBreakEven = jobsNeeded(revenueRemainingToBreakEven, currentAvgTicket);
  const jobsNeededToGoal = jobsNeeded(revenueRemainingToGoal, currentAvgTicket);
  const callsNeededToBreakEven = closeForCalls ? callsNeeded(jobsNeededToBreakEven, closeForCalls) : null;
  const callsNeededToGoal = closeForCalls ? callsNeeded(jobsNeededToGoal, closeForCalls) : null;
  const remainingCount = remaining.length;
  const callsPerDayToBreakEven = callsPerDay(callsNeededToBreakEven, remainingCount);
  const callsPerDayToGoal = callsPerDay(callsNeededToGoal, remainingCount);

  let running = mtdCompletedRevenue;
  let breakEvenDate: string | null = monthlyCostBreakEven != null && mtdCompletedRevenue >= monthlyCostBreakEven ? today : null;
  remaining.forEach((day, i) => {
    running += dailyAdds[i];
    if (breakEvenDate == null && monthlyCostBreakEven != null && running >= monthlyCostBreakEven) {
      breakEvenDate = day;
    }
  });
  const notProjectedToBreakEven =
    monthlyCostBreakEven == null || projectedMonthEndRevenue < monthlyCostBreakEven;
  if (notProjectedToBreakEven) breakEvenDate = null;
  const reached = breakEvenDate;
  const workingDaysAfterBreakEven =
    reached == null ? null : remaining.filter((d) => d > reached).length;

  let status: MonthProjection["status"] = "red";
  let statusLabel = "Not projected to break even this month.";
  if (monthlyCostBreakEven == null) {
    status = "red";
    statusLabel = "Cannot project break-even until contribution margin is known.";
  } else if (projectedMonthEndRevenue >= settings.monthlyRevenueGoal) {
    status = "green";
    statusLabel = "Projected to exceed the monthly revenue goal.";
  } else if (projectedMonthEndRevenue >= monthlyCostBreakEven) {
    status = "yellow";
    statusLabel = "Projected to cover fixed expenses but miss the monthly revenue goal.";
  }

  const requiredToDate =
    working.length === 0 || monthlyCostBreakEven == null
      ? 0
      : monthlyCostBreakEven * (elapsed.length / working.length);
  const requiredGoalToDate =
    working.length === 0 ? 0 : settings.monthlyRevenueGoal * (elapsed.length / working.length);
  const paceVsBreakEven = mtdCompletedRevenue - requiredToDate;
  const paceVsGoal = mtdCompletedRevenue - requiredGoalToDate;

  const cm = contributionMargin ?? 0;
  const projectedGrossProfit = projectedMonthEndRevenue * (grossMargin ?? 0);
  const projectedContributionProfit = projectedMonthEndRevenue * cm;
  const projectedOperatingProfit = projectedContributionProfit - fixed;
  const projectedCashProfit = projectedMonthEndRevenue - monthlyCashBreakEven;
  const profitPerDollarAboveBreakEven = contributionMargin != null && contributionMargin > 0 ? contributionMargin : null;
  const profitOnRevenueAboveBreakEven =
    monthlyCostBreakEven != null && projectedMonthEndRevenue > monthlyCostBreakEven && profitPerDollarAboveBreakEven != null
      ? (projectedMonthEndRevenue - monthlyCostBreakEven) * profitPerDollarAboveBreakEven
      : 0;

  const techDays = producingTechs(employees).length * Math.max(1, elapsed.length || remaining.length);
  const revenuePerTechDay =
    techDays > 0 ? (mtdCompletedRevenue > 0 ? mtdCompletedRevenue / Math.max(1, elapsed.length * producingTechs(employees).length) : null) : null;

  const hasActuals = mtdCompletedRevenue > 0 || monthJobs.length > 0 || logs.incomingLeads > 0;
  const dataMode: MonthProjection["dataMode"] = state.sampleMode
    ? "sample"
    : hasActuals
      ? "actual"
      : "forecast";

  return {
    today,
    monthKey: monthKey(today),
    workingDaysInMonth: working,
    workingDaysElapsed: elapsed,
    workingDaysRemaining: remaining,
    mtdCompletedRevenue,
    mtdSoldRevenue,
    mtdCollectedRevenue,
    mtdInvoicedRevenue,
    monthlyCashBreakEven,
    monthlyCostBreakEven,
    fixedOperatingExpenses: fixed,
    contributionMargin,
    projectedContributionProfit,
    profitPerDollarAboveBreakEven,
    profitOnRevenueAboveBreakEven,
    monthlyRevenueGoal: settings.monthlyRevenueGoal,
    revenueRemainingToBreakEven,
    revenueRemainingToGoal,
    currentAvgTicket,
    currentCloseRate,
    usingAssumedTicket,
    usingAssumedClose,
    jobsNeededToBreakEven,
    callsNeededToBreakEven,
    jobsNeededToGoal,
    callsNeededToGoal,
    callsPerDayToBreakEven,
    callsPerDayToGoal,
    incomingLeads: logs.incomingLeads,
    booked: logs.booked,
    completedAppointments: logs.completed || completedJobs.length,
    soldJobs: logs.soldJobs || monthJobs.filter((j) => j.sold).length,
    forecastDailyRevenue: forecastDailyRevenueValue,
    projectedMonthEndRevenue,
    projectedBreakEvenDate: breakEvenDate,
    workingDaysAfterBreakEven,
    notProjectedToBreakEven,
    paceVsBreakEven,
    paceVsGoal,
    status,
    statusLabel,
    projectedCashProfit,
    projectedGrossProfit,
    projectedOperatingProfit,
    grossMargin,
    revenuePerTechDay:
      elapsed.length > 0 && producingTechs(employees).length > 0
        ? mtdCompletedRevenue / (elapsed.length * producingTechs(employees).length)
        : null,
    dataMode,
    missing,
  };
}

function jobRevenueSum(jobs: Job[]): number {
  return jobs.reduce((s, j) => s + jobRevenue(j), 0);
}

export function simulate(s: ScenarioAssumptions, processingRate: number, membershipAnnual: number) {
  const incoming = s.incomingCallsPerDay * s.workingDays;
  const soldJobs = ceilWhole(incoming * s.closeRate);
  const revenue = soldJobs * s.averageTicket;
  const capacityJobs = ceilWhole(s.technicians * s.callsPerTechDay * s.workingDays * s.closeRate);
  const capacityRevenue = s.technicians * s.callsPerTechDay * s.workingDays * s.averageTicket;
  const usedRevenue = Math.min(revenue, capacityRevenue);
  const laborHours = s.technicians * s.workingDays * 8;
  const techLabor = laborHours * s.laborWage * s.laborBurden;
  const apprenticeLabor = s.hireApprentice ? s.workingDays * 8 * (s.apprenticeWage || 18) * s.laborBurden : 0;
  const laborCost = techLabor + apprenticeLabor;
  const materials = usedRevenue * s.materialCostPct;
  const subs = usedRevenue * s.subCostPct;
  const callbacks = usedRevenue * s.callbackRate * 0.35;
  const processing = usedRevenue * processingRate;
  const membershipGp = s.membershipSalesPerMonth * membershipAnnual * 0.7;
  const marketing = s.marketingBudget;
  const grossProfit = usedRevenue * s.grossMargin - callbacks + membershipGp;
  const contributionProfit = grossProfit - processing;
  const contributionMargin = usedRevenue > 0 ? contributionProfit / usedRevenue : 0;
  const operatingProfit = contributionProfit - s.monthlyOverhead;
  const beRevenue =
    contributionMargin > 0 ? s.monthlyOverhead / contributionMargin : Infinity;
  const daily = usedRevenue / Math.max(s.workingDays, 1);
  const beDayIndex = daily > 0 ? ceilWhole(Math.min(beRevenue, usedRevenue) / daily) : null;
  const requiredCalls = s.closeRate > 0 ? ceilWhole(soldJobs / s.closeRate) : null;
  return {
    incoming,
    soldJobs,
    revenue: usedRevenue,
    unconstrainedRevenue: revenue,
    capacityJobs,
    laborCost,
    apprenticeLabor,
    materials,
    subs,
    processing,
    callbacks,
    membershipGp,
    marketing,
    grossProfit,
    operatingProfit,
    breakEvenRevenue: beRevenue,
    breakEvenDay: beDayIndex != null && beDayIndex <= s.workingDays ? beDayIndex : null,
    contributionProfit,
    contributionMargin,
    notProjectedToBreakEven: !(Number.isFinite(beRevenue) && usedRevenue >= beRevenue),
    revenuePerTech: s.technicians > 0 ? usedRevenue / s.technicians : 0,
    revenuePerCrewHour: laborHours > 0 ? usedRevenue / laborHours : 0,
    cashGeneration: operatingProfit,
    laborPct: usedRevenue > 0 ? laborCost / usedRevenue : 0,
    requiredCalls,
  };
}

export function membershipMetrics(memberships: Membership[], settings: Settings, today: string) {
  const active = memberships.filter((m) => m.status === "active");
  const month = monthKey(today);
  const newThisMonth = memberships.filter((m) => m.startDate.startsWith(month) && m.status === "active");
  const canceledThisMonth = memberships.filter(
    (m) => m.status === "canceled" && m.canceledDate.startsWith(month),
  );
  const mrr = active.reduce(
    (s, m) => s + (m.billing === "monthly" ? m.amount : m.amount / 12),
    0,
  );
  const arr = active.reduce(
    (s, m) => s + (m.billing === "annual" ? m.amount : m.amount * 12),
    0,
  );
  const fulfillment = active.reduce((s, m) => s + m.fulfillmentCost, 0);
  const discountCostEstimate = 0;
  const contribution = mrr * 12 - fulfillment - discountCostEstimate;
  const remainingToGoal = Math.max(0, settings.membershipGrowthGoal - active.length);
  const weeksLeft = 4;
  return {
    active: active.length,
    newThisMonth: newThisMonth.length,
    canceledThisMonth: canceledThisMonth.length,
    mrr,
    arr,
    fulfillment,
    contribution,
    remainingToGoal,
    weeklyNeeded: ceilWhole(remainingToGoal / Math.max(weeksLeft, 1)),
  };
}

export function marketingMetrics(sources: MarketingSource[], settings: Settings) {
  return sources.map((s) => {
    const cpl = s.leads > 0 ? s.monthlySpend / s.leads : null;
    const cpa = s.booked > 0 ? s.monthlySpend / s.booked : null;
    const cac = s.sold > 0 ? s.monthlySpend / s.sold : null;
    const roms = s.monthlySpend > 0 ? s.revenue / s.monthlySpend : null;
    const gpAfter = s.grossProfit - s.monthlySpend;
    const avgTicket = s.sold > 0 ? s.revenue / s.sold : settings.averageTicket;
    const gpPerJob = s.sold > 0 ? s.grossProfit / s.sold : avgTicket * ((settings.targetGrossMarginLow + settings.targetGrossMarginHigh) / 2);
    const extraJobsToJustify =
      gpPerJob > 0 && gpAfter < 0 ? ceilWhole(Math.abs(gpAfter) / gpPerJob) : 0;
    const profitable = gpAfter > 0 || (s.monthlySpend === 0 && s.revenue > 0);
    return {
      ...s,
      cpl,
      cpa,
      cac,
      roms,
      gpAfter,
      extraJobsToJustify,
      profitable,
    };
  });
}

export function cashForecast(weeks: CashWeek[], beginning: number): CashWeek[] {
  const sorted = [...weeks].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  let bal = beginning;
  return sorted.map((w, i) => {
    const start = i === 0 ? beginning : bal;
    const inflows = w.collections + w.deposits;
    const outflows =
      w.payroll +
      w.payrollTaxes +
      w.materials +
      w.subcontractors +
      w.marketing +
      w.software +
      w.loanPayments +
      (w.ownerSalary ?? 0) +
      w.ownerDistributions +
      (w.debtPrincipal ?? 0) +
      (w.taxes ?? 0) +
      w.other;
    const ending = start + inflows - outflows;
    bal = ending;
    return { ...w, beginningBalance: start };
  });
}

export function endingCash(week: CashWeek): number {
  return (
    week.beginningBalance +
    week.collections +
    week.deposits -
    week.payroll -
    week.payrollTaxes -
    week.materials -
    week.subcontractors -
    week.marketing -
    week.software -
    week.loanPayments -
    (week.ownerSalary ?? 0) -
    week.ownerDistributions -
    (week.debtPrincipal ?? 0) -
    (week.taxes ?? 0) -
    week.other
  );
}

export function techScorecard(
  state: AppState,
  employeeId: string,
  from: string,
  to: string,
) {
  const emp = state.employees.find((e) => e.id === employeeId);
  if (!emp) return null;
  const jobs = filterJobs(state.jobs, from, to).filter(
    (j) => j.technicianId === employeeId || j.helperIds.includes(employeeId),
  );
  const asLead = jobs.filter((j) => j.technicianId === employeeId);
  const sold = asLead.filter((j) => j.sold);
  const completed = asLead.filter((j) => j.status === "completed");
  const soldRev = sold.reduce((s, j) => s + (j.soldRevenue || jobRevenue(j)), 0);
  const completedRev = completed.reduce((s, j) => s + jobRevenue(j), 0);
  const commissionMap = commissionsByJob(asLead, state.employees);
  const econ = asLead.map((j) => jobEconomics(j, state.employees, state.settings, commissionMap));
  const labor = econ.reduce((s, e) => s + e.techLabor + e.helperLabor, 0);
  const gp = econ.reduce((s, e) => s + e.grossProfit, 0);
  const paidHours = jobs.reduce((s, j) => {
    if (j.technicianId === employeeId) return s + j.paidHoursTech;
    return s + (j.paidHoursHelpers[employeeId] ?? 0);
  }, 0);
  const workingDays = workingDaysInRange(from, to, state.settings).length;
  const opportunities = asLead.length;
  const callbacks = asLead.filter((j) => j.callback).length;
  const memberships = asLead.filter((j) => j.membershipSold).length;
  const reviews = asLead.map((j) => j.reviewScore).filter((n): n is number => n != null);
  const gbb = asLead.filter((j) => j.optionsPresented === "all" || j.optionsPresented === "best").length;
  const financing = asLead.filter((j) => j.financingOffered).length;
  const missed = asLead.filter((j) => j.opportunityMissed || (!j.sold && j.status === "completed")).length;
  const commission = [...commissionMap.values()].reduce((s, n) => s + n, 0);
  const avgTicket = sold.length > 0 ? soldRev / sold.length : null;
  const close = opportunities > 0 ? sold.length / opportunities : null;
  return {
    employee: emp,
    soldRevenue: soldRev,
    completedRevenue: completedRev,
    avgTicket,
    closeRate: close,
    callsCompleted: completed.length,
    opportunities,
    revenuePerPaidHour: paidHours > 0 ? completedRev / paidHours : null,
    revenuePerWorkingDay: workingDays > 0 ? completedRev / workingDays : null,
    grossMargin: completedRev > 0 ? gp / completedRev : null,
    laborPct: completedRev > 0 ? labor / completedRev : null,
    membershipsSold: memberships,
    reviewAvg: reviews.length ? reviews.reduce((a, b) => a + b, 0) / reviews.length : null,
    reviewCount: reviews.length,
    callbackPct: asLead.length ? callbacks / asLead.length : null,
    gbbPresented: gbb,
    gbbPct: asLead.length ? gbb / asLead.length : null,
    financingOffered: financing,
    missed,
    commission,
    paidHours,
    thresholdMet:
      emp.weeklySalesThreshold > 0 ? soldRev >= emp.weeklySalesThreshold : null,
    weeklyThreshold: emp.weeklySalesThreshold,
    laborHigh: completedRev > 0 && labor / completedRev > state.settings.laborPercentWarning,
  };
}

export function crewScorecard(state: AppState, leadId: string, helperId: string, from: string, to: string) {
  const jobs = filterJobs(state.jobs, from, to).filter(
    (j) => j.technicianId === leadId && j.helperIds.includes(helperId),
  );
  const commissionMap = commissionsByJob(jobs, state.employees);
  const econ = jobs.map((j) => jobEconomics(j, state.employees, state.settings, commissionMap));
  const rev = econ.reduce((s, e) => s + e.revenue, 0);
  const hours = jobs.reduce(
    (s, j) => s + j.paidHoursTech + (j.paidHoursHelpers[helperId] ?? 0),
    0,
  );
  return {
    jobs: jobs.length,
    revenue: rev,
    grossProfit: econ.reduce((s, e) => s + e.grossProfit, 0),
    grossMargin: rev > 0 ? econ.reduce((s, e) => s + e.grossProfit, 0) / rev : null,
    revenuePerCrewHour: hours > 0 ? rev / hours : null,
    paidHours: hours,
  };
}

export function paceSeries(state: AppState, today: string) {
  const p = projectMonth(state, today);
  const start = monthStart(today);
  const end = monthEnd(today);
  const days = workingDaysInRange(start, end, state.settings);
  let actual = 0;
  const rows = days.map((d, i) => {
    const dayJobs = filterJobs(state.jobs, d, d);
    const log = state.dailyLogs.find((l) => l.date === d);
    const dayRev = Math.max(jobRevenueSum(dayJobs), log?.completedRevenue ?? 0);
    if (d < today || (d === today && dayRev > 0)) actual += dayRev;
    const required = (p.monthlyCostBreakEven ?? p.monthlyCashBreakEven) * ((i + 1) / days.length);
    const goal = p.monthlyRevenueGoal * ((i + 1) / days.length);
    const forecast =
      d < today || (d === today && dayRev > 0)
        ? actual
        : actual + p.forecastDailyRevenue * days.filter((x) => x > d || (x === d && dayRev === 0)).length;
    return { date: d, actual: d <= today ? actual : null, required, goal, forecast };
  });
  // rebuild forecast cumulatively
  let f = 0;
  return rows.map((r) => {
    const dayJobs = filterJobs(state.jobs, r.date, r.date);
    const log = state.dailyLogs.find((l) => l.date === r.date);
    const dayRev = Math.max(jobRevenueSum(dayJobs), log?.completedRevenue ?? 0);
    if (r.date < today || (r.date === today && dayRev > 0)) f += dayRev;
    else f += p.forecastDailyRevenue;
    return { ...r, forecast: f };
  });
}

export function heatmap(state: AppState, today: string) {
  const start = monthStart(today);
  const end = monthEnd(today);
  const days = workingDaysInRange(start, end, state.settings);
  return days.map((d) => {
    const dayJobs = filterJobs(state.jobs, d, d);
    const log = state.dailyLogs.find((l) => l.date === d);
    const revenue = Math.max(jobRevenueSum(dayJobs), log?.completedRevenue ?? 0);
    return { date: d, revenue, future: d > today };
  });
}

export function lostEstimates(jobs: Job[], from: string, to: string) {
  const list = filterJobs(jobs, from, to).filter(
    (j) => j.status === "estimate" || j.opportunityMissed || (j.status === "completed" && !j.sold),
  );
  return {
    count: list.length,
    estimated: list.reduce((s, j) => s + j.estimatedRevenue, 0),
  };
}

export function callbackCost(jobs: Job[], from: string, to: string) {
  const list = filterJobs(jobs, from, to).filter((j) => j.callback);
  return {
    count: list.length,
    cost: list.reduce((s, j) => s + j.callbackCost, 0),
  };
}

export function serviceVsContractor(jobs: Job[], from: string, to: string) {
  const list = filterJobs(jobs, from, to);
  const bucket = (cat: Job["category"]) =>
    list.filter((j) => j.category === cat).reduce((s, j) => s + jobRevenue(j), 0);
  return {
    service: bucket("service"),
    contractor: bucket("contractor"),
    largeProject: bucket("large_project"),
  };
}

export function dailyTargetRemaining(
  state: AppState,
  date: string,
  weeklyGoal: number,
): {
  scheduled: number;
  sold: number;
  dailyTarget: number;
  remainingToday: number;
  weekSold: number;
  weekScheduled: number;
  weekRemaining: number;
  weekWarning: boolean;
} {
  const dailyTarget = dailyFromWeekly(weeklyGoal, state.settings.workingWeekdays.length || 5);
  const dayJobs = state.jobs.filter((j) => j.date === date && j.status !== "canceled");
  const scheduled = dayJobs.reduce((s, j) => s + (j.estimatedRevenue || j.soldRevenue || 0), 0);
  const sold = dayJobs.filter((j) => j.sold).reduce((s, j) => s + jobRevenue(j), 0);
  const ws = weekStartMonday(date);
  const we = addDays(ws, 6);
  const weekJobs = filterJobs(state.jobs, ws, we);
  const weekSold = weekJobs.filter((j) => j.sold).reduce((s, j) => s + (j.soldRevenue || jobRevenue(j)), 0);
  const weekScheduled = weekJobs.reduce((s, j) => s + (j.sold ? j.soldRevenue || jobRevenue(j) : j.estimatedRevenue), 0);
  return {
    scheduled,
    sold,
    dailyTarget,
    remainingToday: Math.max(0, dailyTarget - Math.max(sold, scheduled)),
    weekSold,
    weekScheduled,
    weekRemaining: Math.max(0, weeklyGoal - weekScheduled),
    weekWarning: weekScheduled < weeklyGoal,
  };
}

export function capacityPlan(state: AppState, today: string) {
  const p = projectMonth(state, today);
  const techs = producingTechs(state.employees);
  const remainingDays = p.workingDaysRemaining.length;
  const midCalls = (state.settings.targetCallsPerTechDayLow + state.settings.targetCallsPerTechDayHigh) / 2;
  const capacityRevenue =
    techs.length * midCalls * remainingDays * (p.currentAvgTicket ?? state.settings.averageTicket);
  return {
    techs: techs.length,
    remainingDays,
    dailyCapacity: techs.length * midCalls * (p.currentAvgTicket ?? 0),
    remainingCapacityRevenue: capacityRevenue,
    vsGoal: capacityRevenue - p.revenueRemainingToGoal,
    vsBreakEven: capacityRevenue - p.revenueRemainingToBreakEven,
  };
}
