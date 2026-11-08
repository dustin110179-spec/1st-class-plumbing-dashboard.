import { defaultHolidays, todayISO } from "./calendar";
import { CENSUS_HOUSING_DETAIL, CENSUS_HOUSEHOLDS } from "./marketData";
import type {
  AppState,
  BudgetLine,
  Employee,
  HiringPlan,
  MarketingSource,
  MonthlyCashPlan,
  Plan2027,
  ScenarioAssumptions,
  Settings,
} from "./types";

function zeros(): number[] {
  return Array.from({ length: 12 }, () => 0);
}

function hoursPerMonthFromWeekly(hoursPerWeek: number): number {
  return (hoursPerWeek * 52) / 12;
}

const year = Number(todayISO().slice(0, 4));

export const DEFAULT_SETTINGS: Settings = {
  weeklyBreakEven: 15750,
  monthlyFixedOverhead: 47000,
  monthlyOperatingDays: 19,
  annualRevenueGoal: 1200000,
  weeklyRevenueGoal: 25000,
  monthlyRevenueGoal: 100000,
  annualProfitGoal: 300000,
  targetNetMargin: 0.25,
  growthReserveRate: 0.1,
  goalsApproved: false,
  targetGrossMarginLow: 0.6,
  targetGrossMarginHigh: 0.65,
  averageTicket: 1100,
  closeRate: 0.8,
  targetCallsPerTechDayLow: 3,
  targetCallsPerTechDayHigh: 4,
  incomingCallsPerDay: 6,
  processingFeeRate: 0.053,
  membershipAnnualPrice: 120,
  membershipMonthlyPrice: 10,
  membershipDiscount: 0.1,
  laborPercentWarning: 0.28,
  workingWeekdays: [1, 2, 3, 4, 5],
  holidays: defaultHolidays(year),
  timezone: "America/Chicago",
  overheadIncludesMarketing: true,
  overheadIncludesSoftware: true,
  overheadIncludesLoans: true,
  overheadIncludesOwnerSalary: true,
  overheadIncludesNoahSalary: true,
  assumedPaidHoursPerSoldJob: 2.5,
  assumedHelperHoursPerSoldJob: 2.5,
  assumedCommissionPct: 0.015,
  assumedOtherVariablePct: 0,
  beginningBankBalance: 25000,
  membershipGrowthGoal: 120,
  callbackRateTarget: 0.03,
  softwareMonthly: 800,
  loanMonthly: 0,
  marketingBudgetMonthly: 6000,
  assumedMaterialsPct: 0.12,
  assumedSubPct: 0.04,
  cashReserveTarget: 47000,
  planningYear: 2027,
  bookingRate: 0.85,
  ownerMonthlySalary: 8000,
  plannedMonthlyDistribution: 0,
  funnel: {
    leadToBook: 0.85,
    bookToComplete: 0.95,
    completeToSold: 0.8,
    soldToCollected: 0.92,
  },
  pricingKinds: [
    {
      kind: "service_under_4",
      label: "Service jobs under 4 hours",
      laborRate: 180,
      materialsMarkup: 0.4,
      laborBurden: 1.4,
      targetMargin: 0.65,
    },
    {
      kind: "service_5_plus",
      label: "Jobs lasting 5 or more hours",
      laborRate: 165,
      materialsMarkup: 0.35,
      laborBurden: 1.4,
      targetMargin: 0.6,
    },
    {
      kind: "multi_day",
      label: "Multi-day jobs",
      laborRate: 155,
      materialsMarkup: 0.3,
      laborBurden: 1.4,
      targetMargin: 0.55,
    },
    {
      kind: "excavation_sewer",
      label: "Excavation and sewer replacement",
      laborRate: 175,
      materialsMarkup: 0.25,
      laborBurden: 1.4,
      targetMargin: 0.5,
    },
    {
      kind: "subcontractor_heavy",
      label: "Subcontractor-heavy projects",
      laborRate: 140,
      materialsMarkup: 0.15,
      laborBurden: 1.4,
      targetMargin: 0.35,
    },
  ],
  companyName: "1st Class Plumbing",
  tagline: "A Different Kind of Service.",
  established: 2006,
  market: "Dallas, Texas area",
};

