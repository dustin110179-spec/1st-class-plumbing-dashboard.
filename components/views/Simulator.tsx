"use client";

import { money, pct } from "@/lib/format";
import { simulate } from "@/lib/finance";
import { useStore } from "@/lib/store";
import type { ScenarioAssumptions } from "@/lib/types";
import { Card, NumberField, SliderField } from "../ui";

export function SimulatorView() {
  const { state, setState } = useStore();
  const results = state.scenarios.map((sc) =>
    simulate(sc, state.settings.processingFeeRate, state.settings.membershipAnnualPrice),
  );
  const bestIdx = results.reduce((best, r, i) => (r.operatingProfit > results[best].operatingProfit ? i : best), 0);

  function capture(i: number) {
    const s = state.settings;
    const techs = state.employees.filter((e) => e.active && e.canRunCalls).length;
    const next: ScenarioAssumptions = {
      ...state.scenarios[i],
      averageTicket: s.averageTicket,
      closeRate: s.closeRate,
      incomingCallsPerDay: s.incomingCallsPerDay,
      technicians: techs,
      workingDays: s.monthlyOperatingDays,
      grossMargin: (s.targetGrossMarginLow + s.targetGrossMarginHigh) / 2,
      monthlyOverhead: s.monthlyFixedOverhead,
      marketingBudget: s.marketingBudgetMonthly,
      materialCostPct: s.assumedMaterialsPct,
      subCostPct: s.assumedSubPct,
      laborBurden: 1.4,
    };
    setState((st) => {
      const scenarios = [...st.scenarios] as typeof st.scenarios;
      scenarios[i] = next;
      return { ...st, scenarios };
    });
  }

  function patch(i: number, patch: Partial<ScenarioAssumptions>) {
    setState((st) => {
      const scenarios = [...st.scenarios] as typeof st.scenarios;
      scenarios[i] = { ...scenarios[i], ...patch };
      return { ...st, scenarios };
    });
  }

  return (
    <div className="space-y-4">
      <Card title="What-if business simulator">
        <p className="text-sm text-slate-600">
          Every slider recalculates immediately. Rank scenarios by <strong>operating profit</strong>, not revenue. Scenario A should be current business; B is improved performance without adding technicians; C is growth (another tech + more marketing).
        </p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {state.scenarios.map((sc, i) => {
          const r = results[i];
          return (
            <Card
              key={sc.name}
              title={sc.name}
              action={
                <button type="button" className="text-xs font-medium text-navy underline" onClick={() => capture(i)}>
                  Capture current business
                </button>
              }
              className={i === bestIdx ? "ring-2 ring-profit" : ""}
            >
              {i === bestIdx ? (
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-profit">Highest operating profit</p>
              ) : null}
              <div className="space-y-3">
                <SliderField label="Average ticket" min={500} max={3000} step={25} value={sc.averageTicket} onChange={(n) => patch(i, { averageTicket: n })} format={money} />
                <SliderField label="Close rate" min={40} max={100} step={1} value={Math.round(sc.closeRate * 100)} onChange={(n) => patch(i, { closeRate: n / 100 })} format={(n) => `${n}%`} />
                <SliderField label="Incoming calls / day" min={0} max={20} step={1} value={sc.incomingCallsPerDay} onChange={(n) => patch(i, { incomingCallsPerDay: n })} />
                <SliderField label="Technicians" min={1} max={10} step={1} value={sc.technicians} onChange={(n) => patch(i, { technicians: n })} />
                <SliderField label="Working days" min={1} max={26} step={1} value={sc.workingDays} onChange={(n) => patch(i, { workingDays: n })} />
                <SliderField label="Gross margin" min={30} max={80} step={1} value={Math.round(sc.grossMargin * 100)} onChange={(n) => patch(i, { grossMargin: n / 100 })} format={(n) => `${n}%`} />
                <NumberField label="Monthly overhead" money value={sc.monthlyOverhead} onChange={(n) => patch(i, { monthlyOverhead: n })} />
                <NumberField label="Labor wage" money value={sc.laborWage} onChange={(n) => patch(i, { laborWage: n })} />
                <NumberField label="Labor burden multiplier" value={sc.laborBurden} step={0.05} onChange={(n) => patch(i, { laborBurden: n })} />
                <NumberField label="Marketing budget" money value={sc.marketingBudget} onChange={(n) => patch(i, { marketingBudget: n })} />
                <NumberField label="Materials % of revenue" percent value={sc.materialCostPct} onChange={(n) => patch(i, { materialCostPct: n })} min={0} max={1} step={0.01} />
                <NumberField label="Subcontractor % of revenue" percent value={sc.subCostPct} onChange={(n) => patch(i, { subCostPct: n })} min={0} max={1} step={0.01} />
                <NumberField label="Memberships sold / month" value={sc.membershipSalesPerMonth} onChange={(n) => patch(i, { membershipSalesPerMonth: n })} />
                <NumberField label="Callback rate" percent value={sc.callbackRate} onChange={(n) => patch(i, { callbackRate: n })} min={0} max={1} step={0.005} />
                <SliderField label="Calls per tech per day" min={1} max={8} step={0.1} value={sc.callsPerTechDay} onChange={(n) => patch(i, { callsPerTechDay: n })} />
              </div>
              <dl className="mt-4 space-y-1 text-sm">
                <Line k="Revenue forecast" v={money(r.revenue)} />
                <Line k="Gross profit" v={money(r.grossProfit)} />
                <Line k="Operating profit" v={money(r.operatingProfit)} strong />
                <Line k="Break-even working day #" v={r.breakEvenDay == null ? "Not this month" : String(r.breakEvenDay)} />
                <Line k="Sold jobs" v={String(r.soldJobs)} />
                <Line k="Revenue per technician" v={money(r.revenuePerTech)} />
                <Line k="Revenue per crew hour" v={money(r.revenuePerCrewHour)} />
                <Line k="Expected cash generation" v={money(r.cashGeneration)} />
                <Line k="Labor % of revenue" v={pct(r.laborPct)} />
              </dl>
            </Card>
          );
        })}
      </div>
      <Card title="Side-by-side">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">Metric</th>
                {state.scenarios.map((sc) => (
                  <th key={sc.name}>{sc.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Revenue", results.map((r) => money(r.revenue))],
                ["Gross profit", results.map((r) => money(r.grossProfit))],
                ["Operating profit", results.map((r) => money(r.operatingProfit))],
                ["Break-even day", results.map((r) => (r.breakEvenDay == null ? "Not this month" : String(r.breakEvenDay)))],
              ].map((row) => (
                <tr key={row[0] as string} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{row[0] as string}</td>
                  {(row[1] as string[]).map((v, i) => (
                    <td key={i} className={`tabular ${row[0] === "Operating profit" && i === bestIdx ? "font-bold text-profit" : ""}`}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Line({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt>{k}</dt>
      <dd className={`tabular ${strong ? "font-bold text-navy" : ""}`}>{v}</dd>
    </div>
  );
}
