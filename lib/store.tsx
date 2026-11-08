"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { todayISO } from "./calendar";
import { createDefaultPlan, createDefaultState, DEFAULT_EMPLOYEES, DEFAULT_MARKETING, DEFAULT_SETTINGS } from "./defaults";
import { uid } from "./format";
import { buildSampleState } from "./sample";
import type { AppState, Employee, Job, Settings, ViewId } from "./types";

const KEY = "fcpl-command-center-v1";

function migrateEmployee(e: AppState["employees"][number]) {
  return {
    ...e,
    payInFixedOverhead:
      e.payInFixedOverhead ?? (e.role === "owner" || e.role === "office" || e.id === "dustin" || e.id === "noah" || e.id === "linda"),
    startDate: e.startDate ?? (e.id === "tech3" ? "2027-02-01" : e.id === "tech4" ? "2027-03-01" : null),
    endDate: e.endDate ?? null,
    producingEndDate: e.producingEndDate ?? (e.id === "dustin" ? "2027-03-01" : null),
    paidHoursPerDay: e.paidHoursPerDay ?? 8,
    productiveHoursPerDay: e.productiveHoursPerDay ?? (e.canRunCalls ? 5.5 : 0),
    overtimeHoursMonthly: e.overtimeHoursMonthly ?? 0,
    ptoDaysPerYear: e.ptoDaysPerYear ?? 10,
    trainingDaysPerYear: e.trainingDaysPerYear ?? 4,
    callbackRate: e.callbackRate ?? 0,
  };
}

function migrateState(parsed: AppState): AppState {
  const savedSettings = parsed.settings as Partial<Settings> | undefined;
  const settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
  if (savedSettings && savedSettings.targetNetMargin == null) {
    if (savedSettings.annualProfitGoal == null || savedSettings.annualProfitGoal === 100000) {
      settings.annualProfitGoal = DEFAULT_SETTINGS.annualProfitGoal;
    }
    settings.targetNetMargin = DEFAULT_SETTINGS.targetNetMargin;
    settings.growthReserveRate = DEFAULT_SETTINGS.growthReserveRate;
    settings.goalsApproved = false;
  }
  if (parsed.settings?.funnel) settings.funnel = parsed.settings.funnel;
  if (parsed.settings?.pricingKinds) settings.pricingKinds = parsed.settings.pricingKinds;
  if (parsed.settings?.workingWeekdays) settings.workingWeekdays = parsed.settings.workingWeekdays;
  if (parsed.settings?.holidays) settings.holidays = parsed.settings.holidays;
  const employees = (parsed.employees ?? []).map(migrateEmployee);
  for (const def of DEFAULT_EMPLOYEES) {
    if (!employees.some((e) => e.id === def.id)) employees.push(structuredClone(def));
  }
  const dustin = employees.find((e) => e.id === "dustin");
  if (dustin) {
    dustin.payInFixedOverhead = dustin.payInFixedOverhead || settings.overheadIncludesOwnerSalary;
    dustin.canRunCalls = true;
    dustin.role = "owner";
  }
  const noah = employees.find((e) => e.id === "noah");
  if (noah) {
    noah.payInFixedOverhead = true;
    noah.role = "office";
    noah.canRunCalls = false;
  }
  const linda = employees.find((e) => e.id === "linda");
  if (linda) {
    linda.payInFixedOverhead = true;
    linda.role = "office";
    linda.canRunCalls = false;
  }
  const marketing = (parsed.marketing ?? []).map((m) => ({
    ...m,
    completed: m.completed ?? 0,
    city: m.city ?? "both",
  }));
  for (const def of DEFAULT_MARKETING) {
    if (!marketing.some((m) => m.id === def.id)) marketing.push(structuredClone(def));
  }
  const jobs = (parsed.jobs ?? []).map((j) => ({
    ...j,
    city: j.city ?? "other",
    zip: j.zip ?? "",
  }));
  const cashWeeks = (parsed.cashWeeks ?? []).map((w) => ({
    ...w,
    ownerSalary: w.ownerSalary ?? 0,
    debtPrincipal: w.debtPrincipal ?? 0,
    taxes: w.taxes ?? 0,
    majorBills: w.majorBills ?? "",
  }));
  const scenarios = (parsed.scenarios ?? [undefined, undefined, undefined]).map((sc, i) => {
    const fallback = createDefaultState().scenarios[i];
    return {
      ...fallback,
      ...sc,
      id: sc?.id ?? fallback.id,
      lockedPreset: sc?.lockedPreset ?? true,
      hireApprentice: sc?.hireApprentice ?? (i !== 0),
      apprenticeWage: sc?.apprenticeWage ?? 18,
    };
  }) as AppState["scenarios"];
  const defaultPlan = createDefaultPlan();
  const staffingUpgrade = !parsed.plan?.secondHire;
  const plan = staffingUpgrade
    ? {
        ...defaultPlan,
        growthAllocated: parsed.plan?.growthAllocated?.length === 12 ? parsed.plan.growthAllocated : defaultPlan.growthAllocated,
      }
    : {
        ...defaultPlan,
        ...parsed.plan,
        draft: parsed.plan.draft ?? true,
        ownerOffTruckDate: parsed.plan.ownerOffTruckDate ?? "2027-03-01",
        hiring: { ...defaultPlan.hiring, ...parsed.plan.hiring },
        secondHire: { ...defaultPlan.secondHire, ...parsed.plan.secondHire },
        growthAllocated: parsed.plan.growthAllocated?.length === 12 ? parsed.plan.growthAllocated : defaultPlan.growthAllocated,
      };
  return {
    ...parsed,
    version: 1,
    settings,
    employees,
    jobs,
    marketing,
    cashWeeks,
    scenarios,
    customScenarios: parsed.customScenarios ?? [],
    plan,
    dailyChecklists: parsed.dailyChecklists ?? [],
    importHistory: parsed.importHistory ?? [],
    integrations: parsed.integrations ?? {
      quickbooks: { connected: false, lastSync: null },
      podium: { connected: false, lastSync: null },
    },
  };
}

