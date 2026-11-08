"use client";

import { money, num, pct } from "@/lib/format";
import { CENSUS_HOUSEHOLDS, CENSUS_HOUSING_DETAIL, ZIP_FACTS } from "@/lib/marketData";
import {
  cityDemand,
  driveTimeEffect,
  geographicMix,
  penetrationScenario,
  serviceableHouseholds,
} from "@/lib/plan";
import { useStore } from "@/lib/store";
import type { MarketAssumptions } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, NumberField, PlanningBanner, SelectField } from "../ui";

const RATES = [0.005, 0.01, 0.02, 0.03, 0.05];

export function MarketView() {
  const { state, setState } = useStore();
  const m = state.plan.market;
  const jobsPerDay = (state.settings.targetCallsPerTechDayLow + state.settings.targetCallsPerTechDayHigh) / 2;
  const days = state.settings.monthlyOperatingDays * 12;
  const richardson = cityDemand("richardson", m);
  const plano = cityDemand("plano", m);
  const geo = geographicMix(state.jobs);
  const drive = driveTimeEffect(m, jobsPerDay);

  function patch(p: Partial<MarketAssumptions>) {
    setState((s) => ({ ...s, plan: { ...s.plan, market: { ...s.plan.market, ...p } } }));
  }

  const compare = [
    { city: "Richardson", households: richardson.households, owner: richardson.owner, serviceable: richardson.serviceable, demand: richardson.revenue },
    { city: "Plano", households: plano.households, owner: plano.owner, serviceable: plano.serviceable, demand: plano.revenue },
  ];

  return (
    <div className="space-y-4">
      <PlanningBanner />
      <Card title="Richardson and Plano market opportunity">
        <p className="text-sm text-slate-600">
          Household counts are verified ACS occupied-housing figures. Demand, tickets, and penetration are planning inputs — they are not measured plumbing-industry market share. Household penetration (customers or jobs as a share of households) is not the same as share of all plumbing work sold in those cities.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <CityCard
          name="Richardson"
          households={richardson.households}
          householdSource={CENSUS_HOUSEHOLDS.richardson}
          owner={richardson.owner}
          ownerNote={`Owner-occupied estimated as ${pct(m.richardsonOwnerShare)} (ACS 2019–2023 tenure) applied to the 2020–2024 household count. Published 2019–2023 owner-occupied count is ${num(CENSUS_HOUSING_DETAIL.richardson.ownerOccupied)}.`}
          yearBuilt={m.richardsonMedianYearBuilt}
          detached={m.richardsonDetachedShare}
          serviceable={richardson.serviceable}
          jobs={richardson.jobs}
          revenue={richardson.revenue}
          customers={richardson.customers}
          penetration={richardson.penetration}
          income={CENSUS_HOUSING_DETAIL.richardson.medianHouseholdIncome}
          homeValue={CENSUS_HOUSING_DETAIL.richardson.medianHomeValue}
        />
        <CityCard
          name="Plano"
          households={plano.households}
          householdSource={CENSUS_HOUSEHOLDS.plano}
          owner={plano.owner}
          ownerNote={`Owner-occupied estimated as ${pct(m.planoOwnerShare)} (ACS 2019–2023 tenure) applied to the 2020–2024 household count. Published 2019–2023 owner-occupied count is ${num(CENSUS_HOUSING_DETAIL.plano.ownerOccupied)}.`}
          yearBuilt={m.planoMedianYearBuilt}
          detached={m.planoDetachedShare}
          serviceable={plano.serviceable}
          jobs={plano.jobs}
          revenue={plano.revenue}
          customers={plano.customers}
          penetration={plano.penetration}
          income={CENSUS_HOUSING_DETAIL.plano.medianHouseholdIncome}
          homeValue={CENSUS_HOUSING_DETAIL.plano.medianHomeValue}
        />
      </div>

      <Card title="Where to concentrate marketing">
        <p className="mb-3 text-sm text-slate-600">
          Plano has more owner-occupied homes and a larger household base. Richardson housing is older (median year built {m.richardsonMedianYearBuilt} vs {m.planoMedianYearBuilt}), which often means more drain, water-heater, and re-pipe work per home. Neither city is “proven demand” until you enter actual jobs by city.
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compare}>
              <CartesianGrid stroke="#E8EEF4" />
              <XAxis dataKey="city" />
              <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
              <Tooltip />
              <Legend />
              <Bar dataKey="households" name="Households (ACS 2020–2024)" fill="#0A2540" />
              <Bar dataKey="owner" name="Est. owner-occupied" fill="#1A4A73" />
              <Bar dataKey="serviceable" name="Serviceable (planning definition)" fill="#C9A227" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Planning demand uses {m.jobsPerServiceableHhYear} jobs per serviceable household per year × {money(m.averageTicket)} — an assumption you can edit, not a Census fact.
        </p>
      </Card>

      <Card title="Household penetration scenarios (not industry market share)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">City</th>
                <th>Penetration</th>
                <th>Households touched</th>
                <th>Est. jobs / year</th>
                <th>Est. revenue / year</th>
                <th>Tech capacity (annual)</th>
              </tr>
            </thead>
            <tbody>
              {(["richardson", "plano"] as const).flatMap((city) =>
                RATES.map((rate) => {
                  const row = penetrationScenario(city, m, rate, jobsPerDay, days);
                  return (
                    <tr key={`${city}-${rate}`} className="border-t border-slate-100">
                      <td className="py-2 capitalize">{city}</td>
                      <td>{pct(rate, 1)}</td>
                      <td className="tabular">{num(row.householdsTouched)}</td>
                      <td className="tabular">{num(row.jobs)}</td>
                      <td className="tabular">{money(row.revenue)}</td>
                      <td className="tabular">{row.techs == null ? "—" : `${num(row.techs, 1)} techs`}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="ZIP-code snapshot where we have ACS figures">
        <p className="mb-3 text-sm text-slate-600">
          ZCTA figures are not identical to municipal limits. Occupied-household counts marked “derived” use units × (1 − vacancy) and are estimates.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">ZIP</th>
                <th>Area</th>
                <th>Households</th>
                <th>Owner-occupied</th>
                <th>Median year built</th>
                <th>Median income</th>
                <th>Median home value</th>
              </tr>
            </thead>
            <tbody>
              {ZIP_FACTS.map((z) => (
                <tr key={z.zip} className="border-t border-slate-100 align-top">
                  <td className="py-2 font-medium">{z.zip}</td>
                  <td>
                    {z.label}
                    <div className="text-[11px] text-slate-500">{z.source}</div>
                  </td>
                  <td className="tabular">
                    {z.households == null ? "Not confirmed" : num(z.households)}
                    <div className="text-[11px] text-slate-500">{z.householdsNote}</div>
                  </td>
                  <td className="tabular">{pct(z.ownerShare, 0)}</td>
                  <td className="tabular">{z.medianYearBuilt ?? "—"}</td>
                  <td className="tabular">{money(z.medianIncome)}</td>
                  <td className="tabular">{money(z.medianHomeValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Geographic revenue tracker">
        <p className="mb-2 text-sm text-slate-600">
          Uses jobs on file with a city tag. Empty books show 0% — this is not a market-share claim.
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          <Mini label="Richardson revenue" value={money(geo.richardson.revenue)} />
          <Mini label="Plano revenue" value={money(geo.plano.revenue)} />
          <Mini label="Other DFW revenue" value={money(geo.other.revenue)} />
          <Mini label="Richardson + Plano share" value={pct(geo.focusShare)} />
        </div>
      </Card>

      <Card title="Drive-time productivity (editable, starts at zero)">
        <p className="mb-3 text-sm text-slate-600">{drive.note}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Minutes saved per job if staying in Richardson/Plano" value={m.driveMinutesSavedPerJob} onChange={(n) => patch({ driveMinutesSavedPerJob: n })} />
          <NumberField label="Minutes per completed job (planning)" value={m.minutesPerCompletedJob} onChange={(n) => patch({ minutesPerCompletedJob: n })} />
          <Mini label="Extra jobs / tech / day" value={num(drive.extraJobsPerTechDay, 2)} />
        </div>
      </Card>

      <Card title="Planning assumptions you can edit">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Richardson households" value={m.richardsonHouseholds} onChange={(n) => patch({ richardsonHouseholds: n })} />
          <NumberField label="Plano households" value={m.planoHouseholds} onChange={(n) => patch({ planoHouseholds: n })} />
          <NumberField label="Richardson owner-occupied (estimate)" value={m.richardsonOwnerOccupied} onChange={(n) => patch({ richardsonOwnerOccupied: n })} />
          <NumberField label="Plano owner-occupied (estimate)" value={m.planoOwnerOccupied} onChange={(n) => patch({ planoOwnerOccupied: n })} />
          <NumberField label="Jobs per serviceable household / year" value={m.jobsPerServiceableHhYear} step={0.05} onChange={(n) => patch({ jobsPerServiceableHhYear: n })} />
          <NumberField label="Average ticket used in this model" money value={m.averageTicket} onChange={(n) => patch({ averageTicket: n })} />
          <NumberField label="Known Richardson customers" value={m.existingCustomersRichardson} onChange={(n) => patch({ existingCustomersRichardson: n })} />
          <NumberField label="Known Plano customers" value={m.existingCustomersPlano} onChange={(n) => patch({ existingCustomersPlano: n })} />
          <SelectField
            label="Serviceable definition"
            value={m.serviceableMode}
            onChange={(v) => patch({ serviceableMode: v })}
            options={[
              { value: "owner_occupied", label: "Owner-occupied homes" },
              { value: "owner_detached", label: "Owner-occupied × detached share" },
              { value: "all_households", label: "All households" },
            ]}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Competition: Richardson and Plano are served by national brands and local independents. This page does not invent competitor counts or market-share percentages. Serviceable households currently {num(serviceableHouseholds("richardson", m) + serviceableHouseholds("plano", m))}.
        </p>
      </Card>
    </div>
  );
}

function CityCard(props: {
  name: string;
  households: number;
  householdSource: { source: string; year: string };
  owner: number;
  ownerNote: string;
  yearBuilt: number;
  detached: number;
  serviceable: number;
  jobs: number;
  revenue: number;
  customers: number;
  penetration: number;
  income: number;
  homeValue: number;
}) {
  return (
    <Card title={props.name}>
      <dl className="space-y-2 text-sm">
        <KV k="Households" v={num(props.households)} note={`${props.householdSource.source} (${props.householdSource.year})`} />
        <KV k="Owner-occupied (estimate)" v={num(props.owner)} note={props.ownerNote} />
        <KV k="Median year built" v={String(props.yearBuilt)} note={props.name === "Richardson" ? CENSUS_HOUSING_DETAIL.richardson.source : CENSUS_HOUSING_DETAIL.plano.source} />
        <KV k="1-unit detached share" v={pct(props.detached, 1)} />
        <KV k="Serviceable households (planning)" v={num(props.serviceable)} />
        <KV k="Planning annual jobs" v={num(props.jobs)} note="jobs per serviceable household × serviceable count — not observed demand" />
        <KV k="Planning annual revenue" v={money(props.revenue)} />
        <KV k="Existing customers entered" v={num(props.customers)} />
        <KV k="Existing household penetration" v={props.customers > 0 ? pct(props.penetration, 2) : "Not entered"} />
        <KV k="Median household income" v={money(props.income)} />
        <KV k="Median home value" v={money(props.homeValue)} />
      </dl>
    </Card>
  );
}

function KV({ k, v, note }: { k: string; v: string; note?: string }) {
  return (
    <div>
      <div className="flex justify-between gap-3">
        <dt className="text-slate-600">{k}</dt>
        <dd className="tabular font-medium text-navy">{v}</dd>
      </div>
      {note ? <p className="text-[11px] text-slate-500">{note}</p> : null}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-semibold tabular text-navy">{value}</p>
    </div>
  );
}
