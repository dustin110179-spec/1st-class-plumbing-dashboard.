"use client";

import { addDays } from "@/lib/calendar";
import { money, num } from "@/lib/format";
import { membershipMetrics, producingTechs } from "@/lib/finance";
import { uid } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Btn, Card, NumberField } from "../ui";

export function MembershipsView() {
  const { state, today, setState, patchSettings } = useStore();
  const m = membershipMetrics(state.memberships, state.settings, today);
  const techs = producingTechs(state.employees);
  const perTechWeekly = techs.length ? Math.ceil(m.weeklyNeeded / techs.length) : m.weeklyNeeded;

  return (
    <div className="space-y-4">
      <Card title="1st Class Protection Plan">
        <p className="text-sm text-slate-600">
          $120 annually or $10 monthly · 10% member discount · annual plumbing inspection · annual water heater flush.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Annual price" money value={state.settings.membershipAnnualPrice} onChange={(n) => patchSettings({ membershipAnnualPrice: n })} />
          <NumberField label="Monthly price" money value={state.settings.membershipMonthlyPrice} onChange={(n) => patchSettings({ membershipMonthlyPrice: n })} />
          <NumberField label="Member discount" percent value={state.settings.membershipDiscount} min={0} max={0.5} step={0.01} onChange={(n) => patchSettings({ membershipDiscount: n })} />
          <NumberField label="Growth goal (active members)" value={state.settings.membershipGrowthGoal} onChange={(n) => patchSettings({ membershipGrowthGoal: n })} />
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile k="Active members" v={num(m.active)} />
        <Tile k="New this month" v={num(m.newThisMonth)} />
        <Tile k="Cancellations this month" v={num(m.canceledThisMonth)} />
        <Tile k="Monthly recurring revenue" v={money(m.mrr, 2)} />
        <Tile k="Annual recurring revenue" v={money(m.arr, 2)} />
        <Tile k="Fulfillment costs on books" v={money(m.fulfillment)} />
        <Tile k="Net membership contribution (ARR − fulfillment)" v={money(m.contribution)} />
        <Tile k="Weekly sales needed vs goal" v={`${num(m.weeklyNeeded)} company / ${num(perTechWeekly)} per producing tech`} />
      </div>
      <Card
        title="Members"
        action={
          <Btn
            onClick={() =>
              setState((s) => ({
                ...s,
                memberships: [
                  ...s.memberships,
                  {
                    id: uid("mem"),
                    customer: "",
                    technicianId: techs[0]?.id ?? "dustin",
                    startDate: today,
                    renewalDate: addDays(today, 365),
                    billing: "annual",
                    amount: s.settings.membershipAnnualPrice,
                    status: "active",
                    canceledDate: "",
                    inspectionFulfilled: false,
                    flushFulfilled: false,
                    fulfillmentCost: 0,
                    isSample: false,
                  },
                ],
              }))
            }
          >
            Add member
          </Btn>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="p-2">Customer</th>
                <th>Sold by</th>
                <th>Billing</th>
                <th>Amount</th>
                <th>Start</th>
                <th>Renewal</th>
                <th>Inspection</th>
                <th>Flush</th>
                <th>Fulfillment $</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.memberships.map((mem) => (
                <tr key={mem.id} className="border-t border-slate-100">
                  <td className="p-2">
                    <input className="rounded border px-1 py-1" value={mem.customer} onChange={(e) => upd(mem.id, { customer: e.target.value })} />
                  </td>
                  <td>
                    <select
                      className="rounded border px-1 py-1"
                      value={mem.technicianId}
                      onChange={(e) => upd(mem.id, { technicianId: e.target.value })}
                    >
                      {state.employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="rounded border px-1 py-1"
                      value={mem.billing}
                      onChange={(e) =>
                        upd(mem.id, {
                          billing: e.target.value as "annual" | "monthly",
                          amount:
                            e.target.value === "annual"
                              ? state.settings.membershipAnnualPrice
                              : state.settings.membershipMonthlyPrice,
                        })
                      }
                    >
                      <option value="annual">Annual</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </td>
                  <td>
                    <input type="number" className="w-20 rounded border px-1 py-1" value={mem.amount} onChange={(e) => upd(mem.id, { amount: Number(e.target.value) })} />
                  </td>
                  <td>
                    <input type="date" className="rounded border px-1 py-1" value={mem.startDate} onChange={(e) => upd(mem.id, { startDate: e.target.value })} />
                  </td>
                  <td>
                    <input type="date" className="rounded border px-1 py-1" value={mem.renewalDate} onChange={(e) => upd(mem.id, { renewalDate: e.target.value })} />
                  </td>
                  <td>
                    <input type="checkbox" checked={mem.inspectionFulfilled} onChange={(e) => upd(mem.id, { inspectionFulfilled: e.target.checked })} />
                  </td>
                  <td>
                    <input type="checkbox" checked={mem.flushFulfilled} onChange={(e) => upd(mem.id, { flushFulfilled: e.target.checked })} />
                  </td>
                  <td>
                    <input type="number" className="w-20 rounded border px-1 py-1" value={mem.fulfillmentCost} onChange={(e) => upd(mem.id, { fulfillmentCost: Number(e.target.value) })} />
                  </td>
                  <td>
                    <select
                      className="rounded border px-1 py-1"
                      value={mem.status}
                      onChange={(e) =>
                        upd(mem.id, {
                          status: e.target.value as "active" | "canceled",
                          canceledDate: e.target.value === "canceled" ? today : "",
                        })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  function upd(id: string, patch: Partial<(typeof state.memberships)[number]>) {
    setState((s) => ({ ...s, memberships: s.memberships.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  }
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase text-navy-700">{k}</p>
      <p className="mt-1 text-xl font-semibold tabular text-navy">{v}</p>
    </div>
  );
}
