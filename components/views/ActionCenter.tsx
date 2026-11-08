"use client";

import { formatLong, formatShort } from "@/lib/calendar";
import { money, num } from "@/lib/format";
import { topPriorities } from "@/lib/alerts";
import { dailyAction, DEFAULT_CHECKLIST, hiringReadiness } from "@/lib/plan";
import { useStore } from "@/lib/store";
import { Btn, Card, DraftBanner, KpiCard, StatusBanner } from "../ui";

export function ActionCenterView() {
  const { state, today, setView, setState } = useStore();
  const a = dailyAction(state, today);
  const alerts = topPriorities(state, today).slice(0, 3);
  const hire = hiringReadiness(state, today);
  const saved = state.dailyChecklists.find((c) => c.date === today);
  const items = saved?.items ?? DEFAULT_CHECKLIST.map((i) => ({ ...i, done: false }));

  function toggle(id: string) {
    setState((s) => {
      const current = s.dailyChecklists.find((c) => c.date === today);
      const nextItems = (current?.items ?? DEFAULT_CHECKLIST.map((i) => ({ ...i, done: false }))).map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      );
      const rest = s.dailyChecklists.filter((c) => c.date !== today);
      return { ...s, dailyChecklists: [...rest, { date: today, items: nextItems }] };
    });
  }

  return (
    <div className="space-y-4">
      <DraftBanner />
      <StatusBanner
        status={a.live.status}
        label={`${formatLong(today)} — ${a.live.statusLabel}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue needed today"
          value={money(a.dailyRevenueNeed)}
          sub={`Daily share of the ${money(state.settings.weeklyRevenueGoal)} weekly goal. Booked/sold today ${money(a.week.sold)}.`}
          tone={a.dailyRevenueNeed === 0 ? "green" : "yellow"}
        />
        <KpiCard
          label="Revenue needed this week"
          value={money(a.weeklyRevenueNeed)}
          sub={`Scheduled + sold this week ${money(a.week.weekScheduled)}.`}
          tone={a.week.weekWarning ? "red" : "green"}
        />
        <KpiCard
          label="Jobs on today’s board"
          value={num(a.bookedToday)}
          sub={`${num(a.live.booked)} booked this month to date.`}
        />
        <KpiCard
          label="Additional incoming calls needed"
          value={num(a.additionalCalls)}
          sub={`To hit ${money(state.settings.monthlyRevenueGoal)} this month at the current ticket and close rate.`}
          tone={a.additionalCalls > 0 ? "yellow" : "green"}
        />
        <KpiCard
          label="Pace to break even"
          value={a.onPaceBreakEven ? "On pace" : "Behind"}
          tone={a.onPaceBreakEven ? "green" : "red"}
          forecast={a.live.dataMode !== "actual"}
          sub={
            a.live.notProjectedToBreakEven
              ? `Projected ${money(a.live.projectedMonthEndRevenue)} vs cost-based break-even ${money(a.live.monthlyCostBreakEven)}.`
              : `Projected break-even ${a.live.projectedBreakEvenDate ? formatShort(a.live.projectedBreakEvenDate) : "already reached"}.`
          }
        />
        <KpiCard
          label="Pace to monthly profit goal"
          value={a.onPaceProfit ? "On pace" : "Behind"}
          tone={a.onPaceProfit ? "green" : "yellow"}
          forecast
          sub={`Projected operating profit ${money(a.live.projectedOperatingProfit)} vs ${money(a.profitGoal)} monthly goal.`}
        />
        <KpiCard
          label="Cash expected this week"
          value={money(a.expectedCash)}
          sub={`Reserve target ${money(state.settings.cashReserveTarget)}. Beginning bank ${money(state.settings.beginningBankBalance)}.`}
          tone={a.expectedCash < state.settings.cashReserveTarget ? "red" : "green"}
        />
        <KpiCard
          label="Third-tech hire readiness"
          value={hire.overall === "green" ? "Ready" : hire.overall === "yellow" ? "Watch" : "Not yet"}
          tone={hire.overall}
          sub={`Hires ${hire.startDate}. Owner off truck ${hire.ownerOffTruckDate}. Calls ${hire.calls}/${hire.callNeed} per day.`}
        />
      </div>

      <Card title="What needs my attention?">
        <p className="mb-3 text-sm text-slate-600">
          The three highest-impact issues from live jobs, cash, and pace — not a canned list. Empty books produce fewer alerts.
        </p>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-600">No blocking issues from the data on file. Enter today’s jobs or yesterday’s close to sharpen this list.</p>
        ) : (
          <ol className="space-y-3">
            {alerts.map((al, i) => (
              <li key={al.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">#{i + 1}</p>
                <p className="font-semibold text-navy">{al.title}</p>
                <p className="mt-1 text-sm text-slate-600">{al.detail}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Major bills coming due">
          {a.bills.length === 0 ? (
            <p className="text-sm text-slate-600">No 13-week cash rows yet. Open Cash & Owner Pay to seed the rolling forecast, then enter payroll and known bills.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {a.bills.map((b) => (
                <li key={b.weekStart} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 py-2">
                  <span>
                    Week of {formatShort(b.weekStart)}
                    {b.majorBills ? ` — ${b.majorBills}` : ""}
                  </span>
                  <span className="tabular text-navy">
                    Payroll {money(b.payroll)}
                    {b.loans > 0 ? ` · Debt ${money(b.loans)}` : ""}
                    {b.other > 0 ? ` · Other ${money(b.other)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Daily checklist">
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} className="mt-1" />
                  <span className={item.done ? "text-slate-400 line-through" : "text-navy"}>{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn onClick={() => setView("daily")}>Enter today’s numbers</Btn>
            <Btn tone="ghost" onClick={() => setView("dashboard")}>
              Open financial dashboard
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
