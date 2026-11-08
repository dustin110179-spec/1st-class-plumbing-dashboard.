"use client";

import { addDays, formatLong, isWorkingDay, weekStartMonday } from "@/lib/calendar";
import { money } from "@/lib/format";
import { dailyTargetRemaining, jobEconomics, commissionsByJob } from "@/lib/finance";
import { newJob, useStore } from "@/lib/store";
import type { ArrivalWindow, Job, JobCategory, JobStatus, OptionsPresented } from "@/lib/types";
import { useState } from "react";
import { Btn, Card, NumberField, SelectField, TextField } from "../ui";

const WINDOWS: ArrivalWindow[] = ["8-10", "10-12", "12-2", "2-4"];
const WINDOW_LABEL: Record<ArrivalWindow, string> = {
  "8-10": "8–10 AM",
  "10-12": "10 AM–12 PM",
  "12-2": "12–2 PM",
  "2-4": "2–4 PM",
};

export function ScheduleView() {
  const { state, today, setState } = useStore();
  const [date, setDate] = useState(today);
  const techs = state.employees.filter((e) => e.active && e.canRunCalls);
  const plan = dailyTargetRemaining(state, date, state.settings.weeklyRevenueGoal);
  const dayJobs = state.jobs.filter((j) => j.date === date);
  const commissionMap = commissionsByJob(state.jobs, state.employees);

  function updateJob(id: string, patch: Partial<Job>) {
    setState((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
  }

  return (
    <div className="space-y-4">
      <Card
        title="Daily call planning"
        action={
          <input
            type="date"
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        }
      >
        <p className="text-sm text-slate-600">{formatLong(date)}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Box k="Daily target" v={money(plan.dailyTarget)} />
          <Box k="Scheduled revenue" v={money(plan.scheduled)} />
          <Box k="Sold today" v={money(plan.sold)} />
          <Box k="Still needed today" v={money(plan.remainingToday)} warn={plan.remainingToday > 0} />
        </div>
        {plan.weekWarning ? (
          <p className="mt-3 rounded-lg bg-[#FFF8D1] px-3 py-2 text-sm text-navy">
            Not enough appointments are scheduled to reach {money(state.settings.weeklyRevenueGoal)} this week.
            Week scheduled/sold {money(plan.weekScheduled)} · short {money(plan.weekRemaining)}.
          </p>
        ) : (
          <p className="mt-3 text-sm text-profit">
            This week’s schedule covers {money(plan.weekScheduled)} toward {money(state.settings.weeklyRevenueGoal)}.
          </p>
        )}
        {!isWorkingDay(date, state.settings) ? (
          <p className="mt-2 text-sm text-slate-500">This date is not a configured working day (weekend or holiday).</p>
        ) : null}
      </Card>

      <div className="overflow-x-auto rounded-xl bg-white p-3 shadow-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="p-2">Window</th>
              {techs.map((t) => (
                <th key={t.id} className="p-2">
                  {t.name}
                  {state.employees.some((e) => e.assignedToId === t.id) ? (
                    <span className="block font-normal normal-case text-slate-400">
                      + {state.employees.filter((e) => e.assignedToId === t.id).map((e) => e.name).join(", ")}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WINDOWS.map((w) => (
              <tr key={w} className="border-t border-slate-100 align-top">
                <td className="p-2 font-semibold text-navy">{WINDOW_LABEL[w]}</td>
                {techs.map((t) => {
                  const jobs = dayJobs.filter((j) => j.technicianId === t.id && j.window === w);
                  return (
                    <td key={t.id} className="p-2">
                      {jobs.map((j) => (
                        <JobCard
                          key={j.id}
                          job={j}
                          helpers={state.employees.filter((e) => e.assignedToId === t.id || j.helperIds.includes(e.id))}
                          onChange={(patch) => updateJob(j.id, patch)}
                          economics={jobEconomics(j, state.employees, state.settings, commissionMap)}
                          sources={state.marketing}
                          techs={state.employees}
                        />
                      ))}
                      <button
                        type="button"
                        className="mt-1 text-xs text-navy underline"
                        onClick={() => {
                          const helpers = state.employees.filter((e) => e.assignedToId === t.id).map((e) => e.id);
                          setState((s) => ({
                            ...s,
                            jobs: [...s.jobs, { ...newJob(date, t.id), window: w, helperIds: helpers }],
                          }));
                        }}
                      >
                        + Add call
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Week of {weekStartMonday(date)} · next working look-ahead {addDays(date, 1)}.
      </p>
    </div>
  );
}

function Box({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${warn ? "bg-[#FFF8D1]" : "bg-paper"}`}>
      <p className="text-[11px] uppercase text-slate-500">{k}</p>
      <p className="text-lg font-semibold tabular text-navy">{v}</p>
    </div>
  );
}

function JobCard({
  job,
  onChange,
  economics,
  helpers,
  sources,
  techs,
}: {
  job: Job;
  onChange: (p: Partial<Job>) => void;
  economics: ReturnType<typeof jobEconomics>;
  helpers: { id: string; name: string }[];
  sources: { id: string; name: string }[];
  techs: { id: string; name: string }[];
}) {
  return (
    <div className="mb-2 rounded-lg border border-slate-200 bg-paper p-2">
      <TextField label="Customer" value={job.customer} onChange={(v) => onChange({ customer: v })} />
      <TextField label="Job type" value={job.jobType} onChange={(v) => onChange({ jobType: v })} />
      <SelectField
        label="Technician"
        value={job.technicianId}
        onChange={(v) => onChange({ technicianId: v })}
        options={techs.map((t) => ({ value: t.id, label: t.name }))}
      />
      <SelectField
        label="Status"
        value={job.status}
        onChange={(v) => onChange({ status: v as JobStatus })}
        options={[
          { value: "scheduled", label: "Scheduled" },
          { value: "completed", label: "Completed" },
          { value: "estimate", label: "Estimate" },
          { value: "canceled", label: "Canceled" },
        ]}
      />
      <SelectField
        label="Category"
        value={job.category}
        onChange={(v) => onChange({ category: v as JobCategory })}
        options={[
          { value: "service", label: "Routine service" },
          { value: "contractor", label: "Contractor" },
          { value: "large_project", label: "Large project" },
        ]}
      />
      <NumberField label="Estimated revenue" money value={job.estimatedRevenue} onChange={(n) => onChange({ estimatedRevenue: n })} />
      <NumberField label="Actual / sold revenue" money value={job.soldRevenue} onChange={(n) => onChange({ soldRevenue: n, completedRevenue: n, sold: n > 0 })} />
      <NumberField label="Collected" money value={job.collectedRevenue} onChange={(n) => onChange({ collectedRevenue: n })} />
      <NumberField label="Est. hours" value={job.estimatedHours} step={0.25} onChange={(n) => onChange({ estimatedHours: n })} />
      <NumberField label="Paid tech hours" value={job.paidHoursTech} step={0.25} onChange={(n) => onChange({ paidHoursTech: n })} />
      {helpers.map((h) => (
        <NumberField
          key={h.id}
          label={`Paid hours — ${h.name}`}
          value={job.paidHoursHelpers[h.id] ?? 0}
          step={0.25}
          onChange={(n) => onChange({ helperIds: Array.from(new Set([...job.helperIds, h.id])), paidHoursHelpers: { ...job.paidHoursHelpers, [h.id]: n } })}
        />
      ))}
      <NumberField label="Materials" money value={job.materials} onChange={(n) => onChange({ materials: n })} />
      <NumberField label="Subcontractors" money value={job.subcontractors} onChange={(n) => onChange({ subcontractors: n })} />
      <SelectField
        label="Lead source"
        value={job.sourceId}
        onChange={(v) => onChange({ sourceId: v })}
        options={sources.map((s) => ({ value: s.id, label: s.name }))}
      />
      <SelectField
        label="Good / Better / Best"
        value={job.optionsPresented}
        onChange={(v) => onChange({ optionsPresented: v as OptionsPresented })}
        options={[
          { value: "none", label: "Not presented" },
          { value: "good", label: "Good only" },
          { value: "better", label: "Better" },
          { value: "best", label: "Best" },
          { value: "all", label: "All three options" },
        ]}
      />
      <label className="mt-1 flex items-center gap-2 text-xs">
        <input type="checkbox" checked={job.sold} onChange={(e) => onChange({ sold: e.target.checked })} /> Sold
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={job.membershipSold} onChange={(e) => onChange({ membershipSold: e.target.checked })} /> Membership sold
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={job.financingOffered} onChange={(e) => onChange({ financingOffered: e.target.checked })} /> Financing offered
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={job.callback} onChange={(e) => onChange({ callback: e.target.checked })} /> Callback
      </label>
      {job.callback ? (
        <NumberField label="Callback cost" money value={job.callbackCost} onChange={(n) => onChange({ callbackCost: n })} />
      ) : null}
      {job.sold && economics.revenue > 0 ? (
        <p className="mt-1 text-[11px] text-slate-600">
          GP {money(economics.grossProfit)} ({economics.grossMargin != null ? `${(economics.grossMargin * 100).toFixed(0)}%` : "—"})
          {economics.contributionMargin != null ? ` · CM ${(economics.contributionMargin * 100).toFixed(0)}%` : ""}
          {economics.laborHigh ? " · labor too high" : ""}
          {economics.revenuePerCrewHour != null ? ` · ${money(economics.revenuePerCrewHour)}/crew hr` : ""}
        </p>
      ) : null}
    </div>
  );
}
