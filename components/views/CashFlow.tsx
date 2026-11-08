"use client";

import { addDays, weekStartMonday } from "@/lib/calendar";
import { money } from "@/lib/format";
import { cashForecast, endingCash } from "@/lib/finance";
import { MONTH_SHORT, ownerPayPlan, twelveMonthCash } from "@/lib/plan";
import { useStore } from "@/lib/store";
import type { CashWeek } from "@/lib/types";
import { Card, NumberField } from "../ui";

const FIELDS: { key: keyof CashWeek; label: string; inflow?: boolean }[] = [
  { key: "collections", label: "Customer collections", inflow: true },
  { key: "deposits", label: "Customer deposits (not earned)", inflow: true },
  { key: "accountsReceivable", label: "AR outstanding (info)" },
  { key: "payroll", label: "Payroll" },
  { key: "payrollTaxes", label: "Payroll taxes" },
  { key: "materials", label: "Materials" },
  { key: "subcontractors", label: "Subcontractors" },
  { key: "marketing", label: "Marketing" },
  { key: "software", label: "Software" },
  { key: "loanPayments", label: "Loan / interest (if not principal)" },
  { key: "debtPrincipal", label: "Debt principal (cash only)" },
  { key: "taxes", label: "Taxes (cash)" },
  { key: "ownerSalary", label: "Owner salary (cash)" },
  { key: "ownerDistributions", label: "Owner distributions" },
  { key: "other", label: "Other" },
];

