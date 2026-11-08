"use client";

import { money, pct } from "@/lib/format";
import { marginFromMarkup, markupFromMargin, minListPrice, priceFromCostAndMargin, priceFromCostAndMarkup } from "@/lib/finance";
import { useStore } from "@/lib/store";
import type { PricingJobKind } from "@/lib/types";
import { useMemo, useState } from "react";
import { Card, NumberField, SelectField } from "../ui";

export function PricingView() {
  const { state, patchSettings } = useStore();
  const s = state.settings;
  const [kind, setKind] = useState<PricingJobKind>("service_under_4");
  const cfg = s.pricingKinds.find((k) => k.kind === kind) ?? s.pricingKinds[0];
  const [hours, setHours] = useState(2);
  const [materialCost, setMaterialCost] = useState(180);
  const [subCost, setSubCost] = useState(0);
  const [member, setMember] = useState(false);
  const [techWage, setTechWage] = useState(30);
  const [helperWage, setHelperWage] = useState(18);
  const [helperHours, setHelperHours] = useState(0);
  const [target, setTarget] = useState(cfg.targetMargin);

  const labor = hours * techWage * cfg.laborBurden + helperHours * helperWage * cfg.laborBurden;
  const materialsCustomer = priceFromCostAndMarkup(materialCost, cfg.materialsMarkup);
  const jobCosts = labor + materialCost + subCost;
  const list = minListPrice({
    jobCosts,
    targetMargin: target,
    processingRate: s.processingFeeRate,
    discount: member ? s.membershipDiscount : 0,
  });
  const net = list != null ? list * (1 - (member ? s.membershipDiscount : 0)) : null;
  const processing = net != null ? net * s.processingFeeRate : null;
  const gp = net != null && processing != null ? net - jobCosts - processing : null;
  const gm = net && gp != null && net > 0 ? gp / net : null;
  const naiveMarkupPrice = priceFromCostAndMarkup(jobCosts, target);
  const marginPrice = priceFromCostAndMargin(jobCosts, target);

  const sewer = useSewer();

  return (
    <div className="space-y-4">
      <Card title="Margin-based job pricing">
        <p className="text-sm text-slate-600">
          Markup is not margin. A 65% gross margin requires selling at cost ÷ 0.35, not cost × 1.65. Processing ({pct(s.processingFeeRate)}) and the 10% member discount are solved into the list price so the collected amount still hits the target.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Job profitability calculator">
          <SelectField
            label="Job type"
            value={kind}
            onChange={(v) => {
              setKind(v);
              const next = s.pricingKinds.find((k) => k.kind === v);
              if (next) setTarget(next.targetMargin);
            }}
            options={s.pricingKinds.map((k) => ({ value: k.kind, label: k.label }))}
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField label="Tech hours (paid)" value={hours} step={0.25} onChange={setHours} />
            <NumberField label="Helper hours (paid)" value={helperHours} step={0.25} onChange={setHelperHours} />
            <NumberField label="Tech wage" money value={techWage} onChange={setTechWage} />
            <NumberField label="Helper wage" money value={helperWage} onChange={setHelperWage} />
            <NumberField label="Material cost" money value={materialCost} onChange={setMaterialCost} />
            <NumberField label="Subcontractor cost" money value={subCost} onChange={setSubCost} />
            <NumberField label="Target gross margin" percent value={target} min={0.05} max={0.9} step={0.01} onChange={setTarget} />
            <NumberField
              label="Materials markup (config)"
              percent
              value={cfg.materialsMarkup}
              onChange={(n) =>
                patchSettings({
                  pricingKinds: s.pricingKinds.map((k) => (k.kind === kind ? { ...k, materialsMarkup: n } : k)),
                })
              }
              min={0}
              max={2}
              step={0.01}
            />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={member} onChange={(e) => setMember(e.target.checked)} />
            1st Class Protection Plan member (10% discount)
          </label>
          <dl className="mt-4 space-y-1 text-sm">
            <Row k="Loaded labor" v={money(labor, 2)} />
            <Row k="Job costs (labor + materials + subs)" v={money(jobCosts, 2)} />
            <Row k="If you marked materials up instead of costing them" v={money(materialsCustomer, 2)} />
            <Row k="Wrong: price from markup at target %" v={money(naiveMarkupPrice, 2)} />
            <Row k="Price from margin before fees/discount" v={money(marginPrice, 2)} />
            <Row k="Minimum list price to hit target GM" v={money(list, 2)} />
            <Row k="Collected after discount" v={money(net, 2)} />
            <Row k="Processing fee" v={money(processing, 2)} />
            <Row k="Gross profit $" v={money(gp, 2)} />
            <Row k="Gross margin on collected" v={pct(gm)} />
            <Row k="Equivalent markup on cost" v={pct(markupFromMargin(target))} />
            <Row k="Margin if you used that markup" v={pct(marginFromMarkup(target))} />
          </dl>
        </Card>

        <Card title="Large project — sewer / tunneling">
          <p className="mb-3 text-sm text-slate-600">
            Separate calculator for excavation, sewer replacement, and tunneling. Enter direct costs; the list price is solved for the selected margin after processing and optional member discount.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Crew days" value={sewer.days} step={0.5} onChange={sewer.setDays} />
            <NumberField label="People on crew" value={sewer.people} onChange={sewer.setPeople} />
            <NumberField label="Hours per person-day" value={sewer.hoursDay} step={0.5} onChange={sewer.setHoursDay} />
            <NumberField label="Average loaded wage" money value={sewer.wage} onChange={sewer.setWage} />
            <NumberField label="Pipe / materials" money value={sewer.materials} onChange={sewer.setMaterials} />
            <NumberField label="Equipment / dump" money value={sewer.equip} onChange={sewer.setEquip} />
            <NumberField label="Subcontractors (boring, concrete, locates)" money value={sewer.subs} onChange={sewer.setSubs} />
            <NumberField label="Target margin" percent value={sewer.margin} min={0.2} max={0.7} step={0.01} onChange={sewer.setMargin} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sewer.member} onChange={(e) => sewer.setMember(e.target.checked)} /> Member job
          </label>
          <dl className="mt-4 space-y-1 text-sm">
            <Row k="Loaded labor" v={money(sewer.labor, 2)} />
            <Row k="Total direct cost" v={money(sewer.cost, 2)} />
            <Row k="Minimum list price" v={money(sewer.list, 2)} />
            <Row k="Collected" v={money(sewer.net, 2)} />
            <Row k="Gross profit" v={money(sewer.gp, 2)} />
          </dl>
        </Card>
      </div>

      <Card title="Configure labor rates by job kind">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">Kind</th>
                <th>Billable labor rate</th>
                <th>Materials markup</th>
                <th>Burden</th>
                <th>Target margin</th>
              </tr>
            </thead>
            <tbody>
              {s.pricingKinds.map((k) => (
                <tr key={k.kind} className="border-t border-slate-100">
                  <td className="py-2">{k.label}</td>
                  <td>
                    <input
                      type="number"
                      className="w-24 rounded border px-2 py-1"
                      value={k.laborRate}
                      onChange={(e) =>
                        patchSettings({
                          pricingKinds: s.pricingKinds.map((x) =>
                            x.kind === k.kind ? { ...x, laborRate: Number(e.target.value) } : x,
                          ),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="w-24 rounded border px-2 py-1"
                      value={k.materialsMarkup}
                      step={0.01}
                      onChange={(e) =>
                        patchSettings({
                          pricingKinds: s.pricingKinds.map((x) =>
                            x.kind === k.kind ? { ...x, materialsMarkup: Number(e.target.value) } : x,
                          ),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="w-24 rounded border px-2 py-1"
                      value={k.laborBurden}
                      step={0.05}
                      onChange={(e) =>
                        patchSettings({
                          pricingKinds: s.pricingKinds.map((x) =>
                            x.kind === k.kind ? { ...x, laborBurden: Number(e.target.value) } : x,
                          ),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="w-24 rounded border px-2 py-1"
                      value={k.targetMargin}
                      step={0.01}
                      onChange={(e) =>
                        patchSettings({
                          pricingKinds: s.pricingKinds.map((x) =>
                            x.kind === k.kind ? { ...x, targetMargin: Number(e.target.value) } : x,
                          ),
                        })
                      }
                    />
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

function useSewer() {
  const { state } = useStore();
  const [days, setDays] = useState(3);
  const [people, setPeople] = useState(3);
  const [hoursDay, setHoursDay] = useState(8);
  const [wage, setWage] = useState(42);
  const [materials, setMaterials] = useState(4200);
  const [equip, setEquip] = useState(1800);
  const [subs, setSubs] = useState(3500);
  const [margin, setMargin] = useState(0.5);
  const [member, setMember] = useState(false);
  const labor = days * people * hoursDay * wage;
  const cost = labor + materials + equip + subs;
  const list = minListPrice({
    jobCosts: cost,
    targetMargin: margin,
    processingRate: state.settings.processingFeeRate,
    discount: member ? state.settings.membershipDiscount : 0,
  });
  const net = list != null ? list * (1 - (member ? state.settings.membershipDiscount : 0)) : null;
  const processing = net != null ? net * state.settings.processingFeeRate : 0;
  const gp = net != null ? net - cost - processing : null;
  return useMemo(
    () => ({
      days, setDays, people, setPeople, hoursDay, setHoursDay, wage, setWage, materials, setMaterials, equip, setEquip, subs, setSubs, margin, setMargin, member, setMember, labor, cost, list, net, gp,
    }),
    [days, people, hoursDay, wage, materials, equip, subs, margin, member, labor, cost, list, net, gp],
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-600">{k}</dt>
      <dd className="tabular font-medium">{v}</dd>
    </div>
  );
}
