"use client";

import { formatLong } from "@/lib/calendar";
import { projectMonth } from "@/lib/finance";
import { useStore } from "@/lib/store";
import type { ViewId } from "@/lib/types";
import { useState } from "react";
import { Logo } from "./Logo";
import { SampleBanner } from "./ui";
import { BreakEvenView } from "./views/BreakEven";
import { CashFlowView } from "./views/CashFlow";
import { DailyEntryView } from "./views/DailyEntry";
import { DashboardView } from "./views/Dashboard";
import { ImportExportView } from "./views/ImportExport";
import { MarketingView } from "./views/Marketing";
import { MembershipsView } from "./views/Memberships";
import { PricingView } from "./views/Pricing";
import { ReportView } from "./views/Report";
import { ScheduleView } from "./views/Schedule";
import { SettingsView } from "./views/Settings";
import { SimulatorView } from "./views/Simulator";
import { TechniciansView } from "./views/Technicians";

const NAV: { id: ViewId; label: string }[] = [
  { id: "dashboard", label: "Command Center" },
  { id: "breakeven", label: "Break-Even" },
  { id: "simulator", label: "What-If Simulator" },
  { id: "technicians", label: "Technician Scorecards" },
  { id: "schedule", label: "Daily Call Planning" },
  { id: "pricing", label: "Job Pricing" },
  { id: "marketing", label: "Marketing" },
  { id: "memberships", label: "Protection Plan" },
  { id: "cashflow", label: "13-Week Cash" },
  { id: "daily", label: "Daily Entry" },
  { id: "import", label: "Import / Export" },
  { id: "report", label: "Monthly Report" },
  { id: "settings", label: "Settings" },
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
              Family owned since 2006 · Dallas, Texas
            </p>
            <h1 className="truncate text-lg font-semibold leading-tight md:text-2xl">
              1ST CLASS PLUMBING — BUSINESS COMMAND CENTER
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
              {p.callsNeededToGoal != null ? ` · ${p.callsNeededToGoal} incoming calls to $100k` : ""}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-4 p-3 md:p-4">
        <aside
          className={`${open ? "block" : "hidden"} no-print w-full shrink-0 md:block md:w-56`}
        >
          <nav className="sticky top-28 space-y-1 rounded-xl bg-white p-2 shadow-card">
            {NAV.map((item) => (
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
          </nav>
        </aside>
        <main className="min-w-0 flex-1 space-y-4">
          <SampleBanner on={state.sampleMode} />
          {view === "dashboard" && <DashboardView />}
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
