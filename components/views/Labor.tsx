"use client";

import { money, num, pct } from "@/lib/format";
import { laborMonth, MONTH_SHORT, productionGrid } from "@/lib/plan";
import { useStore } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { useState } from "react";
import { Card, DraftBanner, NumberField, PlanningBanner } from "../ui";

export function LaborView() {
  const { state, setState } = useStore();
  const [month, setMonth] = useState(1);
  const forecast = laborMonth(state, month);
  const grid = productionGrid(state, month);

  function patchEmp(id: string, patch: Partial<Employee>) {
    setState((s) => ({
      ...s,
      employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  return (
    <div className="space-y-4">
      <DraftBanner />
      <PlanningBanner />
      <Card
        title="Technician labor and production forecast"
        action={
          <select className="rounded border px-2 py-1 text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_SHORT.map((m, i) => (
              <option key={m} value={i}>
                {m} 2027
              </option>
            ))}
          </select>
        }
      >
        <p className="text-sm text-slate-600">
          Paid hours are clock hours. Productive hours are separately editable and are not assumed to be eight billable hours. Nathan is helper labor assigned to Brien and is not a revenue-producing truck. The February and March hires appear only in months on or after their start dates. From March 1, Dustin is counted as management, not a producing truck; his owner salary stays in overhead.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Mini label="Producing technicians" value={num(forecast.producingCount)} />
          <Mini label="Expected jobs" value={num(forecast.jobs, 1)} />
          <Mini label="Expected revenue" value={money(forecast.revenue)} />
          <Mini label="Booked calls required" value={num(forecast.bookedRequired)} />
        </div>
      </Card>

      <Card title="Production at 2 / 2.5 / 3 / 3.5 completed jobs per producing tech per day">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">Completed jobs / tech / day</th>
                <th>Jobs</th>
                <th>Revenue</th>
                <th>Booked calls required</th>
                <th>Labor expense</th>
              </tr>
            </thead>
            <tbody>
              {grid.map((g) => (
                <tr key={g.jobsPerDay} className="border-t border-slate-100">
                  <td className="py-2">{g.jobsPerDay}</td>
                  <td className="tabular">{num(g.jobs, 1)}</td>
                  <td className="tabular">{money(g.revenue)}</td>
                  <td className="tabular">{num(g.bookedRequired)}</td>
                  <td className="tabular">{money(g.laborExpense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {state.employees.filter((e) => e.active).map((emp) => {
        const row = forecast.rows.find((r) => r.employeeId === emp.id);
        return (
          <Card key={emp.id} title={`${emp.name} · ${row?.role ?? emp.role}${row ? (row.producing ? "" : " · not a producing truck this month") : emp.canRunCalls ? "" : " · not a producing truck"}`}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField label="Hourly wage" money value={emp.hourlyPay} onChange={(n) => patchEmp(emp.id, { hourlyPay: n })} />
              <NumberField label="Burden multiplier" value={emp.laborBurden} step={0.05} onChange={(n) => patchEmp(emp.id, { laborBurden: n })} />
              <NumberField label="Weekly revenue minimum" money value={emp.weeklySalesThreshold} onChange={(n) => patchEmp(emp.id, { weeklySalesThreshold: n })} />
              <NumberField label="Commission rate" percent value={emp.commissionRate} min={0} max={0.3} step={0.01} onChange={(n) => patchEmp(emp.id, { commissionRate: n })} />
              <NumberField label="Paid hours / day" value={emp.paidHoursPerDay} step={0.25} onChange={(n) => patchEmp(emp.id, { paidHoursPerDay: n })} />
              <NumberField label="Productive hours / day" value={emp.productiveHoursPerDay} step={0.25} onChange={(n) => patchEmp(emp.id, { productiveHoursPerDay: n })} />
              <NumberField label="Completed jobs / day target" value={emp.targetCallsPerDay} step={0.1} onChange={(n) => patchEmp(emp.id, { targetCallsPerDay: n })} />
              <NumberField label="Close rate" percent value={emp.targetCloseRate} min={0} max={1} step={0.01} onChange={(n) => patchEmp(emp.id, { targetCloseRate: n })} />
              <NumberField label="Average ticket" money value={emp.targetAvgTicket} onChange={(n) => patchEmp(emp.id, { targetAvgTicket: n })} />
              <NumberField label="Overtime hours / month" value={emp.overtimeHoursMonthly} onChange={(n) => patchEmp(emp.id, { overtimeHoursMonthly: n })} />
              <NumberField label="PTO days / year" value={emp.ptoDaysPerYear} onChange={(n) => patchEmp(emp.id, { ptoDaysPerYear: n })} />
              <NumberField label="Training days / year" value={emp.trainingDaysPerYear} onChange={(n) => patchEmp(emp.id, { trainingDaysPerYear: n })} />
              <NumberField label="Callback rate" percent value={emp.callbackRate} min={0} max={1} step={0.005} onChange={(n) => patchEmp(emp.id, { callbackRate: n })} />
            </div>
            {row ? (
              <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <KV k="Available days" v={num(row.availableDays, 1)} />
                <KV k="Paid hours" v={num(row.paidHours, 1)} />
                <KV k="Productive hours" v={num(row.productiveHours, 1)} />
                <KV k="Labor cost (loaded)" v={money(row.laborCost)} />
                <KV k="Expected jobs" v={num(row.expectedJobs, 1)} />
                <KV k="Expected revenue" v={money(row.expectedRevenue)} />
                <KV k="Expected commission" v={money(row.expectedCommission)} />
                <KV k="Gross profit after labor/materials/subs" v={money(row.grossProfit)} />
                <KV k="Revenue per paid hour" v={money(row.revenuePerPaidHour)} />
                <KV k="Labor cost per job" v={money(row.laborCostPerJob)} />
                <KV k="Booked calls required" v={num(row.bookedCallsRequired)} />
                {emp.payInFixedOverhead ? <KV k="Pay treatment" v="Inside fixed overhead — not extra variable labor" /> : null}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Not on the board this month (start date is after this month).</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-semibold tabular text-navy">{value}</p>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="font-medium tabular text-navy">{v}</dd>
    </div>
  );
}
