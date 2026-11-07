"use client";

import { formatLong, formatShort } from "@/lib/calendar";
import { money, num, pct } from "@/lib/format";
import { callsNeeded, jobsNeeded, monthlyFromWeekly, projectMonth } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { Card, KpiCard, Missing, NumberField, ProgressBar, StatusBanner } from "../ui";

export function BreakEvenView() {
  const { state, today, patchSettings, setState } = useStore();
  const p = projectMonth(state, today);
  const s = state.settings;
  const log = state.dailyLogs.find((l) => l.date === today);

  const exampleJobs = jobsNeeded(68250, 1100);
  const exampleCalls = callsNeeded(exampleJobs, 0.8);

  return (
    <div className="space-y-4">
      <StatusBanner
        status={p.status}
        label={
          p.notProjectedToBreakEven
            ? "Not projected to break even this month."
            : `Projected break-even ${p.projectedBreakEvenDate ? formatLong(p.projectedBreakEvenDate) : ""}`
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Revenue needed to break even" value={money(p.monthlyCashBreakEven)} sub="Weekly $15,750 × 52 / 12" />
        <KpiCard label="Already produced (completed)" value={money(p.mtdCompletedRevenue)} />
        <KpiCard label="Still needed" value={money(p.revenueRemainingToBreakEven)} tone="yellow" />
        <KpiCard
          label="Expected month-end cash vs BE"
          value={money(p.projectedCashProfit)}
          tone={p.projectedCashProfit >= 0 ? "green" : "red"}
          forecast
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Live calculator">
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField label="Weekly cash break-even" value={s.weeklyBreakEven} onChange={(n) => patchSettings({ weeklyBreakEven: n })} money />
            <NumberField label="Average ticket" value={s.averageTicket} onChange={(n) => patchSettings({ averageTicket: n })} money />
            <NumberField label="Close rate" value={s.closeRate} onChange={(n) => patchSettings({ closeRate: n })} percent min={0} max={1} step={0.01} />
            <NumberField label="Incoming calls / day (forecast)" value={s.incomingCallsPerDay} onChange={(n) => patchSettings({ incomingCallsPerDay: n })} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <dt>Monthly cash break-even</dt>
            <dd className="tabular text-right font-semibold">{money(monthlyFromWeekly(s.weeklyBreakEven))}</dd>
            <dt>Sold jobs still needed</dt>
            <dd className="tabular text-right font-semibold">{num(p.jobsNeededToBreakEven)}</dd>
            <dt>Incoming calls still needed</dt>
            <dd className="tabular text-right font-semibold">{num(p.callsNeededToBreakEven)}</dd>
            <dt>Incoming calls per remaining working day</dt>
            <dd className="tabular text-right font-semibold">{num(p.callsPerDayToBreakEven)}</dd>
            <dt>Working days remaining</dt>
            <dd className="tabular text-right font-semibold">{p.workingDaysRemaining.length}</dd>
            <dt>Working days after break-even</dt>
            <dd className="tabular text-right font-semibold">{p.workingDaysAfterBreakEven ?? "—"}</dd>
            <dt>Calls to hit $100,000</dt>
            <dd className="tabular text-right font-semibold">{num(p.callsNeededToGoal)}</dd>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Worked example with the starting numbers: {money(68250)} / {money(1100)} = {exampleJobs} sold jobs; {exampleJobs} / 80% close = {exampleCalls} incoming calls (rounded up).
          </p>
        </Card>

        <Card title="Funnel — leads to cash">
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField label="Lead → booked" value={s.funnel.leadToBook} percent onChange={(n) => patchSettings({ funnel: { ...s.funnel, leadToBook: n } })} min={0} max={1} step={0.01} />
            <NumberField label="Booked → completed" value={s.funnel.bookToComplete} percent onChange={(n) => patchSettings({ funnel: { ...s.funnel, bookToComplete: n } })} min={0} max={1} step={0.01} />
            <NumberField label="Completed → sold (close)" value={s.funnel.completeToSold} percent onChange={(n) => patchSettings({ funnel: { ...s.funnel, completeToSold: n } })} min={0} max={1} step={0.01} />
            <NumberField label="Sold → collected" value={s.funnel.soldToCollected} percent onChange={(n) => patchSettings({ funnel: { ...s.funnel, soldToCollected: n } })} min={0} max={1} step={0.01} />
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Row k="Incoming leads MTD" v={num(p.incomingLeads)} />
            <Row k="Booked appointments MTD" v={num(p.booked)} />
            <Row k="Completed appointments MTD" v={num(p.completedAppointments)} />
            <Row k="Sold jobs MTD" v={num(p.soldJobs)} />
            <Row k="Collected revenue MTD" v={money(p.mtdCollectedRevenue)} />
            <Row k="Invoiced (not necessarily collected)" v={money(p.mtdInvoicedRevenue)} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Close rate used for call-need math is {pct(p.currentCloseRate)}
            {p.usingAssumedClose ? " (assumed — enter completed vs sold to replace it)." : " (from this month's activity)."}
          </p>
        </Card>
      </div>

      <Card title={`Today's actuals — ${formatShort(today)}`}>
        <p className="mb-3 text-sm text-slate-600">Enter production as it happens. Forecasts use these actuals plus remaining scheduled work, not a straight line.</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <NumberField
            label="Incoming leads"
            value={log?.incomingLeads ?? 0}
            onChange={(n) => upsertLog("incomingLeads", n)}
          />
          <NumberField label="Booked" value={log?.booked ?? 0} onChange={(n) => upsertLog("booked", n)} />
          <NumberField label="Completed" value={log?.completed ?? 0} onChange={(n) => upsertLog("completed", n)} />
          <NumberField label="Sold jobs" value={log?.soldJobs ?? 0} onChange={(n) => upsertLog("soldJobs", n)} />
          <NumberField label="Completed revenue" value={log?.completedRevenue ?? 0} money onChange={(n) => upsertLog("completedRevenue", n)} />
          <NumberField label="Collected revenue" value={log?.collectedRevenue ?? 0} money onChange={(n) => upsertLog("collectedRevenue", n)} />
        </div>
      </Card>

      <Card title="Break-even progress">
        <ProgressBar value={p.mtdCompletedRevenue} max={p.monthlyCashBreakEven} tone={p.status === "red" ? "red" : p.status === "yellow" ? "yellow" : "green"} />
        <p className="mt-2 text-sm text-slate-600">
          Forecast daily production used for remaining days: {money(p.forecastDailyRevenue)}
          {p.workingDaysElapsed.length ? " (from actual days with revenue when available)." : " (from assumed ticket, close rate, and incoming calls)."}
        </p>
      </Card>
      <Missing items={p.missing} />
    </div>
  );

  function upsertLog<K extends "incomingLeads" | "booked" | "completed" | "soldJobs" | "completedRevenue" | "collectedRevenue">(
    key: K,
    n: number,
  ) {
    setState((st) => {
      const logs = [...st.dailyLogs];
      const i = logs.findIndex((l) => l.date === today);
      const base = logs[i] ?? {
        date: today,
        incomingLeads: 0,
        booked: 0,
        completed: 0,
        soldJobs: 0,
        collectedRevenue: 0,
        completedRevenue: 0,
        notes: "",
        isSample: st.sampleMode,
      };
      const next = { ...base, [key]: n };
      if (i >= 0) logs[i] = next;
      else logs.push(next);
      return { ...st, dailyLogs: logs };
    });
  }
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1">
      <span>{k}</span>
      <span className="tabular font-medium">{v}</span>
    </div>
  );
}
