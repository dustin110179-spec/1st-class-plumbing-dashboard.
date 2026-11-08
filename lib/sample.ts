import { addDays, monthStart, todayISO, weekStartMonday } from "./calendar";
import { createDefaultState } from "./defaults";
import { uid } from "./format";
import type { AppState, CashWeek, Job } from "./types";

function job(partial: Partial<Job> & Pick<Job, "date" | "customer" | "technicianId">): Job {
  return {
    id: uid("job"),
    jobType: "Service",
    category: "service",
    helperIds: [],
    window: "8-10",
    estimatedRevenue: 1100,
    soldRevenue: 0,
    completedRevenue: 0,
    invoicedRevenue: 0,
    collectedRevenue: 0,
    status: "completed",
    sold: true,
    estimatedHours: 2,
    paidHoursTech: 2.5,
    paidHoursHelpers: {},
    materials: 120,
    subcontractors: 0,
    membershipSold: false,
    callback: false,
    callbackCost: 0,
    optionsPresented: "all",
    financingOffered: false,
    reviewScore: 5,
    opportunityMissed: false,
    sourceId: "organic",
    isSample: true,
    externalId: "",
    notes: "SAMPLE DATA",
    city: "richardson",
    zip: "75081",
    ...partial,
  };
}

export function buildSampleState(): AppState {
  const state = createDefaultState();
  state.sampleMode = true;
  const today = todayISO();
  const start = monthStart(today);
  const week = weekStartMonday(today);

  const days = ["02", "03", "04", "05", "06"].map((d) => `${start.slice(0, 8)}${d}`).filter((d) => d <= today);

  const sampleJobs: Job[] = [];
  const templates: Array<Partial<Job> & Pick<Job, "customer" | "technicianId" | "jobType">> = [
    { customer: "SAMPLE: Reyes residence", technicianId: "brien", jobType: "Water heater repair", helperIds: ["nathan"], paidHoursTech: 3.2, paidHoursHelpers: { nathan: 3.2 }, soldRevenue: 1480, completedRevenue: 1480, invoicedRevenue: 1480, collectedRevenue: 1480, materials: 210, sourceId: "lsa", window: "8-10", membershipSold: true },
    { customer: "SAMPLE: Patel kitchen", technicianId: "dustin", jobType: "Kitchen faucet + stops", paidHoursTech: 2.1, soldRevenue: 920, completedRevenue: 920, invoicedRevenue: 920, collectedRevenue: 920, materials: 85, sourceId: "repeat", window: "10-12" },
    { customer: "SAMPLE: Nguyen drain", technicianId: "brien", jobType: "Main drain clearing", helperIds: ["nathan"], paidHoursTech: 1.8, paidHoursHelpers: { nathan: 1.8 }, soldRevenue: 640, completedRevenue: 640, invoicedRevenue: 640, collectedRevenue: 640, materials: 40, sourceId: "ppc", window: "12-2", optionsPresented: "good" },
    { customer: "SAMPLE: Brooks WH estimate", technicianId: "dustin", jobType: "Tankless replacement estimate", paidHoursTech: 1.4, sold: false, status: "estimate", estimatedRevenue: 6800, soldRevenue: 0, completedRevenue: 0, opportunityMissed: true, sourceId: "referral", window: "2-4", category: "large_project" },
    { customer: "SAMPLE: Ortiz sewer camera", technicianId: "brien", jobType: "Sewer camera inspection", helperIds: ["nathan"], paidHoursTech: 2.4, paidHoursHelpers: { nathan: 2.4 }, soldRevenue: 425, completedRevenue: 425, invoicedRevenue: 425, collectedRevenue: 0, materials: 15, sourceId: "organic", window: "8-10", category: "contractor" },
    { customer: "SAMPLE: Hale hydro jet", technicianId: "dustin", jobType: "Hydro jetting", paidHoursTech: 3.5, soldRevenue: 1890, completedRevenue: 1890, invoicedRevenue: 1890, collectedRevenue: 1890, materials: 60, sourceId: "lsa", window: "10-12", financingOffered: true },
    { customer: "SAMPLE: Kim water heater", technicianId: "brien", jobType: "40gal water heater", helperIds: ["nathan"], paidHoursTech: 4.5, paidHoursHelpers: { nathan: 4.5 }, soldRevenue: 2450, completedRevenue: 2450, invoicedRevenue: 2450, collectedRevenue: 2450, materials: 780, sourceId: "nextdoor", window: "12-2", membershipSold: true, optionsPresented: "all" },
    { customer: "SAMPLE: callback — drain", technicianId: "brien", jobType: "Callback drain", helperIds: ["nathan"], paidHoursTech: 1.2, paidHoursHelpers: { nathan: 1.2 }, soldRevenue: 0, completedRevenue: 0, sold: false, callback: true, callbackCost: 185, materials: 20, sourceId: "repeat", window: "2-4" },
    { customer: "SAMPLE: Chen slab leak eval", technicianId: "dustin", jobType: "Slab leak evaluation", paidHoursTech: 2.8, soldRevenue: 1750, completedRevenue: 1750, invoicedRevenue: 1750, collectedRevenue: 900, materials: 95, sourceId: "ppc", window: "8-10", category: "large_project" },
    { customer: "SAMPLE: contractor rough-in", technicianId: "dustin", jobType: "New construction rough-in", paidHoursTech: 6, soldRevenue: 3200, completedRevenue: 3200, invoicedRevenue: 3200, collectedRevenue: 1600, materials: 410, subcontractors: 0, sourceId: "contractor", window: "10-12", category: "contractor" },
  ];

  days.forEach((date, di) => {
    const a = templates[(di * 2) % templates.length];
    const b = templates[(di * 2 + 1) % templates.length];
    sampleJobs.push(job({ ...a, date, customer: `${a.customer} (${date.slice(5)})` }));
    sampleJobs.push(job({ ...b, date, customer: `${b.customer} (${date.slice(5)})` }));
  });

  const tomorrow = addDays(today, weekdayShift(today));
  sampleJobs.push(
    job({
      date: tomorrow,
      customer: "SAMPLE: Lopez 8–10 window",
      technicianId: "brien",
      helperIds: ["nathan"],
      jobType: "Water heater flush / inspection",
      status: "scheduled",
      sold: false,
      estimatedRevenue: 1190,
      window: "8-10",
      paidHoursTech: 0,
    }),
    job({
      date: tomorrow,
      customer: "SAMPLE: Singh 10–12 window",
      technicianId: "dustin",
      jobType: "Garbage disposal",
      status: "scheduled",
      sold: false,
      estimatedRevenue: 780,
      window: "10-12",
      paidHoursTech: 0,
    }),
    job({
      date: tomorrow,
      customer: "SAMPLE: open 2–4",
      technicianId: "brien",
      helperIds: ["nathan"],
      jobType: "Unscheduled",
      status: "scheduled",
      sold: false,
      estimatedRevenue: 0,
      window: "2-4",
      paidHoursTech: 0,
    }),
  );

  state.jobs = sampleJobs;

  state.dailyLogs = days.map((date, i) => ({
    date,
    incomingLeads: 7 + (i % 3),
    booked: 6 + (i % 2),
    completed: 4 + (i % 2),
    soldJobs: 3 + (i % 2),
    collectedRevenue: 0,
    completedRevenue: 0,
    notes: "SAMPLE DATA",
    isSample: true,
  }));

  state.marketing = state.marketing.map((m) => {
    const demo: Record<string, Partial<typeof m>> = {
      lsa: { monthlySpend: 2800, leads: 22, booked: 16, sold: 11, revenue: 14800, grossProfit: 8900 },
      ppc: { monthlySpend: 1600, leads: 14, booked: 8, sold: 5, revenue: 6200, grossProfit: 3400 },
      facebook: { monthlySpend: 400, leads: 6, booked: 2, sold: 1, revenue: 920, grossProfit: 480 },
      nextdoor: { monthlySpend: 150, leads: 4, booked: 3, sold: 2, revenue: 3100, grossProfit: 1800 },
      organic: { monthlySpend: 0, leads: 9, booked: 7, sold: 6, revenue: 7400, grossProfit: 4600 },
      repeat: { monthlySpend: 0, leads: 8, booked: 8, sold: 7, revenue: 6100, grossProfit: 4000 },
      referral: { monthlySpend: 0, leads: 3, booked: 3, sold: 2, revenue: 2100, grossProfit: 1300 },
      contractor: { monthlySpend: 0, leads: 2, booked: 2, sold: 2, revenue: 5400, grossProfit: 2100 },
    };
    return { ...m, ...(demo[m.id] ?? {}), isSample: true };
  });

  state.memberships = [
    { id: uid("mem"), customer: "SAMPLE: Reyes", technicianId: "brien", startDate: days[0] ?? today, renewalDate: addDays(days[0] ?? today, 365), billing: "annual", amount: 120, status: "active", canceledDate: "", inspectionFulfilled: false, flushFulfilled: false, fulfillmentCost: 85, isSample: true },
    { id: uid("mem"), customer: "SAMPLE: Kim", technicianId: "brien", startDate: days[2] ?? today, renewalDate: addDays(days[2] ?? today, 365), billing: "monthly", amount: 10, status: "active", canceledDate: "", inspectionFulfilled: false, flushFulfilled: false, fulfillmentCost: 0, isSample: true },
    { id: uid("mem"), customer: "SAMPLE: Hale", technicianId: "dustin", startDate: addDays(today, -200), renewalDate: addDays(today, 165), billing: "annual", amount: 120, status: "active", canceledDate: "", inspectionFulfilled: true, flushFulfilled: true, fulfillmentCost: 90, isSample: true },
    { id: uid("mem"), customer: "SAMPLE: canceled", technicianId: "dustin", startDate: addDays(today, -400), renewalDate: addDays(today, -35), billing: "annual", amount: 120, status: "canceled", canceledDate: days[1] ?? today, inspectionFulfilled: true, flushFulfilled: false, fulfillmentCost: 70, isSample: true },
  ];

  const weeks: CashWeek[] = [];
  let startW = week;
  for (let i = 0; i < 13; i++) {
    weeks.push({
      weekStart: startW,
      beginningBalance: 0,
      collections: i === 0 ? 8200 : 18000,
      accountsReceivable: 4500,
      deposits: i === 3 ? 2500 : 0,
      payroll: 7200,
      payrollTaxes: 1100,
      materials: 2400,
      subcontractors: i === 2 ? 1800 : 400,
      marketing: 1500,
      software: 200,
      loanPayments: 0,
      ownerSalary: 2000,
      ownerDistributions: i % 2 === 0 ? 2000 : 0,
      debtPrincipal: 0,
      taxes: 0,
      other: 350,
      majorBills: i === 1 ? "DEMO: estimated insurance installment" : "",
      notes: "SAMPLE DATA",
      isSample: true,
    });
    startW = addDays(startW, 7);
  }
  state.cashWeeks = weeks;
  state.settings.beginningBankBalance = 31250;

  const months = [];
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(`${today}T12:00:00`);
    dt.setMonth(dt.getMonth() - i);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const rev = 78000 + ((i * 37) % 18) * 1000;
    months.push({
      month: key,
      revenue: rev,
      grossProfit: rev * 0.61,
      operatingProfit: rev * 0.61 - 47000,
      isSample: true,
    });
  }
  state.monthlyActuals = months;
  state.updatedAt = new Date().toISOString();
  return state;
}

function weekdayShift(today: string): number {
  const [y, m, d] = today.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (dow === 6) return 2;
  if (dow === 0) return 1;
  return 1;
}