export function CashFlowView() {
  const { state, today, setState, patchSettings } = useStore();
  let weeks = state.cashWeeks;
  if (weeks.length === 0) {
    weeks = seedWeeks(weekStartMonday(today), state.settings.beginningBankBalance);
  }
  const rolled = cashForecast(weeks, state.settings.beginningBankBalance);
  const payrollRisk = rolled.filter((w) => endingCash(w) < w.payroll && w.payroll > 0);

  function ensure() {
    if (state.cashWeeks.length === 0) {
      setState((s) => ({ ...s, cashWeeks: seedWeeks(weekStartMonday(today), s.settings.beginningBankBalance) }));
    }
  }

  function patchWeek(weekStart: string, key: keyof CashWeek, n: number | string) {
    ensure();
    setState((s) => {
      const list = s.cashWeeks.length ? s.cashWeeks : seedWeeks(weekStartMonday(today), s.settings.beginningBankBalance);
      return {
        ...s,
        cashWeeks: list.map((w) => (w.weekStart === weekStart ? { ...w, [key]: n } : w)),
      };
    });
  }

  return (
    <div className="space-y-4">
      <Card title="13-week rolling cash-flow forecast">
        <p className="text-sm text-slate-600">
          Deposits are cash in the bank, not earned revenue. Collections are cash from invoiced work. Ending cash is beginning + collections + deposits − outflows. Owner salary and distributions are separate. Debt principal is cash only — it is not an operating expense. Accounting profit and cash will not match.
        </p>
        <div className="mt-3 max-w-xs">
          <NumberField
            label="Beginning bank balance (week 1)"
            money
            value={state.settings.beginningBankBalance}
            onChange={(n) => patchSettings({ beginningBankBalance: n })}
          />
        </div>
        {payrollRisk.length > 0 ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red">
            Projected cash is insufficient to cover payroll in the week of {payrollRisk.map((w) => w.weekStart).join(", ")}.
          </p>
        ) : (
          <p className="mt-3 text-sm text-profit">No payroll shortfall in the current 13-week view.</p>
        )}
      </Card>
      <div className="overflow-x-auto rounded-xl bg-white p-3 shadow-card">
        <table className="w-full min-w-[1400px] text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="p-1">Week starting</th>
              {rolled.map((w) => (
                <th key={w.weekStart} className="p-1 tabular">
                  {w.weekStart.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-1 font-medium">Beginning cash</td>
              {rolled.map((w) => (
                <td key={w.weekStart} className="p-1 tabular">
                  {money(w.beginningBalance)}
                </td>
              ))}
            </tr>
            {FIELDS.map((f) => (
              <tr key={f.key} className="border-t border-slate-100">
                <td className="p-1">{f.label}</td>
                {rolled.map((w) => (
                  <td key={w.weekStart} className="p-1">
                    <input
                      type="number"
                      className="w-24 rounded border px-1 py-1"
                      value={Number(w[f.key] ?? 0)}
                      onChange={(e) => patchWeek(w.weekStart, f.key, Number(e.target.value))}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-navy font-semibold">
              <td className="p-1">Ending cash</td>
              {rolled.map((w) => {
                const end = endingCash(w);
                return (
                  <td key={w.weekStart} className={`p-1 tabular ${end < w.payroll && w.payroll > 0 ? "text-brand-red" : "text-profit"}`}>
                    {money(end)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <TwelveMonth />
    </div>
  );
}

function TwelveMonth() {
  const { state, patchSettings, setState } = useStore();
  const months = twelveMonthCash(state);
  const owner = ownerPayPlan(state);
  const warned = months.filter((m) => m.belowReserve);

  return (
    <>
      <Card title="12-month cash projection vs accounting profit">
        <p className="text-sm text-slate-600">
          Seeded from the 2027 plan using a 92% collection assumption. Edit the rows. Owner salary is already inside the payroll figure so the extra owner-salary column starts at $0. Debt principal starts at $0 and is cash only.
        </p>
        {warned.length > 0 ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red">
            Projected cash falls below the {money(state.settings.cashReserveTarget)} reserve in {warned.map((w) => MONTH_SHORT[w.month]).join(", ")}.
          </p>
        ) : (
          <p className="mt-3 text-sm text-profit">No month in this planning view finishes below the cash-reserve target.</p>
        )}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="p-1">Month</th>
                {MONTH_SHORT.map((m) => (
                  <th key={m} className="p-1">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["collections", "Collections"],
                  ["payroll", "Payroll (incl. owner salary)"],
                  ["materials", "Materials"],
                  ["subcontractors", "Subcontractors"],
                  ["overhead", "Overhead (cash)"],
                  ["taxes", "Taxes"],
                  ["debtPrincipal", "Debt principal"],
                  ["ownerSalary", "Owner salary (extra)"],
                  ["ownerDistributions", "Owner distributions"],
                  ["other", "Other"],
                ] as const
              ).map(([key, label]) => (
                <tr key={key} className="border-t border-slate-100">
                  <td className="p-1">{label}</td>
                  {months.map((row) => (
                    <td key={row.month} className="p-1">
                      <input
                        type="number"
                        className="w-20 rounded border px-1 py-0.5"
                        value={row[key]}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            plan: {
                              ...s.plan,
                              monthlyCash: s.plan.monthlyCash.map((m) =>
                                m.month === row.month ? { ...m, [key]: Number(e.target.value) } : m,
                              ),
                            },
                          }))
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-navy font-semibold">
                <td className="p-1">Ending cash</td>
                {months.map((m) => (
                  <td key={m.month} className={`p-1 tabular ${m.belowReserve ? "text-brand-red" : "text-profit"}`}>
                    {money(m.ending)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-1">Accounting profit (budget/forecast)</td>
                {months.map((m) => (
                  <td key={m.month} className="p-1 tabular">
                    {money(m.accountingProfit)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Owner pay planner">
        <p className="text-sm text-slate-600">
          Salary is an operating cost and is already inside the owner-compensation budget line. Distributions are cash only and do not reduce operating profit.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Owner salary / month" money value={state.settings.ownerMonthlySalary} onChange={(n) => patchSettings({ ownerMonthlySalary: n })} />
          <NumberField
            label="Planned distributions / month"
            money
            value={state.settings.plannedMonthlyDistribution}
            onChange={(n) => patchSettings({ plannedMonthlyDistribution: n })}
          />
          <NumberField label="Minimum cash reserve" money value={state.settings.cashReserveTarget} onChange={(n) => patchSettings({ cashReserveTarget: n })} />
          <div className="rounded-lg bg-paper p-3">
            <p className="text-[11px] font-semibold uppercase text-slate-500">Extra cash the plan can spare / month</p>
            <p className={`text-xl font-semibold tabular ${owner.safe ? "text-profit" : "text-brand-red"}`}>{money(owner.maxExtraMonthly)}</p>
            <p className="text-xs text-slate-500">
              Lowest month {money(owner.minEndingCash)} vs reserve {money(owner.reserve)}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}

function seedWeeks(start: string, beginning: number): CashWeek[] {
  const weeks: CashWeek[] = [];
  let cur = start;
  for (let i = 0; i < 13; i++) {
    weeks.push({
      weekStart: cur,
      beginningBalance: i === 0 ? beginning : 0,
      collections: 0,
      accountsReceivable: 0,
      deposits: 0,
      payroll: 0,
      payrollTaxes: 0,
      materials: 0,
      subcontractors: 0,
      marketing: 0,
      software: 0,
      loanPayments: 0,
      ownerSalary: 0,
      ownerDistributions: 0,
      debtPrincipal: 0,
      taxes: 0,
      other: 0,
      majorBills: "",
      notes: "",
      isSample: false,
    });
    cur = addDays(cur, 7);
  }
  return weeks;
}
