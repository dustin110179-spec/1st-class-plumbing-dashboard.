"use client";

import { defaultHolidays } from "@/lib/calendar";
import { useStore } from "@/lib/store";
import { Btn, Card, DraftBanner, NumberField, TextField } from "../ui";

export function SettingsView() {
  const { state, patchSettings, resetDefaults, loadSample, clearSample, setState } = useStore();
  const s = state.settings;

  return (
    <div className="space-y-4">
      <DraftBanner />
      <Card
        title="Company and starting numbers"
        action={
          <div className="flex flex-wrap gap-2">
            <Btn tone="ghost" onClick={loadSample}>
              Load SAMPLE DATA
            </Btn>
            <Btn tone="ghost" onClick={clearSample}>
              Clear DEMO DATA / start clean
            </Btn>
            <Btn tone="red" onClick={resetDefaults}>
              Reset all defaults
            </Btn>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Primary model: contribution profit (revenue after variable costs) minus these fixed expenses. The $15,750 weekly figure is a historical all-in cash benchmark only — never add it to the $47,000.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="Company" value={s.companyName} onChange={(v) => patchSettings({ companyName: v })} />
          <TextField label="Tagline" value={s.tagline} onChange={(v) => patchSettings({ tagline: v })} />
          <NumberField label="Weekly cash benchmark (comparison only)" money value={s.weeklyBreakEven} onChange={(n) => patchSettings({ weeklyBreakEven: n })} />
          <NumberField label="Monthly fixed expenses" money value={s.monthlyFixedOverhead} onChange={(n) => patchSettings({ monthlyFixedOverhead: n })} />
          <NumberField label="Monthly operating days (target)" value={s.monthlyOperatingDays} onChange={(n) => patchSettings({ monthlyOperatingDays: n })} />
          <NumberField label="Annual revenue goal" money value={s.annualRevenueGoal} onChange={(n) => patchSettings({ annualRevenueGoal: n })} />
          <NumberField label="Weekly revenue goal" money value={s.weeklyRevenueGoal} onChange={(n) => patchSettings({ weeklyRevenueGoal: n })} />
          <NumberField label="Monthly revenue goal" money value={s.monthlyRevenueGoal} onChange={(n) => patchSettings({ monthlyRevenueGoal: n })} />
          <NumberField label="Annual profit goal" money value={s.annualProfitGoal} onChange={(n) => patchSettings({ annualProfitGoal: n })} />
          <NumberField label="Target net profit margin" percent value={s.targetNetMargin} min={0.05} max={0.5} step={0.01} onChange={(n) => patchSettings({ targetNetMargin: n, annualProfitGoal: s.annualRevenueGoal * n })} />
          <NumberField label="Growth reserve rate (of revenue)" percent value={s.growthReserveRate} min={0} max={0.25} step={0.01} onChange={(n) => patchSettings({ growthReserveRate: n })} />
          <NumberField label="Target GM low" percent value={s.targetGrossMarginLow} min={0.2} max={0.9} step={0.01} onChange={(n) => patchSettings({ targetGrossMarginLow: n })} />
          <NumberField label="Target GM high" percent value={s.targetGrossMarginHigh} min={0.2} max={0.9} step={0.01} onChange={(n) => patchSettings({ targetGrossMarginHigh: n })} />
          <NumberField label="Average service ticket" money value={s.averageTicket} onChange={(n) => patchSettings({ averageTicket: n })} />
          <NumberField label="Service call close rate" percent value={s.closeRate} min={0} max={1} step={0.01} onChange={(n) => patchSettings({ closeRate: n })} />
          <NumberField label="Target calls / tech / day (low)" value={s.targetCallsPerTechDayLow} step={0.5} onChange={(n) => patchSettings({ targetCallsPerTechDayLow: n })} />
          <NumberField label="Target calls / tech / day (high)" value={s.targetCallsPerTechDayHigh} step={0.5} onChange={(n) => patchSettings({ targetCallsPerTechDayHigh: n })} />
          <NumberField label="Incoming calls / day (forecast)" value={s.incomingCallsPerDay} onChange={(n) => patchSettings({ incomingCallsPerDay: n })} />
          <NumberField label="Processing fee" percent value={s.processingFeeRate} min={0} max={0.2} step={0.001} onChange={(n) => patchSettings({ processingFeeRate: n })} />
          <NumberField label="Labor % warning threshold" percent value={s.laborPercentWarning} min={0.1} max={0.6} step={0.01} onChange={(n) => patchSettings({ laborPercentWarning: n })} />
          <NumberField label="Assumed materials % (forecast P&L)" percent value={s.assumedMaterialsPct} min={0} max={0.5} step={0.01} onChange={(n) => patchSettings({ assumedMaterialsPct: n })} />
          <NumberField label="Assumed sub % (forecast P&L)" percent value={s.assumedSubPct} min={0} max={0.5} step={0.01} onChange={(n) => patchSettings({ assumedSubPct: n })} />
          <NumberField label="Assumed paid hours / sold job (lead)" value={s.assumedPaidHoursPerSoldJob} step={0.25} onChange={(n) => patchSettings({ assumedPaidHoursPerSoldJob: n })} />
          <NumberField label="Assumed helper hours / sold job" value={s.assumedHelperHoursPerSoldJob} step={0.25} onChange={(n) => patchSettings({ assumedHelperHoursPerSoldJob: n })} />
          <NumberField label="Assumed commission % of revenue" percent value={s.assumedCommissionPct} min={0} max={0.2} step={0.005} onChange={(n) => patchSettings({ assumedCommissionPct: n })} />
          <NumberField label="Other variable % of revenue" percent value={s.assumedOtherVariablePct} min={0} max={0.2} step={0.005} onChange={(n) => patchSettings({ assumedOtherVariablePct: n })} />
          <NumberField label="Marketing budget / month" money value={s.marketingBudgetMonthly} onChange={(n) => patchSettings({ marketingBudgetMonthly: n })} />
          <NumberField label="Software / month" money value={s.softwareMonthly} onChange={(n) => patchSettings({ softwareMonthly: n })} />
          <NumberField label="Loan payment / month" money value={s.loanMonthly} onChange={(n) => patchSettings({ loanMonthly: n })} />
          <NumberField label="Cash reserve target" money value={s.cashReserveTarget} onChange={(n) => patchSettings({ cashReserveTarget: n })} />
          <NumberField label="Booking rate (lead → booked)" percent value={s.bookingRate} min={0} max={1} step={0.01} onChange={(n) => patchSettings({ bookingRate: n })} />
          <NumberField label="Owner salary / month" money value={s.ownerMonthlySalary} onChange={(n) => patchSettings({ ownerMonthlySalary: n })} />
          <NumberField label="Planned owner distributions / month" money value={s.plannedMonthlyDistribution} onChange={(n) => patchSettings({ plannedMonthlyDistribution: n })} />
          <NumberField label="Planning year" value={s.planningYear} onChange={(n) => patchSettings({ planningYear: n })} />
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={s.goalsApproved} onChange={(e) => patchSettings({ goalsApproved: e.target.checked })} />
          <span>
            Approve these as the final 2027 goals. Until checked, the 25% net margin and 10% growth reserve stay in draft. Approving goals does not lock the operating budget.
          </span>
        </label>
      </Card>

      <Card title="What is already inside the $47,000 — never count twice">
        <p className="mb-3 text-sm text-slate-600">
          Checked items are already included in monthly fixed expenses. Uncheck only if that cost sits outside the $47,000 and should be added. Dustin’s owner salary and Noah’s salary are included by default, so their job hours are not treated as extra variable labor.
        </p>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.overheadIncludesOwnerSalary} onChange={(e) => patchSettings({ overheadIncludesOwnerSalary: e.target.checked })} />
            Owner salary (Dustin) is included in fixed expenses
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.overheadIncludesNoahSalary} onChange={(e) => patchSettings({ overheadIncludesNoahSalary: e.target.checked })} />
            Noah’s salary is included in fixed expenses
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.overheadIncludesMarketing} onChange={(e) => patchSettings({ overheadIncludesMarketing: e.target.checked })} />
            Marketing is included in the $47,000 (do not subtract it again)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.overheadIncludesSoftware} onChange={(e) => patchSettings({ overheadIncludesSoftware: e.target.checked })} />
            Software is included in the $47,000
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.overheadIncludesLoans} onChange={(e) => patchSettings({ overheadIncludesLoans: e.target.checked })} />
            Loan payments are included in the $47,000
          </label>
        </div>
      </Card>

      <Card title="Working days and holidays (America/Chicago)">
        <p className="mb-2 text-sm text-slate-600">Uncheck days the shop is closed. Holidays are YYYY-MM-DD, one per line.</p>
        <div className="flex flex-wrap gap-3 text-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, dow) => (
            <label key={label} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={s.workingWeekdays.includes(dow)}
                onChange={(e) => {
                  const set = new Set(s.workingWeekdays);
                  if (e.target.checked) set.add(dow);
                  else set.delete(dow);
                  patchSettings({ workingWeekdays: [...set].sort() });
                }}
              />
              {label}
            </label>
          ))}
        </div>
        <textarea
          className="mt-3 w-full rounded-lg border border-slate-200 p-2 text-sm"
          rows={6}
          value={s.holidays.join("\n")}
          onChange={(e) =>
            patchSettings({
              holidays: e.target.value
                .split("\n")
                .map((x) => x.trim())
                .filter(Boolean),
            })
          }
        />
        <button
          type="button"
          className="mt-2 text-sm text-navy underline"
          onClick={() => patchSettings({ holidays: defaultHolidays(new Date().getFullYear()) })}
        >
          Restore standard U.S. holidays including Thanksgiving Friday
        </button>
      </Card>

      <Card title="Integrations — not connected">
        <p className="text-sm text-slate-600">
          QuickBooks for accounting actuals and Podium for jobs are prepared as import sources. They are <strong>not live</strong>. Use CSV / Excel on the Import page until a connection is built and tested.
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
          <li>QuickBooks: {state.integrations.quickbooks.connected ? "Connected" : "Not connected"}{state.integrations.quickbooks.lastSync ? ` · last sync ${state.integrations.quickbooks.lastSync}` : ""}</li>
          <li>Podium: {state.integrations.podium.connected ? "Connected" : "Not connected"}{state.integrations.podium.lastSync ? ` · last sync ${state.integrations.podium.lastSync}` : ""}</li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">Last saved {state.updatedAt}</p>
      </Card>

      <Card title="12-month actuals (optional, for trends)">
        <p className="mb-2 text-sm text-slate-600">Enter closed months when you have them. Do not enter sample figures here unless you loaded SAMPLE DATA.</p>
        <Btn
          tone="ghost"
          onClick={() =>
            setState((st) => ({
              ...st,
              monthlyActuals: [
                ...st.monthlyActuals,
                { month: st.updatedAt.slice(0, 7), revenue: 0, grossProfit: 0, operatingProfit: 0, isSample: false },
              ],
            }))
          }
        >
          Add month
        </Btn>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th>Month</th>
                <th>Revenue</th>
                <th>Gross profit</th>
                <th>Operating profit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.monthlyActuals.map((m, i) => (
                <tr key={`${m.month}-${i}`} className="border-t">
                  <td>
                    <input
                      className="rounded border px-1 py-1"
                      value={m.month}
                      onChange={(e) =>
                        setState((st) => ({
                          ...st,
                          monthlyActuals: st.monthlyActuals.map((x, j) => (j === i ? { ...x, month: e.target.value } : x)),
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="w-28 rounded border px-1 py-1"
                      value={m.revenue}
                      onChange={(e) =>
                        setState((st) => ({
                          ...st,
                          monthlyActuals: st.monthlyActuals.map((x, j) => (j === i ? { ...x, revenue: Number(e.target.value) } : x)),
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="w-28 rounded border px-1 py-1"
                      value={m.grossProfit}
                      onChange={(e) =>
                        setState((st) => ({
                          ...st,
                          monthlyActuals: st.monthlyActuals.map((x, j) => (j === i ? { ...x, grossProfit: Number(e.target.value) } : x)),
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="w-28 rounded border px-1 py-1"
                      value={m.operatingProfit}
                      onChange={(e) =>
                        setState((st) => ({
                          ...st,
                          monthlyActuals: st.monthlyActuals.map((x, j) =>
                            j === i ? { ...x, operatingProfit: Number(e.target.value) } : x,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td>
                    {m.isSample ? <span className="text-xs text-slate-400">SAMPLE</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