export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: "dustin",
    name: "Dustin",
    role: "owner",
    canRunCalls: true,
    hourlyPay: 45,
    laborBurden: 1.25,
    weeklySalesThreshold: 0,
    commissionRate: 0,
    assignedToId: null,
    ownerCompMonthly: 8000,
    payInFixedOverhead: true,
    active: true,
    skills: [
      { name: "Service diagnostics", level: 100 },
      { name: "Large project selling", level: 100 },
      { name: "Sewer / excavation", level: 95 },
    ],
    targetCallsPerDay: 3,
    targetAvgTicket: 1100,
    targetCloseRate: 0.8,
    startDate: null,
    endDate: null,
    producingEndDate: "2027-03-01",
    paidHoursPerDay: 8,
    productiveHoursPerDay: 5.5,
    overtimeHoursMonthly: 0,
    ptoDaysPerYear: 10,
    trainingDaysPerYear: 4,
    callbackRate: 0.03,
  },
  {
    id: "brien",
    name: "Brien",
    role: "lead",
    canRunCalls: true,
    hourlyPay: 30,
    laborBurden: 1.4,
    weeklySalesThreshold: 7500,
    commissionRate: 0.1,
    assignedToId: null,
    ownerCompMonthly: 0,
    payInFixedOverhead: false,
    active: true,
    skills: [
      { name: "Service diagnostics", level: 90 },
      { name: "Water heaters", level: 88 },
      { name: "Options presentation", level: 80 },
    ],
    targetCallsPerDay: 3.5,
    targetAvgTicket: 1100,
    targetCloseRate: 0.8,
    startDate: null,
    endDate: null,
    producingEndDate: null,
    paidHoursPerDay: 8,
    productiveHoursPerDay: 5.5,
    overtimeHoursMonthly: 0,
    ptoDaysPerYear: 10,
    trainingDaysPerYear: 6,
    callbackRate: 0.04,
  },
  {
    id: "nathan",
    name: "Nathan",
    role: "apprentice",
    canRunCalls: false,
    hourlyPay: 18,
    laborBurden: 1.4,
    weeklySalesThreshold: 0,
    commissionRate: 0,
    assignedToId: "brien",
    ownerCompMonthly: 0,
    payInFixedOverhead: false,
    active: true,
    skills: [
      { name: "Safety / job setup", level: 70 },
      { name: "Drain cleaning", level: 55 },
      { name: "Water heater flush", level: 50 },
      { name: "Independent diagnostics", level: 25 },
    ],
    targetCallsPerDay: 0,
    targetAvgTicket: 0,
    targetCloseRate: 0,
    startDate: null,
    endDate: null,
    producingEndDate: null,
    paidHoursPerDay: 8,
    productiveHoursPerDay: 0,
    overtimeHoursMonthly: 0,
    ptoDaysPerYear: 10,
    trainingDaysPerYear: 8,
    callbackRate: 0,
  },
  {
    id: "noah",
    name: "Noah",
    role: "office",
    canRunCalls: false,
    hourlyPay: 0,
    laborBurden: 1,
    weeklySalesThreshold: 0,
    commissionRate: 0,
    assignedToId: null,
    ownerCompMonthly: 0,
    payInFixedOverhead: true,
    active: true,
    skills: [{ name: "Office / dispatch", level: 80 }],
    targetCallsPerDay: 0,
    targetAvgTicket: 0,
    targetCloseRate: 0,
    startDate: null,
    endDate: null,
    producingEndDate: null,
    paidHoursPerDay: 8,
    productiveHoursPerDay: 0,
    overtimeHoursMonthly: 0,
    ptoDaysPerYear: 10,
    trainingDaysPerYear: 2,
    callbackRate: 0,
  },
  {
    id: "linda",
    name: "Linda",
    role: "office",
    canRunCalls: false,
    hourlyPay: 22,
    laborBurden: 1.3,
    weeklySalesThreshold: 0,
    commissionRate: 0,
    assignedToId: null,
    ownerCompMonthly: 0,
    payInFixedOverhead: true,
    active: true,
    skills: [{ name: "CSR / dispatch", level: 90 }],
    targetCallsPerDay: 0,
    targetAvgTicket: 0,
    targetCloseRate: 0,
    startDate: null,
    endDate: null,
    producingEndDate: null,
    paidHoursPerDay: 8,
    productiveHoursPerDay: 0,
    overtimeHoursMonthly: 0,
    ptoDaysPerYear: 10,
    trainingDaysPerYear: 2,
    callbackRate: 0,
  },
  {
    id: "tech3",
    name: "First new technician",
    role: "technician",
    canRunCalls: true,
    hourlyPay: 28,
    laborBurden: 1.4,
    weeklySalesThreshold: 7500,
    commissionRate: 0.1,
    assignedToId: null,
    ownerCompMonthly: 0,
    payInFixedOverhead: false,
    active: true,
    skills: [
      { name: "Service diagnostics", level: 50 },
      { name: "Water heaters", level: 45 },
    ],
    targetCallsPerDay: 3,
    targetAvgTicket: 1100,
    targetCloseRate: 0.8,
    startDate: "2027-02-01",
    endDate: null,
    producingEndDate: null,
    paidHoursPerDay: 8,
    productiveHoursPerDay: 5.5,
    overtimeHoursMonthly: 0,
    ptoDaysPerYear: 10,
    trainingDaysPerYear: 8,
    callbackRate: 0.05,
  },
  {
    id: "tech4",
    name: "Second new technician",
    role: "technician",
    canRunCalls: true,
    hourlyPay: 28,
    laborBurden: 1.4,
    weeklySalesThreshold: 7500,
    commissionRate: 0.1,
    assignedToId: null,
    ownerCompMonthly: 0,
    payInFixedOverhead: false,
    active: true,
    skills: [
      { name: "Service diagnostics", level: 50 },
      { name: "Water heaters", level: 45 },
    ],
    targetCallsPerDay: 3,
    targetAvgTicket: 1100,
    targetCloseRate: 0.8,
    startDate: "2027-03-01",
    endDate: null,
    producingEndDate: null,
    paidHoursPerDay: 8,
    productiveHoursPerDay: 5.5,
    overtimeHoursMonthly: 0,
    ptoDaysPerYear: 10,
    trainingDaysPerYear: 8,
    callbackRate: 0.05,
  },
];

