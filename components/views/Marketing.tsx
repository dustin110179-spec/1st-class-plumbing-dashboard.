"use client";

import { money, num, pct } from "@/lib/format";
import { marketingMetrics } from "@/lib/finance";
import { marketingNeedForThreeTechs } from "@/lib/plan";
import { useStore } from "@/lib/store";
import type { ServiceCity } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../ui";

export function MarketingView() {
  const { state, setState } = useStore();
  const rows = marketingMetrics(state.marketing, state.settings);
  const three = marketingNeedForThreeTechs(state);
  const richardsonSpend = rows.filter((r) => r.city === "richardson").reduce((n, r) => n + r.monthlySpend, 0);
  const planoSpend = rows.filter((r) => r.city === "plano").reduce((n, r) => n + r.monthlySpend, 0);
  const chart = rows.map((r) => ({
    name: r.name.replace("Google ", ""),
    spend: r.monthlySpend,
    revenue: r.revenue,
    gpAfter: r.gpAfter,
  }));

  function patch(
    id: string,
    field: "monthlySpend" | "leads" | "booked" | "sold" | "completed" | "revenue" | "grossProfit",
    n: number,
  ) {
    setState((s) => ({
      ...s,
      marketing: s.marketing.map((m) => (m.id === id ? { ...m, [field]: n } : m)),
    }));
  }

  return (
    <div className="space-y-4">
      <Card title="Marketing and lead performance">
        <p className="text-sm text-slate-600">
          Return on advertising spend is revenue ÷ spend. Gross profit after advertising is source GP minus spend. Cost per lead = spend / leads. Cost per acquired customer = spend / sold jobs. QuickBooks/Podium are not connected — enter spend and results here or import a CSV.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="rounded-lg bg-paper p-3">
            <p className="text-[11px] font-semibold uppercase text-slate-500">Monthly ad budget</p>
            <p className="text-xl font-semibold tabular">{money(state.settings.marketingBudgetMonthly)}</p>
          </div>
          <div className="rounded-lg bg-paper p-3">
            <p className="text-[11px] font-semibold uppercase text-slate-500">Entered spend</p>
            <p className="text-xl font-semibold tabular">{money(rows.reduce((n, r) => n + r.monthlySpend, 0))}</p>
          </div>
          <div className="rounded-lg bg-paper p-3">
            <p className="text-[11px] font-semibold uppercase text-slate-500">Leads / booked / sold</p>
            <p className="text-xl font-semibold tabular">
              {num(rows.reduce((n, r) => n + r.leads, 0))} / {num(rows.reduce((n, r) => n + r.booked, 0))} / {num(rows.reduce((n, r) => n + r.sold, 0))}
            </p>
          </div>
          <div className="rounded-lg bg-paper p-3">
            <p className="text-[11px] font-semibold uppercase text-slate-500">To keep 3 techs busy</p>
            <p className="text-sm">
              {num(three.jobsNeeded, 1)} jobs · {num(three.booked)} booked · {num(three.leads)} leads. Extra hire marketing {money(three.extraSpendForThird)}/mo from February.
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Richardson-tagged spend {money(richardsonSpend)} · Plano-tagged spend {money(planoSpend)}. Sources tagged “both” are counted in each city’s tagged total only if you split them — they are shown in the table as both.
        </p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid stroke="#E8EEF4" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Legend />
              <Bar dataKey="spend" name="Spend" fill="#C12216" />
              <Bar dataKey="revenue" name="Revenue" fill="#0A2540" />
              <Bar dataKey="gpAfter" name="GP after marketing" fill="#147A3F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="overflow-x-auto rounded-xl bg-white p-3 shadow-card">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="p-2">Source</th>
              <th>City</th>
              <th>Spend</th>
              <th>Leads</th>
              <th>Booked</th>
              <th>Sold</th>
              <th>Completed</th>
              <th>Revenue</th>
              <th>GP</th>
              <th>CPL</th>
              <th>Cost / booked</th>
              <th>CAC</th>
              <th>ROAS</th>
              <th>GP after ads</th>
              <th>Extra sold jobs to justify</th>
              <th>Profitable?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 align-top">
                <td className="p-2 font-medium">{r.name}</td>
                <td>
                  <select
                    className="rounded border px-1 py-1 text-xs"
                    value={r.city}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        marketing: s.marketing.map((m) =>
                          m.id === r.id ? { ...m, city: e.target.value as ServiceCity | "both" } : m,
                        ),
                      }))
                    }
                  >
                    <option value="richardson">Richardson</option>
                    <option value="plano">Plano</option>
                    <option value="both">Both</option>
                    <option value="other">Other</option>
                  </select>
                </td>
                <td><Mini n={r.monthlySpend} on={ (v) => patch(r.id, "monthlySpend", v)} money /></td>
                <td><Mini n={r.leads} on={(v) => patch(r.id, "leads", v)} /></td>
                <td><Mini n={r.booked} on={(v) => patch(r.id, "booked", v)} /></td>
                <td><Mini n={r.sold} on={(v) => patch(r.id, "sold", v)} /></td>
                <td><Mini n={r.completed} on={(v) => patch(r.id, "completed", v)} /></td>
                <td><Mini n={r.revenue} on={(v) => patch(r.id, "revenue", v)} money /></td>
                <td><Mini n={r.grossProfit} on={(v) => patch(r.id, "grossProfit", v)} money /></td>
                <td className="tabular">{money(r.cpl)}</td>
                <td className="tabular">{money(r.cpa)}</td>
                <td className="tabular">{money(r.cac)}</td>
                <td className="tabular">{r.roms == null ? "—" : `${r.roms.toFixed(1)}x`}</td>
                <td className={`tabular ${r.gpAfter >= 0 ? "text-profit" : "text-brand-red"}`}>{money(r.gpAfter)}</td>
                <td className="tabular">{num(r.extraJobsToJustify)}</td>
                <td className={r.profitable ? "text-profit" : "text-brand-red"}>{r.profitable ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Mini({ n, on, money: asMoney }: { n: number; on: (n: number) => void; money?: boolean }) {
  return (
    <input
      type="number"
      className="w-24 rounded border border-slate-200 px-1 py-1"
      value={n}
      onChange={(e) => on(Number(e.target.value))}
    />
  );
}
