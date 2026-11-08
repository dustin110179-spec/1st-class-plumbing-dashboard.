"use client";

import { uid } from "@/lib/format";
import { money, pct } from "@/lib/format";
import { producingTechs, simulate } from "@/lib/finance";
import { useStore } from "@/lib/store";
import type { ScenarioAssumptions } from "@/lib/types";
import { Card, NumberField, SliderField } from "../ui";

export function SimulatorView() {
  const { state, today, setState } = useStore();
  const all = [...state.scenarios, ...state.customScenarios];
  const results = all.map((sc) => simulate(sc, state.settings.processingFeeRate, state.settings.membershipAnnualPrice));
  const bestIdx = results.reduce((best, r, i) => (r.operatingProfit > results[best].operatingProfit ? i : best), 0);

  function capture(index: number) {
    const s = state.settings;
    const techs = producingTechs(state.employees, today).length;
    const base = all[index];
    const next: ScenarioAssumptions = {
      ...base,
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
    write(index, next);
  }

  function write(index: number, next: ScenarioAssumptions) {
    setState((st) => {
      if (index < 3) {
        const scenarios = [...st.scenarios] as typeof st.scenarios;
        scenarios[index] = next;
        return { ...st, scenarios };
      }
      const custom = st.customScenarios.map((sc, i) => (i === index - 3 ? next : sc));
      return { ...st, customScenarios: custom };
    });
  }

  function patch(index: number, p: Partial<ScenarioAssumptions>) {
    write(index, { ...all[index], ...p });
  }

  function saveCopy(index: number) {
    const src = all[index];
    setState((st) => ({
      ...st,
      customScenarios: [
        ...st.customScenarios,
        { ...src, id: uid("scen"), name: `${src.name} copy`, lockedPreset: false },
      ],
    }));
  }

  return (
    <div className="space-y-4">
      <Card title="What-if scenario calculator">
        <p className="text-sm text-slate-600">
          Sliders recalculate immediately. Rank by <strong>operating profit</strong>, not revenue. Conservative, Base Case, and Growth are the default planning cases. Saving a custom scenario never overwrites 2027 actuals or the approved budget.
        </p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {all.map((sc, i) => {
          const r = results[i];
          return (
            <Card
              key={sc.id}
              title={sc.name}
              action={
                <div className="flex gap-2">
                  <button type="button" className="text-xs font-medium text-navy underline" onClick={() => capture(i)}>
                    Capture current business
                  </button>
                  <button type="button" className="text-xs font-medium text-navy underline" onClick={() => saveCopy(i)}>
                    Save copy
                  </button>
                </div>
              }
              className={i === bestIdx ? "ring-2 ring-profit" : ""}
            >
              {i === bestIdx ? (
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-profit">Highest operating profit</p>
              ) : null}
              <div className="space-y-3">
                {!sc.lockedPreset ? (
                  <input
                    className="w-full rounded border px-2 py-1 text-sm"
                    value={sc.name}
                    onChange={(e) => patch(i, { name: e.target.value })}
                  />
                ) : null}
                <SliderField label="Average ticket" min={500} max={3000} step={25} value={sc.averageTicket} onChange={(n) => patch(i, { averageTicket: n })} format={money} />
                <SliderField label="Close rate" min={40} max={100} step={1} value={Math.round(sc.closeRate * 100)} onChange={(n) => patch(i, { closeRate: n / 100 })} format={(n) => `${n}%`} />
                <SliderField label="Incoming calls / day" min={0} max={20} step={1} value={sc.incomingCallsPerDay} onChange={(n) => patch(i, { incomingCallsPerDay: n })} />
                <SliderField label="Technicians" min={1} max={10} step={1} value={sc.technicians} onChange={(n) => patch(i, { technicians: n })} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={sc.hireApprentice} onChange={(e) => patch(i, { hireApprentice: e.target.checked })} />
                  Hire / keep an apprentice
                </label>
                <SliderField label="Working days" min={1} max={26} step={1} value={sc.workingDays} onChange={(n) => patch(i, { workingDays: n })} />
                <SliderField label="Gross margin" min={30} max={80} step={1} value={Math.round(sc.grossMargin * 100)} onChange={(n) => patch(i, { grossMargin: n / 100 })} format={(n) => `${n}%`} />
                <NumberField label="Monthly overhead" money value={sc.monthlyOverhead} onChange={(n) => patch(i, { monthlyOverhead: n })} />
                <NumberField label="Labor wage" money value={sc.laborWage} onChange={(n) => patch(i, { laborWage: n })} />
                <NumberField label="Apprentice wage" money value={sc.apprenticeWage} onChange={(n) => patch(i, { apprenticeWage: n })} />
                <NumberField label="Labor burden multiplier" value={sc.laborBurden} step={0.05} onChange={(n) => patch(i, { laborBurden: n })} />
                <NumberField label="Marketing / advertising" money value={sc.marketingBudget} onChange={(n) => patch(i, { marketingBudget: n })} />
                <NumberField label="Materials % of revenue" percent value={sc.materialCostPct} onChange={(n) => patch(i, { materialCostPct: n })} min={0} max={1} step={0.01} />
                <NumberField label="Subcontractor % of revenue" percent value={sc.subCostPct} onChange={(n) => patch(i, { subCostPct: n })} min={0} max={1} step={0.01} />
                <NumberField label="Memberships sold / month" value={sc.membershipSalesPerMonth} onChange={(n) => patch(i, { membershipSalesPerMonth: n })} />
                <NumberField label="Callback rate" percent value={sc.callbackRate} onChange={(n) => patch(i, { callbackRate: n })} min={0} max={1} step={0.005} />
                <SliderField label="Calls per tech per day" min={1} max={8} step={0.1} value={sc.callsPerTechDay} onChange={(n) => patch(i, { callsPerTechDay: n })} />
              </div>
              <dl className="mt-4 space-y-1 text-sm">
                <Line k="Revenue forecast" v={money(r.revenue)} />
                <Line k="Gross profit" v={money(r.grossProfit)} />
                <Line k="Contribution profit" v={money(r.contributionProfit)} />
                <Line k="Net / operating profit" v={money(r.operatingProfit)} strong />
                <Line k="Cash generation (ops profit proxy)" v={money(r.cashGeneration)} />
                <Line k="Required incoming calls / month" v={String(r.requiredCalls ?? "—")} />
                <Line k="Sold jobs" v={String(r.soldJobs)} />
                <Line k="Labor cost" v={money(r.laborCost)} />
                <Line k="Apprentice labor" v={money(r.apprenticeLabor)} />
                <Line k="Break-even working day #" v={r.breakEvenDay == null ? "Not this month" : String(r.breakEvenDay)} />
              </dl>
            </Card>
          );
        })}
      </div>
      <Card title="Side-by-side comparison">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">Metric</th>
                {all.map((sc) => (
                  <th key={sc.id}>{sc.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Revenue", results.map((r) => money(r.revenue))],
                ["Gross profit", results.map((r) => money(r.grossProfit))],
                ["Net profit", results.map((r) => money(r.operatingProfit))],
                ["Cash proxy", results.map((r) => money(r.cashGeneration))],
                ["Required calls", results.map((r) => String(r.requiredCalls ?? "—"))],
                ["Break-even day", results.map((r) => (r.breakEvenDay == null ? "Not this month" : String(r.breakEvenDay)))],
              ].map((row) => (
                <tr key={row[0] as string} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{row[0] as string}</td>
                  {(row[1] as string[]).map((v, i) => (
                    <td key={i} className={`tabular ${row[0] === "Net profit" && i === bestIdx ? "font-bold text-profit" : ""}`}>
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
    <div className="flex justify-between gap-3">
      <dt>{k}</dt>
      <dd className={`tabular ${strong ? "font-bold text-navy" : ""}`}>{v}</dd>
    </div>
  );
}