export const DEFAULT_MARKETING: MarketingSource[] = [
  { id: "lsa", name: "Google Local Services Ads", monthlySpend: 0, leads: 0, booked: 0, sold: 0, completed: 0, revenue: 0, grossProfit: 0, city: "both", isSample: false },
  { id: "ppc", name: "Google Ads", monthlySpend: 0, leads: 0, booked: 0, sold: 0, completed: 0, revenue: 0, grossProfit: 0, city: "both", isSample: false },
  { id: "facebook", name: "Facebook Ads", monthlySpend: 0, leads: 0, booked: 0, sold: 0, completed: 0, revenue: 0, grossProfit: 0, city: "both", isSample: false },
  { id: "nextdoor", name: "Nextdoor", monthlySpend: 0, leads: 0, booked: 0, sold: 0, completed: 0, revenue: 0, grossProfit: 0, city: "richardson", isSample: false },
  { id: "seo", name: "SEO / website", monthlySpend: 0, leads: 0, booked: 0, sold: 0, completed: 0, revenue: 0, grossProfit: 0, city: "both", isSample: false },
  { id: "organic", name: "Organic Google", monthlySpend: 0, leads: 0, booked: 0, sold: 0, completed: 0, revenue: 0, grossProfit: 0, city: "both", isSample: false },
  { id: "repeat", name: "Repeat customers", monthlySpend: 0, leads: 0, booked: 0, sold: 0, completed: 0, revenue: 0, grossProfit: 0, city: "both", isSample: false },
  { id: "referral", name: "Referrals", monthlySpend: 0, leads: 0, booked: 0, sold: 0, completed: 0, revenue: 0, grossProfit: 0, city: "both", isSample: false },
  { id: "other", name: "Other marketing", monthlySpend: 0, leads: 0, booked: 0, sold: 0, completed: 0, revenue: 0, grossProfit: 0, city: "other", isSample: false },
  { id: "contractor", name: "Contractor accounts", monthlySpend: 0, leads: 0, booked: 0, sold: 0, completed: 0, revenue: 0, grossProfit: 0, city: "other", isSample: false },
];

