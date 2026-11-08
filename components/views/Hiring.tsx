"use client";

import { money, num, pct } from "@/lib/format";
import {
  expectedNewTechCommission,
  expectedNewTechRevenue,
  hiringReadiness,
  hoursPerMonthFromWeekly,
  MONTH_SHORT,
  newTechLoadedMonthly,
  newTechStartup,
  producingTechCount,
  rampForMonth,
  staffingTimeline,
} from "@/lib/plan";
import { useStore } from "@/lib/store";
import type { HiringPlan } from "@/lib/types";
import { Card, DraftBanner, NumberField, PlanningBanner, TextField } from "../ui";

export function HiringView() {
  const { state, today, setState } = useStore();
  const first = state.plan.hiring;
  const second = state.plan.secondHire;
  const ready = hiringReadiness(state, today);
  const days = state.settings.monthlyOperatingDays;
  const ticket = state.settings.averageTicket;
  const timeline = staffingTimeline(state);

  function patchHire(which: "hiring" | "secondHire", p: Partial<HiringPlan>) {
    setState((s) => {
      const next = { ...s.plan[which], ...p };
      const employeeId = next.employeeId;
      return {
        ...s,
        plan: {
          ...s.plan,
          [which]: next,
          lastForecastEdit: new Date().toISOString(),
        },
        employees: s.employees.map((e) =>
          e.id === employeeId
            ? {
                ...e,
                name: p.displayName ?? e.name,
                hourlyPay: p.hourlyWage ?? e.hourlyPay,
                laborBurden: p.laborBurden ?? e.laborBurden,
                weeklySalesThreshold: p.weeklySalesThreshold ?? e.weeklySalesThreshold,
                commissionRate: p.commissionRate ?? e.commissionRate,
                startDate: p.startDate ?? e.startDate,
                productiveHoursPerDay: p.productiveHoursPerDay ?? e.productiveHoursPerDay,
              }
            : e.id === "dustin" && which === "hiring"
              ? e
              : e,
        ),
      };
    });
  }

  const months = MONTH_SHORT.map((label, i) => {
    const added = [first, second].map((hire) => {
      const ramp = rampForMonth(hire, i);
      const revenue = expectedNewTechRevenue(hire, i, ticket, 3, days);
      const commission = expectedNewTechCommission(hire, i, ticket, 3, days);
      const wages = ramp > 0 ? hire.hourlyWage * hoursPerMonthFromWeekly(hire.paidHoursPerWeek) * hire.laborBurden : 0;
      const opex =
        ramp > 0
          ? hire.vehicleMonthly + hire.fuelMonthly + hire.insuranceMonthly + hire.toolsMonthly + hire.uniformsMonthly + hire.extraMarketingMonthly
          : 0;
      const startup = i === Number(hire.startDate.slice(5, 7)) - 1 ? newTechStartup(hire) : 0;
      return { ramp, revenue, cost: wages + commission + opex + startup };
    });
    const revenue = added.reduce((n, a) => n + a.revenue, 0);
    const cost = added.reduce((n, a) => n + a.cost, 0);
    return { label, trucks: producingTechCount(state, i), ramps: added.map((a) => a.ramp), revenue, cost, contribution: revenue - cost, owner: timeline[i]?.ownerRole };
  });

  return (
    <div className="space-y-4">
      <DraftBanner />
      <PlanningBanner />
      <Card title="Owner off the truck and two hired technicians">
        <p className="text-sm text-slate-600">
          January: Dustin and Brien produce revenue. February: Dustin, Brien, and the first new technician. March 1 ({state.plan.ownerOffTruckDate}): Dustin moves to full-time management. March–December: Brien plus two hired technicians run three trucks. Owner compensation stays in management expenses and is not field labor. Nathan stays helper labor. Linda stays office / CSR. Apprentices are not independent trucks.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Readiness label="Call volume" tone={ready.callsOk} detail={`${ready.calls} incoming/day vs ${ready.callNeed} needed for three trucks`} />
          <Readiness label="Cash reserves" tone={ready.cashOk} detail={`${money(ready.cash)} on hand vs ${money(ready.cashNeed)} needed for both hires`} />
          <Readiness label="Profit after hires" tone={ready.profitOk} detail={`Model ${money(ready.projectedProfitAfterHire)}`} />
          <Readiness
            label="Overall"
            tone={ready.overall}
            detail={ready.overall === "green" ? "Supportable on current planning inputs" : "Draft only — do not hire until calls, cash, and profit all clear"}
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">Month</th>
                <th>Trucks</th>
                <th>Producing</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((row) => (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="py-2">{row.label}</td>
                  <td className="tabular">{row.trucks}</td>
                  <td>{row.names.join(", ")}</td>
                  <td>{row.ownerProducing ? "On a truck" : "Full-time management"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <HireEditor title="First new technician — February 1" hire={first} onChange={(p) => patchHire("hiring", p)} />
      <HireEditor title="Second new technician — March 1 (uses Dustin’s truck)" hire={second} onChange={(p) => patchHire("secondHire", p)} />

      <Card title="Ramp, wages, commissions, and incremental P&L">
        <p className="mb-3 text-sm text-slate-600">
          Added revenue uses your average ticket and three completed jobs/day per new tech, scaled by each hire’s 90-day ramp. Wages, payroll burden, commissions above the weekly minimum, truck costs, extra marketing, and startup tools/uniforms are included. Planning estimate only.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">Month</th>
                <th>Trucks</th>
                <th>Owner</th>
                <th>Hire 1 ramp</th>
                <th>Hire 2 ramp</th>
                <th>Added revenue</th>
                <th>Added cost</th>
                <th>Added contribution</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.label} className="border-t border-slate-100">
                  <td className="py-2">{m.label}</td>
                  <td className="tabular">{m.trucks}</td>
                  <td>{m.owner === "producing" ? "On a truck" : "Management"}</td>
                  <td className="tabular">{pct(m.ramps[0] ?? 0, 0)}</td>
                  <td className="tabular">{pct(m.ramps[1] ?? 0, 0)}</td>
                  <td className="tabular">{money(m.revenue)}</td>
                  <td className="tabular">{money(m.cost)}</td>
                  <td className={`tabular ${m.contribution >= 0 ? "text-profit" : "text-brand-red"}`}>{money(m.contribution)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function HireEditor({ title, hire, onChange }: { title: string; hire: HiringPlan; onChange: (p: Partial<HiringPlan>) => void }) {
  const loaded = newTechLoadedMonthly(hire);
  return (
    <Card title={title}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TextField label="Planned start date" value={hire.startDate} onChange={(v) => onChange({ startDate: v })} />
        <TextField label="Display name" value={hire.displayName} onChange={(v) => onChange({ displayName: v })} />
        <NumberField label="Hourly wage" money value={hire.hourlyWage} onChange={(n) => onChange({ hourlyWage: n })} />
        <NumberField label="Weekly revenue minimum" money value={hire.weeklySalesThreshold} onChange={(n) => onChange({ weeklySalesThreshold: n })} />
        <NumberField label="Commission rate above minimum" percent value={hire.commissionRate} min={0} max={0.3} step={0.01} onChange={(n) => onChange({ commissionRate: n })} />
        <NumberField label="Payroll burden multiplier" value={hire.laborBurden} step={0.05} onChange={(n) => onChange({ laborBurden: n })} />
        <NumberField label="Paid hours / week (clock hours)" value={hire.paidHoursPerWeek} onChange={(n) => onChange({ paidHoursPerWeek: n })} />
        <NumberField label="Productive hours / day" value={hire.productiveHoursPerDay} step={0.25} onChange={(n) => onChange({ productiveHoursPerDay: n })} />
        <NumberField label="Vehicle / month" money value={hire.vehicleMonthly} onChange={(n) => onChange({ vehicleMonthly: n })} />
        <NumberField label="Fuel / month" money value={hire.fuelMonthly} onChange={(n) => onChange({ fuelMonthly: n })} />
        <NumberField label="Insurance / month" money value={hire.insuranceMonthly} onChange={(n) => onChange({ insuranceMonthly: n })} />
        <NumberField label="Tools / month" money value={hire.toolsMonthly} onChange={(n) => onChange({ toolsMonthly: n })} />
        <NumberField label="Uniforms / month" money value={hire.uniformsMonthly} onChange={(n) => onChange({ uniformsMonthly: n })} />
        <NumberField label="Startup tools" money value={hire.startupTools} onChange={(n) => onChange({ startupTools: n })} />
        <NumberField label="Startup uniforms" money value={hire.startupUniforms} onChange={(n) => onChange({ startupUniforms: n })} />
        <NumberField label="Extra marketing / month" money value={hire.extraMarketingMonthly} onChange={(n) => onChange({ extraMarketingMonthly: n })} />
        <NumberField label="First-month production ramp" percent value={hire.rampFeb} min={0} max={1} step={0.05} onChange={(n) => onChange({ rampFeb: n })} />
        <NumberField label="Second-month production ramp" percent value={hire.rampMar} min={0} max={1} step={0.05} onChange={(n) => onChange({ rampMar: n })} />
        <NumberField label="Third month onward ramp" percent value={hire.rampAprOnward} min={0} max={1} step={0.05} onChange={(n) => onChange({ rampAprOnward: n })} />
        <NumberField label="Cash months of loaded cost required" value={hire.cashMonthsRequired} onChange={(n) => onChange({ cashMonthsRequired: n })} />
        <NumberField label="Min incoming calls / day to hire" value={hire.minIncomingCallsPerDay} onChange={(n) => onChange({ minIncomingCallsPerDay: n })} />
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Fully loaded monthly cost at 100% ramp: <strong className="tabular">{money(loaded)}</strong>. Startup: <strong className="tabular">{money(newTechStartup(hire))}</strong>.
        {hire.usesExistingTruck ? " This hire uses an existing truck (Dustin’s), so vehicle/fuel/insurance default to $0." : " This hire adds the third service truck."} Paid time uses {num(hoursPerMonthFromWeekly(hire.paidHoursPerWeek), 1)} hours/month from a {hire.paidHoursPerWeek}-hour week × 52 / 12 — not eight billable hours.
      </p>
    </Card>
  );
}

function Readiness({ label, tone, detail }: { label: string; tone: "green" | "yellow" | "red"; detail: string }) {
  const cls = tone === "green" ? "bg-profit text-white" : tone === "yellow" ? "bg-brand-yellow text-navy" : "bg-brand-red text-white";
  return (
    <div className={`rounded-lg p-3 ${cls}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm leading-snug">{detail}</p>
    </div>
  );
}