function loadLocal(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== 1) return createDefaultState();
    return migrateState(parsed);
  } catch {
    return createDefaultState();
  }
}

type Store = {
  state: AppState;
  today: string;
  view: ViewId;
  setView: (v: ViewId) => void;
  hydrated: boolean;
  setState: (updater: AppState | ((s: AppState) => AppState)) => void;
  patchSettings: (patch: Partial<AppState["settings"]>) => void;
  resetDefaults: () => void;
  loadSample: () => void;
  clearSample: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(createDefaultState);
  const [today, setToday] = useState(() => todayISO());
  const [view, setView] = useState<ViewId>("today");
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const skipServer = useRef(true);

  const persist = useCallback((next: AppState) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
    if (skipServer.current) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      fetch("/api/state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {
        /* offline / local */
      });
    }, 800);
  }, []);

  const setState = useCallback(
    (updater: AppState | ((s: AppState) => AppState)) => {
      setStateRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        const stamped = { ...next, updatedAt: new Date().toISOString() };
        persist(stamped);
        return stamped;
      });
    },
    [persist],
  );

  useEffect(() => {
    const local = loadLocal();
    setStateRaw(local);
    setToday(todayISO());
    setHydrated(true);
    fetch("/api/state")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { payload?: AppState } | AppState;
      })
      .then((data) => {
        const payload = data && "payload" in (data as object) ? (data as { payload?: AppState }).payload : (data as AppState);
        if (payload && payload.version === 1 && payload.updatedAt > local.updatedAt) {
          const migrated = migrateState(payload);
          setStateRaw(migrated);
          try {
            localStorage.setItem(KEY, JSON.stringify(migrated));
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* local only */
      })
      .finally(() => {
        skipServer.current = false;
      });
  }, []);

  const value = useMemo<Store>(
    () => ({
      state,
      today,
      view,
      setView,
      hydrated,
      setState,
      patchSettings: (patch) =>
        setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      resetDefaults: () => {
        const next = createDefaultState();
        setState(next);
      },
      loadSample: () => setState(buildSampleState()),
      clearSample: () => setState(createDefaultState()),
    }),
    [hydrated, setState, state, today, view],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}

export function newEmployee(): Employee {
  return {
    id: uid("emp"),
    name: "New technician",
    role: "technician",
    canRunCalls: true,
    hourlyPay: 25,
    laborBurden: 1.4,
    weeklySalesThreshold: 0,
    commissionRate: 0,
    assignedToId: null,
    ownerCompMonthly: 0,
    payInFixedOverhead: false,
    active: true,
    skills: [{ name: "Service basics", level: 40 }],
    targetCallsPerDay: 3,
    targetAvgTicket: 1100,
    targetCloseRate: 0.8,
    startDate: null,
    endDate: null,
    producingEndDate: null,
    paidHoursPerDay: 8,
    productiveHoursPerDay: 5.5,
    overtimeHoursMonthly: 0,
    ptoDaysPerYear: 10,
    trainingDaysPerYear: 4,
    callbackRate: 0.04,
  };
}

export function newJob(date: string, technicianId: string): Job {
  return {
    id: uid("job"),
    date,
    customer: "",
    jobType: "Service call",
    category: "service",
    technicianId,
    helperIds: [],
    window: "8-10",
    estimatedRevenue: 1100,
    soldRevenue: 0,
    completedRevenue: 0,
    invoicedRevenue: 0,
    collectedRevenue: 0,
    status: "scheduled",
    sold: false,
    estimatedHours: 2,
    paidHoursTech: 0,
    paidHoursHelpers: {},
    materials: 0,
    subcontractors: 0,
    membershipSold: false,
    callback: false,
    callbackCost: 0,
    optionsPresented: "none",
    financingOffered: false,
    reviewScore: null,
    opportunityMissed: false,
    sourceId: "organic",
    isSample: false,
    externalId: "",
    notes: "",
    city: "other",
    zip: "",
  };
}
