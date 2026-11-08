"use client";

import { money, pct } from "@/lib/format";
import {
  MONTH_SHORT,
  annualRevenueCapacity,
  defaultTargetWhatIf,
  patchGrowthAllocated,
  profitTracker,
  revenueRequiredForNetMargin,
  safeGrowthCash,
  staffingTimeline,
  targetWhatIf,
  type TargetWhatIfInput,
} from "@/lib/plan";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { Card, KpiCard, NumberField, SliderField, TargetProgressBar } from "../ui";

export function ProfitGrowthTracker() {
  const { state, today, setState } = useStore();
  const tracker = profitTracker(state, today);
  const goals = tracker.goals;
  const required = revenueRequiredForNetMargin(state);
  const capacity = annualRevenueCapacity(state);
  const cash = safeGrowthCash(state, today);
  const staff = staffingTimeline(state);
  const [whatIf, setWhatIf] = useState<TargetWhatIfInput>(() => defaultTargetWhatIf(state));
  const scenario = useMemo(() => targetWhatIf(state, whatIf), [state, whatIf]);
  const budgetMargin = required.projectedNetMargin;
  const marginTone =
    tracker.netMargin != null && tracker.netMargin >= goals.targetNetMargin ? "green" : budgetMargin != null && budgetMargin >= goals.targetNetMargin ? "yellow" : "red";

  function patchWhatIf(patch: Partial<TargetWhatIfInput>) {
    setWhatIf((w) => ({ ...w, ...patch }));
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border-2 border-navy bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-navy px-4 py-3 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-yellow">Profit &amp; Growth Tracker</p>
            <h2 className="text-xl font-semibold tracking-tight">2027 net profit and growth reserve</h2>
          </div>
          <span className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy">
            {goals.approved ? "Approved goals" : "Draft — proposed 2027 goals"}
          </span>
        </div>

        <div className="space-y-4 p-4">
          <p className="text-sm text-slate-600">
            Initial revenue target remains {money(goals.annualRevenue)}. Proposed net profit is {pct(goals.targetNetMargin)} of revenue
            ({money(goals.annualProfit)} / {money(goals.monthlyProfit)} per month at {money(goals.monthlyRevenue)}). A further {pct(goals.growthReserveRate)} of revenue
            ({money(goals.annualGrowthAllocation)} / {money(goals.monthlyGrowthAllocation)} per month) is a cash allocation from profit — not an operating expense and not deducted from accounting net profit. Remaining profit after that allocation would be {money(goals.annualProfitAfterGrowth)}.
          </p>

          <div className="rounded-xl border border-navy/20 bg-paper p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-navy">Revenue required for 25% net profit</p>
            <p className="mt-1 text-3xl font-semibold tabular text-navy">{required.requiredRevenue != null ? money(required.requiredRevenue) : "Not reachable"}</p>
            <p className="mt-2 text-sm text-slate-600">
              Calculated from this draft cost structure (two new technicians, three trucks, owner in management, planned marketing and vehicles). Variable costs stay at {pct(required.variableRatio)} of revenue. Growth reserve is funded from net profit after it is earned, so it is not added to the cost pile.
            </p>
            {required.supportedAtInitialTarget ? (
              <p className="mt-2 text-sm font-medium text-profit">The $1.2M initial target covers a 25% net margin in this model.</p>
            ) : (
              <p className="mt-2 text-sm font-medium text-brand-red">
                The $1.2M initial target does not yet support 25% net profit. Draft budget net margin is {pct(budgetMargin)} ({money(required.projectedNetProfit)}). Gap to the required revenue: {money(required.gap ?? 0)}.
              </p>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy">Accounting net profit vs 25% target</p>
              <TargetProgressBar
                value={tracker.inPlanningYear ? tracker.actualMonthlyProfit : tracker.projectedYearEnd}
                goal={tracker.inPlanningYear ? goals.monthlyProfit : goals.annualProfit}
                valueLabel={tracker.inPlanningYear ? "Monthly profit" : "Projected year-end"}
                goalLabel={tracker.inPlanningYear ? "Monthly 25% target" : "Annual 25% target"}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy">Growth reserve vs 10% of revenue</p>
              <TargetProgressBar
                value={tracker.growth.allocated}
                goal={goals.annualGrowthAllocation}
                valueLabel="Cash set aside"
                goalLabel="Annual 10% allocation"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Actual / live net margin"
              value={pct(tracker.netMargin)}
              tone={marginTone}
              forecast={tracker.live.dataMode !== "actual"}
              sub={`Target ${pct(goals.targetNetMargin)}. Live month, not a claimed 2027 result.`}
            />
            <KpiCard
              label="25% net profit target"
              value={money(goals.annualProfit)}
              tone="navy"
              sub={`${money(goals.monthlyProfit)} / month at ${money(goals.monthlyRevenue)} revenue`}
            />
            <KpiCard
              label="Growth reserve balance"
              value={money(tracker.growth.allocated)}
              sub={`${money(tracker.growth.remainingToAnnual)} remaining vs ${money(goals.annualGrowthAllocation)} annual allocation`}
            />
            <KpiCard
              label="Progress to 10% growth allocation"
              value={pct(tracker.growth.progressVsAnnual)}
              tone={tracker.growth.progressVsAnnual >= 1 ? "green" : "yellow"}
              sub="Set-aside of profit/cash. Does not reduce reported net profit."
            />
            <KpiCard
              label="Draft budget net profit"
              value={money(required.projectedNetProfit)}
              forecast
              sub={`Margin ${pct(budgetMargin)} on the $1.2M initial target`}
            />
            <KpiCard
              label="Truck capacity (if targets hit)"
              value={money(capacity.revenue)}
              forecast
              sub="Sum of monthly producing-tech capacity with ramps — not the booked $1.2M mix"
            />
            <KpiCard
              label="Profit after growth allocation"
              value={money(tracker.profitAfterGrowthAnnual)}
              forecast
              sub="Accounting profit minus cash set aside. Growth is not an expense."
            />
            <KpiCard
              label="Remaining to 25% profit goal"
              value={money(tracker.remainingToGoal)}
              tone={required.supportedAtInitialTarget ? "green" : "yellow"}
            />
          </div>

          {!tracker.inPlanningYear ? (
            <p className="text-xs text-slate-500">
              Today is {today}. 2027 actuals are still $0. Live margin and monthly profit are the current operating month. The 25% / 10% figures above are the draft 2027 plan, not results.
            </p>
          ) : null}
        </div>
      </section>

      <Card title="Safe cash available for growth">
        <p className="mb-3 text-sm text-slate-600">
          Cash that can be set aside after payroll, taxes, debt, and the minimum operating reserve. This is a cash test, not a second deduction from net profit.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Cash on hand" value={money(cash.cashNow)} />
          <KpiCard label="Payroll coming due" value={money(cash.upcomingPayroll)} />
          <KpiCard label="Taxes + debt coming due" value={money(cash.upcomingTaxes + cash.upcomingDebt)} sub={`Taxes ${money(cash.upcomingTaxes)} · Debt ${money(cash.upcomingDebt)}`} />
          <KpiCard label="Minimum operating reserve" value={money(cash.reserve)} />
          <KpiCard
            label="Cash safely available for growth"
            value={money(cash.cashSafelyAvailable)}
            tone={cash.canFundThisMonth ? "green" : "red"}
            sub={`Monthly 10% allocation ${money(cash.monthlyGrowthTarget)}`}
          />
          <KpiCard
            label="Lowest projected month-end"
            value={money(cash.minProjectedEnding)}
            tone={cash.minProjectedEnding >= cash.reserve ? "green" : "red"}
            forecast
          />
        </div>
      </Card>

      <Card title="What-if: revenue, gross margin, and operating costs for these targets">
        <p className="mb-3 text-sm text-slate-600">
          Three revenue-producing trucks after March 1: Brien plus two hired technicians. Dustin’s owner salary stays in management expenses and is not field labor. Marketing and vehicle sliders start from the draft plan. Growth reserve is shown after profit — it is not stacked into operating cost.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SliderField label="Annual revenue" value={whatIf.annualRevenue} min={800000} max={2200000} step={10000} format={money} onChange={(n) => patchWhatIf({ annualRevenue: n })} />
          <SliderField label="Producing technicians" value={whatIf.technicians} min={2} max={3} step={1} onChange={(n) => patchWhatIf({ technicians: n })} />
          <SliderField label="Marketing / month" value={whatIf.marketingMonthly} min={3000} max={14000} step={250} format={money} onChange={(n) => patchWhatIf({ marketingMonthly: n })} />
          <SliderField label="Vehicle expenses / month" value={whatIf.vehicleMonthly} min={1500} max={5000} step={50} format={money} onChange={(n) => patchWhatIf({ vehicleMonthly: n })} />
          <NumberField label="Materials % of revenue" percent value={whatIf.materialsPct} min={0} max={0.4} step={0.01} onChange={(n) => patchWhatIf({ materialsPct: n })} />
          <NumberField label="Subcontractor % of revenue" percent value={whatIf.subPct} min={0} max={0.25} step={0.01} onChange={(n) => patchWhatIf({ subPct: n })} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Revenue in this scenario" value={money(scenario.revenue)} />
          <Stat label="25% net profit at that revenue" value={money(scenario.targetNetProfit)} />
          <Stat label="10% growth allocation (from profit)" value={money(scenario.growthAllocation)} />
          <Stat label="Remaining profit after allocation" value={money(scenario.remainingProfitAfterGrowth)} />
          <Stat label="Field labor (Brien + hires + helper)" value={money(scenario.labor.fieldLabor)} />
          <Stat label="Gross margin at these costs" value={pct(scenario.grossMargin)} />
          <Stat label="Operating cost ceiling for 25%" value={money(scenario.requiredOpex)} />
          <Stat label="Planned OpEx (mkt + vehicles + other)" value={money(scenario.plannedOpex)} />
          <Stat label="OpEx allowed at 60% GM" value={money(scenario.requiredOpexAtGm60)} />
          <Stat label="OpEx allowed at 65% GM" value={money(scenario.requiredOpexAtGm65)} />
          <Stat label="Projected NP in this what-if" value={money(scenario.projectedNetProfit)} />
          <Stat label="Projected net margin" value={pct(scenario.projectedNetMargin)} />
        </div>
        <p className={`mt-3 text-sm font-medium ${scenario.hitsTarget ? "text-profit" : "text-brand-red"}`}>
          {scenario.hitsTarget
            ? "This scenario covers the 25% net margin. The 10% growth reserve can then be allocated from that profit."
            : `This scenario is short of a 25% net margin by ${money(scenario.gapToTarget)}. Do not treat 25% as the current forecast.`}
        </p>
      </Card>

      <Card title="2027 producing-truck timeline">
        <p className="mb-3 text-sm text-slate-600">
          Owner off the truck {state.plan.ownerOffTruckDate}. After that date Dustin is full-time management; owner compensation stays in operating expenses.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">Month</th>
                <th>Trucks</th>
                <th>Producing</th>
                <th>Owner</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((row, i) => (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="py-2">{row.label}</td>
                  <td className="tabular">{row.trucks}</td>
                  <td>{row.names.join(", ")}</td>
                  <td>{row.ownerProducing ? "On a truck" : "Management"}</td>
                  <td className="tabular">{money(capacity.months[i]?.revenue ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Record growth reserve set-aside (cash, not an expense)">
        <p className="mb-3 text-sm text-slate-600">
          Enter cash moved into the growth reserve. These amounts do not post to operating expenses and are not subtracted from accounting net profit.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {MONTH_SHORT.map((label, i) => (
            <NumberField
              key={label}
              label={label}
              money
              value={state.plan.growthAllocated[i] ?? 0}
              onChange={(n) => setState((s) => ({ ...s, plan: patchGrowthAllocated(s.plan, i, n) }))}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular text-navy">{value}</p>
    </div>
  );
}
