"use client";

import { periodRange } from "@/lib/calendar";
import { money, num, pct } from "@/lib/format";
import { crewScorecard, loadedWage, techScorecard } from "@/lib/finance";
import { newEmployee, useStore } from "@/lib/store";
import type { ScorecardPeriod } from "@/lib/types";
import { useState } from "react";
import { Btn, Card, NumberField, TextField } from "../ui";

export function TechniciansView() {
  const { state, today, setState } = useStore();
  const [period, setPeriod] = useState<ScorecardPeriod>("week");
  const range = periodRange(period, today);

  return (
    <div className="space-y-4">
      <Card
        title="Technician KPI scorecards"
        action={
          <div className="flex flex-wrap gap-2">
            {(["day", "week", "month", "ytd"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded px-2 py-1 text-xs font-semibold uppercase ${period === p ? "bg-navy text-white" : "bg-navy-100 text-navy"}`}
              >
                {p === "ytd" ? "YTD" : p}
              </button>
            ))}
            <Btn onClick={() => setState((s) => ({ ...s, employees: [...s.employees, newEmployee()] }))}>Add employee</Btn>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Dustin produces and sells; his owner salary is in the $47,000 fixed expenses, so his job hours are not counted again as variable labor. Noah is office and also in fixed expenses. Brien’s commission is 10% of weekly sold revenue above $7,500. Nathan is scored as an apprentice and as Brien’s helper. Paid hours are independent of an eight-hour day.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {state.employees.map((emp) => {
          const card = techScorecard(state, emp.id, range.from, range.to);
          if (!card) return null;
          const ticketGood = card.avgTicket == null || emp.targetAvgTicket === 0 ? null : card.avgTicket >= emp.targetAvgTicket;
          const closeGood = card.closeRate == null || emp.targetCloseRate === 0 ? null : card.closeRate >= emp.targetCloseRate;
          return (
            <Card key={emp.id} title={`${emp.name} · ${emp.role}`}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Stat k="Revenue sold" v={money(card.soldRevenue)} />
                <Stat k="Revenue completed" v={money(card.completedRevenue)} />
                <Stat k="Average ticket" v={money(card.avgTicket)} good={ticketGood} />
                <Stat k="Close rate" v={pct(card.closeRate)} good={closeGood} />
                <Stat k="Calls completed" v={num(card.callsCompleted)} />
                <Stat k="Rev / paid hour" v={money(card.revenuePerPaidHour)} />
                <Stat k="Rev / working day" v={money(card.revenuePerWorkingDay)} />
                <Stat k="Gross margin" v={pct(card.grossMargin)} good={card.grossMargin == null ? null : card.grossMargin >= 0.6} />
                <Stat k="Labor cost %" v={pct(card.laborPct)} good={card.laborHigh ? false : card.laborPct == null ? null : true} />
                <Stat k="Memberships sold" v={num(card.membershipsSold)} />
                <Stat k="Reviews" v={card.reviewAvg == null ? "—" : `${card.reviewAvg.toFixed(1)} (${card.reviewCount})`} />
                <Stat k="Callback %" v={pct(card.callbackPct)} good={card.callbackPct == null ? null : card.callbackPct <= state.settings.callbackRateTarget} />
                <Stat k="GBB presented" v={`${num(card.gbbPresented)} (${pct(card.gbbPct)})`} />
                <Stat k="Financing offered" v={num(card.financingOffered)} />
                <Stat k="Opportunities missed" v={num(card.missed)} good={card.missed === 0} />
                <Stat k="Commission earned" v={money(card.commission)} />
                <Stat k="Paid hours" v={num(card.paidHours, 1)} />
                <Stat k="Loaded hourly" v={money(loadedWage(emp), 2)} />
              </div>
              {emp.payInFixedOverhead ? (
                <p className="mt-3 rounded-lg bg-navy-100 px-3 py-2 text-sm text-navy">
                  {emp.name}’s pay is included in the $47,000 fixed expenses, so job hours are not counted again as variable labor.
                  {emp.id === "noah" ? " Enter Noah’s monthly salary under Edit pay if you want it shown as an allocation inside that $47,000." : ""}
                </p>
              ) : null}
              {emp.weeklySalesThreshold > 0 ? (
                <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${card.soldRevenue >= emp.weeklySalesThreshold ? "bg-green-50 text-profit" : "bg-red-50 text-brand-red"}`}>
                  Weekly threshold {money(emp.weeklySalesThreshold)}: {card.soldRevenue >= emp.weeklySalesThreshold ? "reached" : `short ${money(emp.weeklySalesThreshold - card.soldRevenue)}`} this {period === "week" ? "week" : "period"} ({money(card.soldRevenue)} sold).
                </p>
              ) : null}
              {card.laborHigh ? (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red">
                  Labor costs are too high for the revenue generated.
                </p>
              ) : null}

              {emp.role === "apprentice" ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-bold uppercase text-navy">Apprentice development</p>
                  {emp.skills.map((sk, i) => (
                    <label key={sk.name} className="block text-xs">
                      <span className="flex justify-between">
                        {sk.name}
                        <span>{sk.level}%</span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sk.level}
                        className="w-full accent-navy"
                        onChange={(e) => {
                          const level = Number(e.target.value);
                          setState((st) => ({
                            ...st,
                            employees: st.employees.map((x) =>
                              x.id === emp.id
                                ? { ...x, skills: x.skills.map((s, j) => (j === i ? { ...s, level } : s)) }
                                : x,
                            ),
                          }));
                        }}
                      />
                    </label>
                  ))}
                </div>
              ) : null}

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-navy">Edit pay / assignment</summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <TextField
                    label="Name"
                    value={emp.name}
                    onChange={(v) => setState((st) => ({ ...st, employees: st.employees.map((x) => (x.id === emp.id ? { ...x, name: v } : x)) }))}
                  />
                  <NumberField
                    label="Hourly pay"
                    money
                    value={emp.hourlyPay}
                    onChange={(n) => setState((st) => ({ ...st, employees: st.employees.map((x) => (x.id === emp.id ? { ...x, hourlyPay: n } : x)) }))}
                  />
                  <NumberField
                    label="Labor burden"
                    value={emp.laborBurden}
                    step={0.05}
                    onChange={(n) => setState((st) => ({ ...st, employees: st.employees.map((x) => (x.id === emp.id ? { ...x, laborBurden: n } : x)) }))}
                  />
                  <NumberField
                    label="Weekly sales threshold"
                    money
                    value={emp.weeklySalesThreshold}
                    onChange={(n) => setState((st) => ({ ...st, employees: st.employees.map((x) => (x.id === emp.id ? { ...x, weeklySalesThreshold: n } : x)) }))}
                  />
                  <NumberField
                    label="Commission rate"
                    percent
                    value={emp.commissionRate}
                    onChange={(n) => setState((st) => ({ ...st, employees: st.employees.map((x) => (x.id === emp.id ? { ...x, commissionRate: n } : x)) }))}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <NumberField
                    label="Owner compensation / month"
                    money
                    value={emp.ownerCompMonthly}
                    onChange={(n) => setState((st) => ({ ...st, employees: st.employees.map((x) => (x.id === emp.id ? { ...x, ownerCompMonthly: n } : x)) }))}
                  />
                  <label className="block text-xs">
                    <span className="mb-1 block text-slate-600">Assigned helper-of / to</span>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-2 py-2"
                      value={emp.assignedToId ?? ""}
                      onChange={(e) =>
                        setState((st) => ({
                          ...st,
                          employees: st.employees.map((x) =>
                            x.id === emp.id ? { ...x, assignedToId: e.target.value || null } : x,
                          ),
                        }))
                      }
                    >
                      <option value="">None</option>
                      {state.employees
                        .filter((x) => x.id !== emp.id)
                        .map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="mt-6 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={emp.canRunCalls}
                      onChange={(e) =>
                        setState((st) => ({
                          ...st,
                          employees: st.employees.map((x) => (x.id === emp.id ? { ...x, canRunCalls: e.target.checked } : x)),
                        }))
                      }
                    />
                    Can run service calls
                  </label>
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={emp.payInFixedOverhead}
                      onChange={(e) =>
                        setState((st) => ({
                          ...st,
                          employees: st.employees.map((x) =>
                            x.id === emp.id ? { ...x, payInFixedOverhead: e.target.checked } : x,
                          ),
                        }))
                      }
                    />
                    Pay already included in the $47k fixed expenses (do not count as variable job labor)
                  </label>
                </div>
                <button
                  type="button"
                  className="mt-2 text-xs text-brand-red underline"
                  onClick={() => setState((st) => ({ ...st, employees: st.employees.filter((x) => x.id !== emp.id) }))}
                >
                  Remove employee
                </button>
              </details>
            </Card>
          );
        })}
      </div>

      <Card title="Brien + Nathan crew (when assigned together)">
        {(() => {
          const crew = crewScorecard(state, "brien", "nathan", range.from, range.to);
          return (
            <div className="grid gap-3 sm:grid-cols-5 text-sm">
              <Stat k="Crew jobs" v={num(crew.jobs)} />
              <Stat k="Crew revenue" v={money(crew.revenue)} />
              <Stat k="Crew GP" v={money(crew.grossProfit)} />
              <Stat k="Crew margin" v={pct(crew.grossMargin)} />
              <Stat k="Rev / crew hour" v={money(crew.revenuePerCrewHour)} />
            </div>
          );
        })()}
        <p className="mt-2 text-xs text-slate-500">
          Crew hour = Brien paid hours + Nathan paid hours on the same jobs. Do not assume an 8-hour day was spent on one job.
        </p>
      </Card>
    </div>
  );
}

function Stat({ k, v, good }: { k: string; v: string; good?: boolean | null }) {
  const color = good == null ? "text-navy" : good ? "text-profit" : "text-brand-red";
  return (
    <div>
      <p className="text-[11px] uppercase text-slate-500">{k}</p>
      <p className={`tabular font-semibold ${color}`}>{v}</p>
    </div>
  );
}
