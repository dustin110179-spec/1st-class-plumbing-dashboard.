"use client";

import { money, pct, signedMoney } from "@/lib/format";
import {
  groupYear,
  latestViewMonth,
  MONTH_SHORT,
  patchLine,
  pnlMonth,
  pnlYear,
  variance,
} from "@/lib/plan";
import { useStore } from "@/lib/store";
import type { BudgetGroup, BudgetLine } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Btn, Card, DraftBanner, PlanningBanner, Tone } from "../ui";

const GROUPS: { id: BudgetGroup; label: string }[] = [
  { id: "revenue", label: "Revenue" },
  { id: "cogs", label: "Direct job costs" },
  { id: "opex", label: "Operating expenses" },
];

export function BudgetView() {
  const { state, setState } = useStore();
  const { plan } = state;
  const budget = pnlYear(plan.lines, "monthlyBudget");
  const actual = pnlYear(plan.lines, "monthlyActual");
  const forecast = pnlYear(plan.lines, "monthlyForecast");
  const chart = MONTH_SHORT.map((label, i) => {
    const b = pnlMonth(plan.lines, i, "monthlyBudget");
    const latest = latestViewMonth(plan.lines, i);
    return {
      label,
      budgetRevenue: b.revenue,
      latestRevenue: latest.revenue,
      budgetProfit: b.netProfit,
      latestProfit: latest.netProfit,
    };
  });

  function edit(id: string, month: number, field: "monthlyBudget" | "monthlyActual" | "monthlyForecast", value: number) {
    setState((s) => ({ ...s, plan: patchLine(s.plan, id, month, field, value) }));
  }

  function lock() {
    setState((s) => ({
      ...s,
      plan: {
        ...s.plan,
        budgetLocked: !s.plan.budgetLocked,
        budgetLockedAt: !s.plan.budgetLocked ? new Date().toISOString() : s.plan.budgetLockedAt,
      },
    }));
  }

  return (
    <div className="space-y-4">
      <DraftBanner />
      <PlanningBanner />
      <Card
        title="2027 annual operating budget"
        action={
          <Btn tone={plan.budgetLocked ? "ghost" : "navy"} onClick={lock}>
            {plan.budgetLocked ? "Budget locked — forecasts still editable" : "Lock approved budget"}
          </Btn>
        }
      >
        <p className="text-sm text-slate-600">
          Draft starting plan: $1,200,000 revenue remains the initial target. Proposed goals are a 25% net profit margin and a 10% of revenue growth reserve allocated from profit — not an extra operating expense. Two hired technicians (Feb 1 and Mar 1) and Dustin off the truck Mar 1 are in this cost structure. Actuals stay at $0 until you enter or import 2027 results. Do not treat 25% as achieved until this locked budget supports it.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Budget revenue" value={money(budget.revenue)} />
          <Stat label="Budget gross profit" value={money(budget.grossProfit)} sub={`GM ${pct(budget.grossMargin)}`} />
          <Stat label="Budget net profit" value={money(budget.netProfit)} sub={`NM ${pct(budget.netMargin)}`} />
          <Stat
            label="Forecast net profit"
            value={money(forecast.netProfit)}
            sub={`Actual YTD ${money(actual.netProfit)}`}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Last budget edit {plan.lastBudgetEdit ?? "never"} · Last forecast edit {plan.lastForecastEdit ?? "never"} · Last actual edit {plan.lastActualEdit ?? "never"}
          {plan.budgetLockedAt ? ` · Locked ${plan.budgetLockedAt}` : ""}
        </p>
      </Card>

      <Card title="Monthly revenue, expenses, and profit">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid stroke="#E8EEF4" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Legend />
              <Bar dataKey="budgetRevenue" name="Budget revenue" fill="#0A2540" />
              <Bar dataKey="latestRevenue" name="Actual / forecast revenue" fill="#1A4A73" />
              <Bar dataKey="budgetProfit" name="Budget net profit" fill="#147A3F" />
              <Bar dataKey="latestProfit" name="Actual / forecast net profit" fill="#C9A227" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-slate-500">Source: 2027 planning budget in this command center. Actual bars stay at zero until 2027 books are entered.</p>
      </Card>

      {GROUPS.map((g) => (
        <LineTable
          key={g.id}
          title={g.label}
          lines={plan.lines.filter((l) => l.group === g.id)}
          locked={plan.budgetLocked}
          higherIsBetter={g.id === "revenue"}
          onEdit={edit}
        />
      ))}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-paper p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-semibold tabular text-navy">{value}</p>
      {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function LineTable({
  title,
  lines,
  locked,
  higherIsBetter,
  onEdit,
}: {
  title: string;
  lines: BudgetLine[];
  locked: boolean;
  higherIsBetter: boolean;
  onEdit: (id: string, month: number, field: "monthlyBudget" | "monthlyActual" | "monthlyForecast", value: number) => void;
}) {
  const budget = groupYear(lines, lines[0]?.group ?? "revenue", "monthlyBudget");
  const actual = groupYear(lines, lines[0]?.group ?? "revenue", "monthlyActual");
  const v = variance(budget, actual, higherIsBetter);
  return (
    <Card title={title} action={<Tone good={actual === 0 ? null : v.favorable}>{actual === 0 ? "No 2027 actuals yet" : `YTD variance ${signedMoney(v.amount)}`}</Tone>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="p-1">Category</th>
              <th>Field</th>
              {MONTH_SHORT.map((m) => (
                <th key={m} className="p-1">
                  {m}
                </th>
              ))}
              <th className="p-1">Year</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) =>
              (["monthlyBudget", "monthlyForecast", "monthlyActual"] as const).map((field) => (
                <tr key={`${line.id}-${field}`} className="border-t border-slate-100">
                  {field === "monthlyBudget" ? (
                    <td className="p-1 font-medium" rowSpan={3}>
                      {line.name}
                    </td>
                  ) : null}
                  <td className="p-1 text-slate-500">
                    {field === "monthlyBudget" ? "Budget" : field === "monthlyForecast" ? "Forecast" : "Actual"}
                  </td>
                  {line[field].map((n, i) => (
                    <td key={i} className="p-1">
                      <input
                        type="number"
                        className="w-20 rounded border px-1 py-0.5 tabular disabled:bg-slate-50"
                        value={n}
                        disabled={field === "monthlyBudget" && locked}
                        onChange={(e) => onEdit(line.id, i, field, Number(e.target.value))}
                      />
                    </td>
                  ))}
                  <td className="p-1 font-semibold tabular">{money(line[field].reduce((a, b) => a + b, 0))}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
