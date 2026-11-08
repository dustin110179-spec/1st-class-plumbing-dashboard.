"use client";

import { formatShort } from "@/lib/calendar";
import { money, num, pct, signedMoney } from "@/lib/format";
import { topPriorities } from "@/lib/alerts";
import {
  callbackCost,
  capacityPlan,
  heatmap,
  lostEstimates,
  paceSeries,
  producingTechs,
  projectMonth,
  serviceVsContractor,
} from "@/lib/finance";
import { useStore } from "@/lib/store";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Gauge, KpiCard, Missing, ProgressBar, StatusBanner } from "../ui";

export function DashboardView() {
  const { state, today, setView } = useStore();
  const p = projectMonth(state, today);
  const alerts = topPriorities(state, today);
  const series = paceSeries(state, today).map((r) => ({
    ...r,
    label: r.date.slice(5),
  }));
  const heat = heatmap(state, today);
  const mix = serviceVsContractor(state.jobs, p.monthKey + "-01", today);
  const cap = capacityPlan(state, today);
  const techs = producingTechs(state.employees);
  const forecast = p.dataMode !== "actual";
  const maxHeat = Math.max(...heat.map((h) => h.revenue), 1);

  return (
    <div className="space-y-4">
      <StatusBanner status={p.status} label={p.statusLabel} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard
          label="Month-to-date revenue"
          value={money(p.mtdCompletedRevenue)}
          sub={`Sold ${money(p.mtdSoldRevenue)} · Collected ${money(p.mtdCollectedRevenue)}`}
        />
        <KpiCard
          label="Monthly cost-based break-even"
          value={money(p.monthlyCostBreakEven)}
          sub={`Fixed ${money(p.fixedOperatingExpenses)} ÷ contribution margin ${pct(p.contributionMargin)}. Not the $15,750 weekly cash benchmark.`}
          tone="navy"
        />
        <KpiCard
          label="Revenue remaining to break even"
          value={money(p.revenueRemainingToBreakEven)}
          tone={p.revenueRemainingToBreakEven === 0 ? "green" : "yellow"}
        />
        <KpiCard
          label="Projected break-even date"
          value={p.notProjectedToBreakEven ? "Not this month" : p.projectedBreakEvenDate ? formatShort(p.projectedBreakEvenDate) : "—"}
          tone={p.notProjectedToBreakEven ? "red" : "green"}
          forecast={forecast}
          sub={
            p.workingDaysAfterBreakEven != null
              ? `${p.workingDaysAfterBreakEven} working day${p.workingDaysAfterBreakEven === 1 ? "" : "s"} after break-even`
              : undefined
          }
        />
        <KpiCard
          label="Projected month-end revenue"
          value={money(p.projectedMonthEndRevenue)}
          forecast
          sub={`${p.workingDaysRemaining.length} working days remaining of ${p.workingDaysInMonth.length}`}
        />
        <KpiCard
          label="Projected operating profit"
          value={money(p.projectedOperatingProfit)}
          tone={p.projectedOperatingProfit >= 0 ? "green" : "red"}
          forecast
          sub="Contribution profit − $47k fixed. Extra revenue is not 100% profit."
        />
        <KpiCard
          label="Calls needed to break even"
          value={num(p.callsNeededToBreakEven)}
          sub={`${num(p.jobsNeededToBreakEven)} sold jobs · ${num(p.callsPerDayToBreakEven)} incoming/day`}
        />
        <KpiCard
          label="Calls needed to hit $100,000"
          value={num(p.callsNeededToGoal)}
          sub={`${num(p.jobsNeededToGoal)} sold jobs · ${num(p.callsPerDayToGoal)} incoming/day`}
        />
        <KpiCard
          label="Current average ticket"
          value={money(p.currentAvgTicket)}
          forecast={p.usingAssumedTicket}
        />
        <KpiCard
          label="Current close rate"
          value={pct(p.currentCloseRate)}
          forecast={p.usingAssumedClose}
        />
        <KpiCard
          label="Gross margin"
          value={pct(p.grossMargin)}
          tone={
            p.grossMargin != null && p.grossMargin >= state.settings.targetGrossMarginLow ? "green" : "red"
          }
          forecast={p.dataMode !== "actual"}
          sub={`After variable labor, materials, subs. Target ${pct(state.settings.targetGrossMarginLow)}–${pct(state.settings.targetGrossMarginHigh)}`}
        />
        <KpiCard
          label="Contribution margin"
          value={pct(p.contributionMargin)}
          forecast={p.dataMode !== "actual"}
          sub="After processing, commissions, and other variable costs. This drives break-even."
        />
        <KpiCard
          label="Revenue per technician day"
          value={money(p.revenuePerTechDay)}
          sub={`${techs.length} producing technicians`}
          forecast={p.revenuePerTechDay == null}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Pace versus plan" className="lg:col-span-2">
          <p className="mb-3 text-sm text-slate-600">
            Break-even pace: <strong className="tabular">{signedMoney(p.paceVsBreakEven)}</strong>
            {" · "}
            Goal pace: <strong className="tabular">{signedMoney(p.paceVsGoal)}</strong>
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="#E8EEF4" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#0A2540" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="required" name="Required to break even" stroke="#C12216" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="goal" name="Required to $100k" stroke="#C9A227" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#147A3F" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Today's top three priorities">
          <ol className="space-y-3">
            {alerts.map((a, i) => (
              <li key={a.id} className="rounded-lg border border-slate-100 bg-paper p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {i + 1}. {a.severity === "red" ? "Urgent" : a.severity === "yellow" ? "Watch" : "Opportunity"}
                </p>
                <p className="mt-1 text-sm font-semibold text-navy">{a.title}</p>
                <p className="mt-1 text-xs text-slate-600">{a.detail}</p>
              </li>
            ))}
            {alerts.length === 0 ? <p className="text-sm text-slate-500">No material issues from current data.</p> : null}
          </ol>
          <button className="mt-3 text-sm font-medium text-navy underline" type="button" onClick={() => setView("breakeven")}>
            Open break-even calculator
          </button>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Cost-based break-even progress">
          <p className="mb-2 text-sm text-slate-600">
            {money(p.mtdCompletedRevenue)} of {money(p.monthlyCostBreakEven)} needed to cover fixed expenses
          </p>
          <ProgressBar
            value={p.mtdCompletedRevenue}
            max={p.monthlyCostBreakEven ?? 1}
            tone={p.monthlyCostBreakEven != null && p.mtdCompletedRevenue >= p.monthlyCostBreakEven ? "green" : "yellow"}
          />
          <p className="mt-3 mb-2 text-sm text-slate-600">
            Revenue goal {money(p.mtdCompletedRevenue)} of {money(p.monthlyRevenueGoal)}
          </p>
          <ProgressBar
            value={p.mtdCompletedRevenue}
            max={p.monthlyRevenueGoal}
            tone={p.mtdCompletedRevenue >= p.monthlyRevenueGoal ? "green" : "navy"}
          />
        </Card>
        <Card title="Primary P&L — do not stack the $15,750 on the $47,000">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-paper p-3">
              <p className="text-xs font-bold uppercase text-navy">Gross profit</p>
              <p className="mt-2 text-2xl font-semibold tabular">{money(p.projectedGrossProfit)}</p>
              <p className="text-xs text-slate-600">
                Revenue minus variable labor (Brien/Nathan), materials, and subcontractors. Dustin’s and Noah’s pay stay in fixed expenses.
              </p>
            </div>
            <div className="rounded-lg bg-paper p-3">
              <p className="text-xs font-bold uppercase text-navy">Contribution profit</p>
              <p className="mt-2 text-2xl font-semibold tabular">{money(p.projectedContributionProfit)}</p>
              <p className="text-xs text-slate-600">
                Gross profit minus processing, commissions, and other variable costs. Margin {pct(p.contributionMargin)}. Each extra dollar of revenue keeps about {money(p.profitPerDollarAboveBreakEven, 2)} after variable costs — not a full dollar of profit.
              </p>
            </div>
            <div className="rounded-lg bg-paper p-3">
              <p className="text-xs font-bold uppercase text-navy">Operating profit</p>
              <p className="mt-2 text-2xl font-semibold tabular">{money(p.projectedOperatingProfit)}</p>
              <p className="text-xs text-slate-600">
                Contribution minus {money(p.fixedOperatingExpenses)} fixed expenses. Revenue above break-even is projected to add {money(p.profitOnRevenueAboveBreakEven)} of operating profit this month.
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Historical all-in cash benchmark remains {money(state.settings.weeklyBreakEven)}/week ({money(p.monthlyCashBreakEven)}/month) for comparison only. It is not another expense and is not added to the $47,000.
            Projected cash vs that benchmark: {money(p.projectedCashProfit)}.
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Daily sales heatmap">
          <div className="grid grid-cols-5 gap-1">
            {heat.map((h) => {
              const t = h.revenue / maxHeat;
              const bg = h.future ? "#E8EEF4" : `rgba(10,37,64,${0.15 + t * 0.85})`;
              const color = !h.future && t > 0.55 ? "white" : "#0A2540";
              return (
                <div key={h.date} className="rounded p-1 text-center" style={{ background: bg, color }}>
                  <div className="text-[10px]">{h.date.slice(8)}</div>
                  <div className="text-[10px] tabular">{h.future ? "—" : money(h.revenue)}</div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="Service vs contractor vs large projects">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Routine service</span><span className="tabular">{money(mix.service)}</span></li>
            <li className="flex justify-between"><span>Contractor accounts</span><span className="tabular">{money(mix.contractor)}</span></li>
            <li className="flex justify-between"><span>Large projects</span><span className="tabular">{money(mix.largeProject)}</span></li>
          </ul>
        </Card>
        <Card title="Revenue left on the table">
          {(() => {
            const lost = lostEstimates(state.jobs, p.monthKey + "-01", today);
            const cb = callbackCost(state.jobs, p.monthKey + "-01", today);
            return (
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span>Unsold estimates / missed ops</span><span className="tabular">{money(lost.estimated)} ({lost.count})</span></li>
                <li className="flex justify-between"><span>Callback cost</span><span className="tabular">{money(cb.cost)} ({cb.count})</span></li>
              </ul>
            );
          })()}
        </Card>
        <Card title="Capacity remaining">
          <div className="flex justify-around">
            <Gauge value={p.currentCloseRate ?? 0} label="Close rate" />
            <Gauge value={p.grossMargin ?? 0} min={0.3} max={0.8} label="Gross margin" />
            <Gauge value={p.contributionMargin ?? 0} min={0.2} max={0.75} label="Contribution" />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {cap.techs} techs × remaining days can produce about {money(cap.remainingCapacityRevenue)} more if they hit {state.settings.targetCallsPerTechDayLow}–{state.settings.targetCallsPerTechDayHigh} calls/day.
          </p>
        </Card>
      </div>
      <Missing items={p.missing} />
    </div>
  );
}
