import { formatShort, weekStartMonday } from "./calendar";
import { money, num, pct } from "./format";
import {
  capacityPlan,
  dailyTargetRemaining,
  marketingMetrics,
  producingTechs,
  projectMonth,
  simulate,
  techScorecard,
} from "./finance";
import type { AppState } from "./types";

export interface OwnerAlert {
  id: string;
  severity: "red" | "yellow" | "green" | "info";
  title: string;
  detail: string;
  impact: number;
}

export function ownerAlerts(state: AppState, today: string): OwnerAlert[] {
  const p = projectMonth(state, today);
  const alerts: OwnerAlert[] = [];
  const s = state.settings;

  if (p.notProjectedToBreakEven) {
    alerts.push({
      id: "be-miss",
      severity: "red",
      title: "Not projected to break even this month.",
      detail: `At the current pace and forecast of ${money(p.forecastDailyRevenue)}/day, month-end revenue is ${money(p.projectedMonthEndRevenue)} versus a cash break-even of ${money(p.monthlyCashBreakEven)}.`,
      impact: p.monthlyCashBreakEven - p.projectedMonthEndRevenue,
    });
  } else if (p.projectedBreakEvenDate) {
    alerts.push({
      id: "be-date",
      severity: p.status === "green" ? "green" : "yellow",
      title: `You are projected to break even on ${formatShort(p.projectedBreakEvenDate)}.`,
      detail:
        p.workingDaysAfterBreakEven != null
          ? `${p.workingDaysAfterBreakEven} working days remain after break-even.`
          : "Break-even lands on the last remaining working day.",
      impact: p.projectedMonthEndRevenue - p.monthlyCashBreakEven,
    });
  }

  const extraCalls = (p.callsPerDayToGoal ?? 0) - s.incomingCallsPerDay;
  if (extraCalls > 0 && p.callsPerDayToGoal != null) {
    const lift =
      extraCalls *
      (p.currentAvgTicket ?? s.averageTicket) *
      (p.currentCloseRate ?? s.closeRate) *
      p.workingDaysRemaining.length;
    alerts.push({
      id: "calls-gap",
      severity: extraCalls >= 2 ? "red" : "yellow",
      title: `At your current average ticket and close rate, you need ${num(extraCalls)} additional incoming call${extraCalls === 1 ? "" : "s"} per day to reach the monthly goal.`,
      detail: `That is ${num(p.callsPerDayToGoal)} incoming calls/day versus ${num(s.incomingCallsPerDay)} currently assumed. Potential revenue at stake: ${money(lift)}.`,
      impact: lift,
    });
  }

  const week = dailyTargetRemaining(state, today, s.weeklyRevenueGoal);
  if (week.weekWarning) {
    alerts.push({
      id: "week-sched",
      severity: "red",
      title: `Your current schedule is not sufficient to reach ${money(s.weeklyRevenueGoal)} this week.`,
      detail: `Scheduled + sold this week: ${money(week.weekScheduled)}. Shortfall: ${money(week.weekRemaining)}.`,
      impact: week.weekRemaining,
    });
  }

  const ws = weekStartMonday(today);
  for (const emp of producingTechs(state.employees)) {
    const card = techScorecard(state, emp.id, ws, today);
    if (!card) continue;
    if (card.avgTicket != null && emp.targetAvgTicket > 0 && card.avgTicket < emp.targetAvgTicket * 0.9) {
      const gap = emp.targetAvgTicket - card.avgTicket;
      alerts.push({
        id: `ticket-${emp.id}`,
        severity: "yellow",
        title: `${emp.name}'s average ticket is below target.`,
        detail: `This period: ${money(card.avgTicket)} vs target ${money(emp.targetAvgTicket)}.`,
        impact: gap * Math.max(card.callsCompleted, 1),
      });
    }
    if (card.laborHigh) {
      alerts.push({
        id: `labor-${emp.id}`,
        severity: "red",
        title: `${emp.name}'s labor percentage is rising faster than revenue.`,
        detail: `Loaded labor is ${pct(card.laborPct)} of completed revenue (warning at ${pct(s.laborPercentWarning)}).`,
        impact: (card.laborPct ?? 0) * card.completedRevenue,
      });
    }
    if (emp.weeklySalesThreshold > 0 && card.soldRevenue < emp.weeklySalesThreshold) {
      alerts.push({
        id: `threshold-${emp.id}`,
        severity: "yellow",
        title: `${emp.name} is below the ${money(emp.weeklySalesThreshold)} weekly sales threshold.`,
        detail: `Week-to-date sold: ${money(card.soldRevenue)}. Remaining: ${money(emp.weeklySalesThreshold - card.soldRevenue)}.`,
        impact: emp.weeklySalesThreshold - card.soldRevenue,
      });
    }
  }

  const mkt = marketingMetrics(state.marketing, s);
  const withSpend = mkt.filter((m) => m.monthlySpend > 0);
  const unprofitable = withSpend.filter((m) => m.cac != null && !m.profitable).sort((a, b) => (b.cac ?? 0) - (a.cac ?? 0));
  if (unprofitable[0]) {
    const worst = unprofitable[0];
    alerts.push({
      id: "mkt-cac",
      severity: "yellow",
      title: `Marketing cost per sold job is not paying back on ${worst.name}.`,
      detail: `CAC ${money(worst.cac)} vs revenue ${money(worst.revenue)}. Gross profit after marketing: ${money(worst.gpAfter)}.`,
      impact: Math.abs(worst.gpAfter),
    });
  }

  const a = state.scenarios[0];
  const ticketPlus = simulate(
    { ...a, averageTicket: a.averageTicket + 200 },
    s.processingFeeRate,
    s.membershipAnnualPrice,
  );
  const addTech = simulate(
    {
      ...a,
      technicians: a.technicians + 1,
      incomingCallsPerDay: a.incomingCallsPerDay + 2,
      monthlyOverhead: a.monthlyOverhead + 4500,
    },
    s.processingFeeRate,
    s.membershipAnnualPrice,
  );
  const base = simulate(a, s.processingFeeRate, s.membershipAnnualPrice);
  const ticketLift = ticketPlus.operatingProfit - base.operatingProfit;
  const techLift = addTech.operatingProfit - base.operatingProfit;
  if (ticketLift > techLift) {
    alerts.push({
      id: "ticket-vs-tech",
      severity: "info",
      title: "Improving average ticket by $200 could produce more profit than adding another technician.",
      detail: `Scenario math (current assumptions): +$200 ticket lifts operating profit by ${money(ticketLift)}; adding a technician and two extra calls/day lifts it by ${money(techLift)}.`,
      impact: ticketLift,
    });
  }

  const cap = capacityPlan(state, today);
  if (cap.vsGoal < 0) {
    alerts.push({
      id: "capacity",
      severity: "red",
      title: "Remaining technician capacity is not enough to hit the monthly revenue goal.",
      detail: `Capacity on remaining working days: ${money(cap.remainingCapacityRevenue)}. Gap to goal: ${money(-cap.vsGoal)}.`,
      impact: -cap.vsGoal,
    });
  }

  alerts.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  return alerts;
}

export function topPriorities(state: AppState, today: string): OwnerAlert[] {
  return ownerAlerts(state, today).slice(0, 3);
}