function scenarioBase(partial: Partial<ScenarioAssumptions> & Pick<ScenarioAssumptions, "id" | "name">): ScenarioAssumptions {
  return {
    lockedPreset: true,
    averageTicket: 1100,
    closeRate: 0.8,
    incomingCallsPerDay: 6,
    technicians: 2,
    hireApprentice: true,
    workingDays: 19,
    grossMargin: 0.62,
    monthlyOverhead: 47000,
    marketingBudget: 6000,
    materialCostPct: 0.12,
    subCostPct: 0.04,
    laborWage: 30,
    laborBurden: 1.4,
    apprenticeWage: 18,
    membershipSalesPerMonth: 8,
    callbackRate: 0.04,
    callsPerTechDay: 3.5,
    ...partial,
  };
}

export function defaultScenarioA(): ScenarioAssumptions {
  return scenarioBase({
    id: "conservative",
    name: "Conservative",
    averageTicket: 950,
    closeRate: 0.72,
    incomingCallsPerDay: 5,
    technicians: 2,
    hireApprentice: true,
    grossMargin: 0.58,
    monthlyOverhead: 47000,
    marketingBudget: 5000,
    materialCostPct: 0.14,
    subCostPct: 0.05,
    membershipSalesPerMonth: 4,
    callbackRate: 0.05,
    callsPerTechDay: 2.5,
  });
}

export function defaultScenarioB(): ScenarioAssumptions {
  return scenarioBase({
    id: "base",
    name: "Base Case",
  });
}

export function defaultScenarioC(): ScenarioAssumptions {
  return scenarioBase({
    id: "growth",
    name: "Growth",
    averageTicket: 1200,
    closeRate: 0.8,
    incomingCallsPerDay: 12,
    technicians: 3,
    hireApprentice: true,
    grossMargin: 0.6,
    monthlyOverhead: 54500,
    marketingBudget: 9000,
    materialCostPct: 0.12,
    subCostPct: 0.05,
    laborWage: 32,
    membershipSalesPerMonth: 12,
    callbackRate: 0.04,
    callsPerTechDay: 3.2,
  });
}

function fill(n: number): number[] {
  return Array.from({ length: 12 }, () => n);
}

function fromMonth(startIndex: number, value: number, janValue = 0): number[] {
  return Array.from({ length: 12 }, (_, i) => (i < startIndex ? janValue : value));
}

function line(id: string, name: string, group: BudgetLine["group"], monthlyBudget: number[]): BudgetLine {
  return {
    id,
    name,
    group,
    monthlyBudget,
    monthlyActual: zeros(),
    monthlyForecast: monthlyBudget.slice(),
  };
}

export function defaultHiring(): HiringPlan {
  return {
    employeeId: "tech3",
    startDate: "2027-02-01",
    displayName: "First new technician",
    hourlyWage: 28,
    weeklySalesThreshold: 7500,
    commissionRate: 0.1,
    laborBurden: 1.4,
    paidHoursPerWeek: 40,
    productiveHoursPerDay: 5.5,
    vehicleMonthly: 650,
    fuelMonthly: 400,
    insuranceMonthly: 350,
    toolsMonthly: 50,
    uniformsMonthly: 25,
    startupTools: 2500,
    startupUniforms: 400,
    extraMarketingMonthly: 2000,
    usesExistingTruck: false,
    rampFeb: 0.5,
    rampMar: 0.75,
    rampAprOnward: 1,
    cashMonthsRequired: 2,
    minIncomingCallsPerDay: 12,
  };
}

export function defaultSecondHire(): HiringPlan {
  return {
    ...defaultHiring(),
    employeeId: "tech4",
    startDate: "2027-03-01",
    displayName: "Second new technician",
    vehicleMonthly: 0,
    fuelMonthly: 0,
    insuranceMonthly: 0,
    extraMarketingMonthly: 0,
    usesExistingTruck: true,
  };
}

function hireWagesOn(startIndex: number, monthlyWage: number): number[] {
  return Array.from({ length: 12 }, (_, i) => (i >= startIndex ? monthlyWage : 0));
}

