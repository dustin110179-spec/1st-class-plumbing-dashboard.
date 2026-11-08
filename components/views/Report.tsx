"use client";

import { ownerAlerts } from "@/lib/alerts";
import { formatLong, monthKey } from "@/lib/calendar";
import { money, num, pct } from "@/lib/format";
import {
  membershipMetrics,
  marketingMetrics,
  producingTechs,
  projectMonth,
  techScorecard,
} from "@/lib/finance";
import { useStore } from "@/lib/store";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../ui";

export function ReportView() {
  const { state, today } = useStore();
  const p = projectMonth(state, today);
  const alerts = ownerAlerts(state, today);
  const problems = alerts.filter((a) => a.severity === "red" || a.severity === "yellow").slice(0, 3);
  const actions = alerts.slice(0, 3);
  const techs = producingTechs(state.employees);
  const mem = membershipMetrics(state.memberships, state.settings, today);
  const mkt = marketingMetrics(state.marketing, state.settings);
  const prev = previousMonth(p.monthKey);
  const prevRow = state.monthlyActuals.find((m) => m.month === prev);
  const thisRow = state.monthlyActuals.find((m) => m.month === p.monthKey);
  const trend = [...state.monthlyActuals].slice(-12);

  return (
    <div className="print-page space-y-4">
      <Card
        title="Monthly owner report"
        action={
          <button type="button" className="no-print rounded-lg bg-navy px-3 py-2 text-sm text-white" onClick={() => window.print()}>
            Print / save PDF
          </button>
        }
      >
        <p className="text-sm text-slate-600">
          {state.settings.companyName} · {formatLong(today)} · {state.sampleMode ? "SAMPLE DATA — not actual performance" : p.dataMode === "forecast" ? "Figures are forecasts until daily actuals are entered" : "Based on entered actuals plus remaining-month forecast"}
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile k="Revenue vs $100k goal" v={`${money(p.mtdCompletedRevenue)} / ${money(p.monthlyRevenueGoal)}`} />
        <Tile k="Projected month-end revenue" v={money(p.projectedMonthEndRevenue)} />
        <Tile k="Gross profit (projected)" v={money(p.projectedGrossProfit)} />
        <Tile k="Contribution profit (projected)" v={money(p.projectedContributionProfit)} />
        <Tile k="Operating profit (projected)" v={money(p.projectedOperatingProfit)} />
        <Tile k="Cost-based break-even" v={money(p.monthlyCostBreakEven)} />
        <Tile k="Break-even date" v={p.notProjectedToBreakEven ? "Not this month" : p.projectedBreakEvenDate ?? "—"} />
        <Tile k="Average ticket" v={money(p.currentAvgTicket)} />
        <Tile k="Close rate" v={pct(p.currentCloseRate)} />
        <Tile k="Historical cash benchmark vs plan" v={money(p.projectedCashProfit)} />
      </div>

      <Card title="Month-over-month">
        {prevRow || thisRow ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th>Metric</th>
                <th>{prev}</th>
                <th>{p.monthKey}</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              <MoM label="Revenue" a={prevRow?.revenue} b={thisRow?.revenue ?? p.mtdCompletedRevenue} />
              <MoM label="Gross profit" a={prevRow?.grossProfit} b={thisRow?.grossProfit ?? p.projectedGrossProfit} />
              <MoM label="Operating profit" a={prevRow?.operatingProfit} b={thisRow?.operatingProfit ?? p.projectedOperatingProfit} />
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">Enter prior months under Settings → 12-month trend to unlock comparisons. Current month uses live books.</p>
        )}
      </Card>

      {trend.length > 0 ? (
        <Card title="12-month revenue and profit trend">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid stroke="#E8EEF4" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Line dataKey="revenue" name="Revenue" stroke="#0A2540" dot={false} />
                <Line dataKey="grossProfit" name="Gross profit" stroke="#147A3F" dot={false} />
                <Line dataKey="operatingProfit" name="Operating profit" stroke="#C12216" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {trend.some((t) => t.isSample) ? <p className="mt-2 text-xs text-slate-500">Includes SAMPLE DATA months.</p> : null}
        </Card>
      ) : null}

      <Card title="Technician performance">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th>Tech</th>
              <th>Sold</th>
              <th>Avg ticket</th>
              <th>Close</th>
              <th>Rev / paid hr</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {techs.map((t) => {
              const c = techScorecard(state, t.id, `${p.monthKey}-01`, today);
              if (!c) return null;
              return (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="py-1">{t.name}</td>
                  <td className="tabular">{money(c.soldRevenue)}</td>
                  <td className="tabular">{money(c.avgTicket)}</td>
                  <td>{pct(c.closeRate)}</td>
                  <td className="tabular">{money(c.revenuePerPaidHour)}</td>
                  <td>{pct(c.grossMargin)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title="Marketing">
        <ul className="text-sm">
          {mkt
            .filter((m) => m.monthlySpend > 0 || m.revenue > 0)
            .map((m) => (
              <li key={m.id} className="flex justify-between border-b border-slate-100 py-1">
                <span>{m.name}</span>
                <span className="tabular">
                  {money(m.monthlySpend)} spend → {money(m.revenue)} rev · GP after {money(m.gpAfter)}
                </span>
              </li>
            ))}
        </ul>
      </Card>

      <Card title="Membership growth">
        <p className="text-sm">
          Active {num(mem.active)} · New {num(mem.newThisMonth)} · Canceled {num(mem.canceledThisMonth)} · MRR {money(mem.mrr, 2)} · ARR {money(mem.arr, 2)}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Three biggest problems">
          <ol className="list-decimal space-y-2 pl-4 text-sm">
            {problems.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong>
                <div className="text-slate-600">{a.detail}</div>
              </li>
            ))}
            {problems.length === 0 ? <li>No material problems from current data.</li> : null}
          </ol>
        </Card>
        <Card title="Three recommended actions for next month">
          <ol className="list-decimal space-y-2 pl-4 text-sm">
            {actions.map((a) => (
              <li key={a.id}>{a.title}</li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase text-navy-700">{k}</p>
      <p className="mt-1 text-lg font-semibold tabular text-navy">{v}</p>
    </div>
  );
}

function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return d.toISOString().slice(0, 7);
}

function MoM({ label, a, b }: { label: string; a?: number; b?: number }) {
  const change = a != null && b != null ? b - a : null;
  return (
    <tr className="border-t border-slate-100">
      <td className="py-1">{label}</td>
      <td className="tabular">{money(a)}</td>
      <td className="tabular">{money(b)}</td>
      <td className={`tabular ${change == null ? "" : change >= 0 ? "text-profit" : "text-brand-red"}`}>
        {change == null ? "—" : money(change)}
      </td>
    </tr>
  );
}
