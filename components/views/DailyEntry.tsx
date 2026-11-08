"use client";

import { formatLong } from "@/lib/calendar";
import { money } from "@/lib/format";
import { projectMonth } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { Card, NumberField, TextField } from "../ui";

export function DailyEntryView() {
  const { state, today, setState } = useStore();
  const p = projectMonth(state, today);
  const log = state.dailyLogs.find((l) => l.date === today) ?? {
    date: today,
    incomingLeads: 0,
    booked: 0,
    completed: 0,
    soldJobs: 0,
    collectedRevenue: 0,
    completedRevenue: 0,
    notes: "",
    isSample: false,
  };

  function save(patch: Partial<typeof log>) {
    setState((s) => {
      const logs = [...s.dailyLogs];
      const i = logs.findIndex((l) => l.date === today);
      const next = { ...log, ...patch, date: today, isSample: false };
      if (i >= 0) logs[i] = next;
      else logs.push(next);
      return { ...s, dailyLogs: logs };
    });
  }

  return (
    <div className="space-y-4">
      <Card title={`Five-minute daily close — ${formatLong(today)}`}>
        <p className="text-sm text-slate-600">
          Enter today’s funnel and cash. Job-level detail lives on Daily Call Planning. This screen is enough to refresh break-even and pace.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Incoming leads" value={log.incomingLeads} onChange={(n) => save({ incomingLeads: n })} />
          <NumberField label="Appointments booked" value={log.booked} onChange={(n) => save({ booked: n })} />
          <NumberField label="Appointments completed" value={log.completed} onChange={(n) => save({ completed: n })} />
          <NumberField label="Jobs sold" value={log.soldJobs} onChange={(n) => save({ soldJobs: n })} />
          <NumberField label="Completed / earned revenue" money value={log.completedRevenue} onChange={(n) => save({ completedRevenue: n })} />
          <NumberField label="Collected cash" money value={log.collectedRevenue} onChange={(n) => save({ collectedRevenue: n })} />
        </div>
        <div className="mt-3">
          <TextField label="Notes" value={log.notes} onChange={(v) => save({ notes: v })} />
        </div>
      </Card>
      <Card title="What this does to the month">
        <ul className="space-y-1 text-sm">
          <li>MTD completed revenue: <strong className="tabular">{money(p.mtdCompletedRevenue)}</strong></li>
          <li>Still to break even: <strong className="tabular">{money(p.revenueRemainingToBreakEven)}</strong></li>
          <li>Projected month-end: <strong className="tabular">{money(p.projectedMonthEndRevenue)}</strong></li>
          <li>Status: {p.statusLabel}</li>
        </ul>
      </Card>
      <Card title="Recent daily logs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-1">Date</th>
                <th>Leads</th>
                <th>Booked</th>
                <th>Completed</th>
                <th>Sold</th>
                <th>Earned</th>
                <th>Collected</th>
              </tr>
            </thead>
            <tbody>
              {[...state.dailyLogs]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 14)
                .map((l) => (
                  <tr key={l.date} className="border-t border-slate-100">
                    <td className="py-1">{l.date}</td>
                    <td>{l.incomingLeads}</td>
                    <td>{l.booked}</td>
                    <td>{l.completed}</td>
                    <td>{l.soldJobs}</td>
                    <td className="tabular">{money(l.completedRevenue)}</td>
                    <td className="tabular">{money(l.collectedRevenue)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