function sumMonths(...parts: number[][]): number[] {
  return Array.from({ length: 12 }, (_, i) => parts.reduce((n, p) => n + (p[i] ?? 0), 0));
}

export function createDefaultPlan(): Plan2027 {
  const hours = hoursPerMonthFromWeekly(40);
  const firstHire = defaultHiring();
  const secondHire = defaultSecondHire();
  const brienWages = 30 * hours;
  const nathanWages = 18 * hours;
  const tech3Wages = firstHire.hourlyWage * hours;
  const tech4Wages = secondHire.hourlyWage * hours;
  const fieldBurdenPct = 0.4;
  const brienBurden = brienWages * fieldBurdenPct;
  const nathanBurden = nathanWages * fieldBurdenPct;
  const tech3Burden = tech3Wages * fieldBurdenPct;
  const tech4Burden = tech4Wages * fieldBurdenPct;
  const brienCommission = 750;
  const lindaOffice = 22 * hours * 1.3;
  const days = 19;
  const newTechJobs = 3;
  const ticket = 1100;
  const hireCommission = (hire: HiringPlan, month: number) => {
    const ramp = month < Number(hire.startDate.slice(5, 7)) - 1 ? 0 : month === Number(hire.startDate.slice(5, 7)) - 1 ? hire.rampFeb : month === Number(hire.startDate.slice(5, 7)) ? hire.rampMar : hire.rampAprOnward;
    const revenue = ramp * newTechJobs * days * ticket;
    const threshold = hire.weeklySalesThreshold * (52 / 12);
    return Math.max(0, revenue - threshold) * hire.commissionRate;
  };
  const commissions = Array.from({ length: 12 }, (_, i) => brienCommission + hireCommission(firstHire, i) + hireCommission(secondHire, i));
  const revenueMix: { id: string; name: string; share: number }[] = [
    { id: "residential_service", name: "Residential service", share: 0.4 },
    { id: "water_heaters", name: "Water heaters", share: 0.18 },
    { id: "drain_cleaning", name: "Drain cleaning", share: 0.1 },
    { id: "sewer_replacement", name: "Sewer replacement", share: 0.08 },
    { id: "excavation", name: "Excavation", share: 0.06 },
    { id: "gas_water_lines", name: "Gas and water lines", share: 0.06 },
    { id: "contractor", name: "Contractor work", share: 0.06 },
    { id: "memberships", name: "Memberships", share: 0.03 },
    { id: "other_income", name: "Other income", share: 0.03 },
  ];
  const monthlyRevenue = 100000;
  const techWageMonths = sumMonths(fill(brienWages), hireWagesOn(1, tech3Wages), hireWagesOn(2, tech4Wages));
  const burdenMonths = sumMonths(fill(brienBurden + nathanBurden), hireWagesOn(1, tech3Burden), hireWagesOn(2, tech4Burden));
  const startupMonths = zeros().map((_, i) => (i === 1 ? 2500 + 400 : i === 2 ? 2500 + 400 : 0));
  const lines: BudgetLine[] = [
    ...revenueMix.map((r) => line(r.id, r.name, "revenue", fill(monthlyRevenue * r.share))),
    line("tech_wages", "Technician wages (Brien + two hired techs)", "cogs", techWageMonths),
    line("apprentice_wages", "Apprentice / helper wages", "cogs", fill(nathanWages)),
    line("commissions", "Commissions and spiffs", "cogs", commissions),
    line("payroll_burden", "Payroll taxes and benefits (field)", "cogs", burdenMonths),
    line("materials", "Materials", "cogs", fill(monthlyRevenue * 0.12)),
    line("subcontractors", "Subcontractors", "cogs", fill(monthlyRevenue * 0.04)),
    line("advertising", "Advertising", "opex", fromMonth(1, 8000, 6000)),
    line("office_payroll", "Office payroll (Linda / CSR)", "opex", fill(lindaOffice)),
    line("owner_compensation", "Owner salary (management)", "opex", fill(8000)),
    line("vehicle", "Vehicle expenses", "opex", fromMonth(1, 3050, 2400)),
    line("insurance", "Insurance", "opex", fromMonth(1, 3550, 3200)),
    line("software", "Software", "opex", fill(800)),
    line("merchant", "Merchant processing", "opex", fill(monthlyRevenue * 0.053)),
    line("utilities", "Utilities", "opex", fill(600)),
    line("general_overhead", "General overhead", "opex", fill(16500)),
    line("new_tech_startup", "New technician startup (tools / uniforms)", "opex", startupMonths),
  ];

  const monthlyCash: MonthlyCashPlan[] = Array.from({ length: 12 }, (_, i) => {
    const rev = 100000;
    const hiredWages = (i >= 1 ? tech3Wages : 0) + (i >= 2 ? tech4Wages : 0);
    const payroll = brienWages + nathanWages + lindaOffice + hiredWages;
    const burden = (brienWages + nathanWages + hiredWages) * fieldBurdenPct;
    const startupOverhead = i === 1 || i === 2 ? 2900 : 0;
    return {
      month: i,
      collections: rev * 0.92,
      payroll: payroll + burden + 8000,
      materials: rev * 0.12,
      subcontractors: rev * 0.04,
      overhead: (i === 0 ? 29300 : 32200) + startupOverhead,
      taxes: 0,
      debtPrincipal: 0,
      ownerSalary: 0,
      ownerDistributions: 0,
      other: 0,
      notes: "Planning cash uses 92% collection lag. Owner salary is inside payroll so it is not listed again under owner salary. Debt principal starts at $0. Growth reserve is a cash allocation, not an extra overhead line.",
    };
  });

  return {
    year: 2027,
    draft: true,
    budgetLocked: false,
    budgetLockedAt: null,
    ownerOffTruckDate: "2027-03-01",
    lines,
    hiring: firstHire,
    secondHire,
    market: {
      richardsonHouseholds: CENSUS_HOUSEHOLDS.richardson.households,
      planoHouseholds: CENSUS_HOUSEHOLDS.plano.households,
      richardsonOwnerShare: CENSUS_HOUSING_DETAIL.richardson.ownerShare,
      planoOwnerShare: CENSUS_HOUSING_DETAIL.plano.ownerShare,
      richardsonOwnerOccupied: CENSUS_HOUSEHOLDS.richardson.households * CENSUS_HOUSING_DETAIL.richardson.ownerShare,
      planoOwnerOccupied: CENSUS_HOUSEHOLDS.plano.households * CENSUS_HOUSING_DETAIL.plano.ownerShare,
      richardsonMedianYearBuilt: CENSUS_HOUSING_DETAIL.richardson.medianYearBuilt,
      planoMedianYearBuilt: CENSUS_HOUSING_DETAIL.plano.medianYearBuilt,
      richardsonDetachedShare: CENSUS_HOUSING_DETAIL.richardson.detachedShare,
      planoDetachedShare: CENSUS_HOUSING_DETAIL.plano.detachedShare,
      jobsPerServiceableHhYear: 0.35,
      averageTicket: 1100,
      existingCustomersRichardson: 0,
      existingCustomersPlano: 0,
      driveMinutesSavedPerJob: 0,
      minutesPerCompletedJob: 45,
      serviceableMode: "owner_occupied",
    },
    monthlyCash,
    lastBudgetEdit: null,
    lastForecastEdit: null,
    lastActualEdit: null,
    growthAllocated: zeros(),
  };
}

export function createDefaultState(): AppState {
  return {
    version: 1,
    sampleMode: false,
    settings: structuredClone(DEFAULT_SETTINGS),
    employees: structuredClone(DEFAULT_EMPLOYEES),
    jobs: [],
    dailyLogs: [],
    marketing: structuredClone(DEFAULT_MARKETING),
    memberships: [],
    cashWeeks: [],
    monthlyActuals: [],
    scenarios: [defaultScenarioA(), defaultScenarioB(), defaultScenarioC()],
    customScenarios: [],
    plan: createDefaultPlan(),
    dailyChecklists: [],
    importHistory: [],
    integrations: {
      quickbooks: { connected: false, lastSync: null },
      podium: { connected: false, lastSync: null },
    },
    updatedAt: new Date().toISOString(),
  };
}
