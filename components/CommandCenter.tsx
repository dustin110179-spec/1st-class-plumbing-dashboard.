"use client";

import { formatLong } from "@/lib/calendar";
import { projectMonth } from "@/lib/finance";
import { useStore } from "@/lib/store";
import type { ViewId } from "@/lib/types";
import { useState } from "react";
import { Logo } from "./Logo";
import { SampleBanner } from "./ui";
import { ActionCenterView } from "./views/ActionCenter";
import { BreakEvenView } from "./views/BreakEven";
import { BudgetView } from "./views/Budget";
import { CashFlowView } from "./views/CashFlow";
import { DailyEntryView } from "./views/DailyEntry";
import { DashboardView } from "./views/Dashboard";
import { HiringView } from "./views/Hiring";
import { ImportExportView } from "./views/ImportExport";
import { LaborView } from "./views/Labor";
import { MarketView } from "./views/Market";
import { MarketingView } from "./views/Marketing";
import { MembershipsView } from "./views/Memberships";
import { PricingView } from "./views/Pricing";
import { ReportView } from "./views/Report";
import { ScheduleView } from "./views/Schedule";
import { SettingsView } from "./views/Settings";
import { SimulatorView } from "./views/Simulator";
import { TechniciansView } from "./views/Technicians";

const NAV: { heading: string; items: { id: ViewId; label: string }[] }[] = [
  {
    heading: "Today",
    items: [
      { id: "today", label: "Action Center" },
      { id: "dashboard", label: "Financial Dashboard" },
    ],
  },
  {
    heading: "2027 Plan",
    items: [
      { id: "budget", label: "Annual Budget" },
      { id: "hiring", label: "Hiring & Truck Exit" },
      { id: "labor", label: "Labor Forecast" },
      { id: "simulator", label: "What-If Scenarios" },
      { id: "market", label: "Richardson & Plano" },
    ],
  },
  {
    heading: "Operations",
    items: [
      { id: "breakeven", label: "Break-Even" },
      { id: "technicians", label: "Technician Scorecards" },
      { id: "schedule", label: "Daily Call Planning" },
      { id: "pricing", label: "Job Pricing" },
      { id: "marketing", label: "Marketing ROI" },
      { id: "memberships", label: "Protection Plan" },
      { id: "cashflow", label: "Cash & Owner Pay" },
      { id: "daily", label: "Daily Entry" },
      { id: "import", label: "Import / Export" },
      { id: "report", label: "Monthly Report" },
      { id: "settings", label: "Settings" },
    ],
  },
];

export function CommandCenter() {
  const { state, today, view, setView, hydrated } = useStore();
  const [open, setOpen] = useState(false);
  const p = projectMonth(state, today);
  const tone =
    p.status === "green" ? "bg-profit" : p.status === "yellow" ? "bg-brand-yellow" : "bg-brand-red";
  const text = p.status === "yellow" ? "text-navy" : "text-white";

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-navy">
        Loading command center…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-navy/10 bg-navy text-white">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3">
          <div className="rounded-lg bg-black px-2 py-1">
            <Logo className="h-14 w-auto max-w-[260px] shrink-0 object-contain md:h-16" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-yellow">
              Family owned since 2006 · Richardson & Plano, Texas
            </p>
            <h1 className="truncate text-lg font-semibold leading-tight md:text-2xl">
              1ST CLASS PLUMBING — 2027 BUDGET & PROFIT COMMAND CENTER
            </h1>
            <p className="font-serif italic text-brand-yellow">A Different Kind of Service.</p>
          </div>
          <button
            className="rounded-lg border border-white/20 px-3 py-2 text-sm md:hidden"
            onClick={() => setOpen((v) => !v)}
            type="button"
          >
            Menu
          </button>
        </div>
        <div className={`px-4 py-2 text-sm ${tone} ${text}`}>
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{p.statusLabel}</span>
            <span className="tabular">
              {formatLong(today)}
              {p.projectedBreakEvenDate && !p.notProjectedToBreakEven
                ? ` · Break-even ${p.projectedBreakEvenDate}`
                : ""}
              {p.callsNeededToGoal != null ? ` · ${p.callsNeededToGoal} incoming calls to monthly goal` : ""}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-4 p-3 md:p-4">
        <aside className={`${open ? "block" : "hidden"} no-print w-full shrink-0 md:block md:w-56`}>
          <nav className="sticky top-28 space-y-4 rounded-xl bg-white p-2 shadow-card">
            {NAV.map((group) => (
              <div key={group.heading}>
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {group.heading}
                </p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setView(item.id);
                      setOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                      view === item.id ? "bg-navy text-white" : "text-navy hover:bg-navy-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 space-y-4">
          <SampleBanner on={state.sampleMode} />
          {view === "today" && <ActionCenterView />}
          {view === "dashboard" && <DashboardView />}
          {view === "budget" && <BudgetView />}
          {view === "hiring" && <HiringView />}
          {view === "labor" && <LaborView />}
          {view === "market" && <MarketView />}
          {view === "breakeven" && <BreakEvenView />}
          {view === "simulator" && <SimulatorView />}
          {view === "technicians" && <TechniciansView />}
          {view === "schedule" && <ScheduleView />}
          {view === "pricing" && <PricingView />}
          {view === "marketing" && <MarketingView />}
          {view === "memberships" && <MembershipsView />}
          {view === "cashflow" && <CashFlowView />}
          {view === "daily" && <DailyEntryView />}
          {view === "import" && <ImportExportView />}
          {view === "report" && <ReportView />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
