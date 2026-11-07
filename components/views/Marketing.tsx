"use client";

import { money, num, pct } from "@/lib/format";
import { marketingMetrics } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../ui";

export function MarketingView() {
  const { state, setState } = useStore();
  const rows = marketingMetrics(state.marketing, state.settings);
  const chart = rows.map((r) => ({
    name: r.name.replace("Google ", ""),
    spend: r.monthlySpend,
    revenue: r.revenue,
    gpAfter: r.gpAfter,
  }));

  function patch(id: string, field: "monthlySpend" | "leads" | "booked" | "sold" | "revenue" | "grossProfit", n: number) {
    setState((s) => ({
      ...s,
      marketing: s.marketing.map((m) => (m.id === id ? { ...m, [field]: n } : m)),
    }));
  }

  return (
    <div className="space-y-4">
      <Card title="Marketing and lead performance">
        <p className="text-sm text-slate-600">
          Return on marketing spend is revenue ÷ spend. Gross profit after marketing is the source GP minus spend. Extra calls to justify cost are how many additional sold jobs at that source’s GP per job would cover a loss.
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
              <th>Spend</th>
              <th>Leads</th>
              <th>Booked</th>
              <th>Sold</th>
              <th>Revenue</th>
              <th>GP</th>
              <th>CPL</th>
              <th>Cost / booked</th>
              <th>CAC</th>
              <th>ROMS</th>
              <th>GP after mkt</th>
              <th>Extra sold jobs to justify</th>
              <th>Profitable?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 align-top">
                <td className="p-2 font-medium">{r.name}</td>
                <td><Mini n={r.monthlySpend} on={ (v) => patch(r.id, "monthlySpend", v)} money /></td>
                <td><Mini n={r.leads} on={(v) => patch(r.id, "leads", v)} /></td>
                <td><Mini n={r.booked} on={(v) => patch(r.id, "booked", v)} /></td>
                <td><Mini n={r.sold} on={(v) => patch(r.id, "sold", v)} /></td>
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
