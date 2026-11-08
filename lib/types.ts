export type ArrivalWindow = "8-10" | "10-12" | "12-2" | "2-4";
export type Role = "owner" | "lead" | "technician" | "apprentice" | "office";
export type JobCategory = "service" | "contractor" | "large_project";
export type JobStatus = "scheduled" | "completed" | "canceled" | "estimate";
export type OptionsPresented = "none" | "good" | "better" | "best" | "all";
export type PricingJobKind =
  | "service_under_4"
  | "service_5_plus"
  | "multi_day"
  | "excavation_sewer"
  | "subcontractor_heavy";
export type DataMode = "empty" | "forecast" | "actual" | "sample";
export type ViewId =
  | "today"
  | "dashboard"
  | "budget"
  | "hiring"
  | "labor"
  | "breakeven"
  | "simulator"
  | "market"
  | "technicians"
  | "schedule"
  | "pricing"
  | "marketing"
  | "memberships"
  | "cashflow"
  | "daily"
  | "import"
  | "report"
  | "settings";
export type ScorecardPeriod = "day" | "week" | "month" | "quarter" | "ytd" | "year";
export type ServiceCity = "richardson" | "plano" | "other";
export type BudgetGroup = "revenue" | "cogs" | "opex";
export type LineSource = "budget" | "actual" | "forecast";
export type IntegrationKind = "quickbooks" | "podium" | "csv" | "excel" | "manual";

export interface Skill {
  name: string;
  level: number;
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  canRunCalls: boolean;
  hourlyPay: number;
  laborBurden: number;
  weeklySalesThreshold: number;
  commissionRate: number;
  assignedToId: string | null;
  ownerCompMonthly: number;
  /** When true, this person's pay is already inside monthly fixed expenses and is not variable job labor. */
  payInFixedOverhead: boolean;
  active: boolean;
  skills: Skill[];
  targetCallsPerDay: number;
  targetAvgTicket: number;
  targetCloseRate: number;
  startDate: string | null;
  endDate: string | null;
  /** Inclusive date the person stops counting as a revenue-producing truck. Owner can stay employed in management. */
  producingEndDate: string | null;
  paidHoursPerDay: number;
  productiveHoursPerDay: number;
  overtimeHoursMonthly: number;
  ptoDaysPerYear: number;
  trainingDaysPerYear: number;
  callbackRate: number;
}

export interface Job {
  id: string;
  date: string;
  customer: string;
  jobType: string;
  category: JobCategory;
  technicianId: string;
  helperIds: string[];
  window: ArrivalWindow | "";
  estimatedRevenue: number;
  soldRevenue: number;
  completedRevenue: number;
  invoicedRevenue: number;
  collectedRevenue: number;
  status: JobStatus;
  sold: boolean;
  estimatedHours: number;
  paidHoursTech: number;
  paidHoursHelpers: Record<string, number>;
  materials: number;
  subcontractors: number;
  membershipSold: boolean;
  callback: boolean;
  callbackCost: number;
  optionsPresented: OptionsPresented;
  financingOffered: boolean;
  reviewScore: number | null;
  opportunityMissed: boolean;
  sourceId: string;
  isSample: boolean;
  externalId: string;
  notes: string;
  city: ServiceCity;
  zip: string;
}

export interface DailyLog {
  date: string;
  incomingLeads: number;
  booked: number;
  completed: number;
  soldJobs: number;
  collectedRevenue: number;
  completedRevenue: number;
  notes: string;
  isSample: boolean;
}

export interface MarketingSource {
  id: string;
  name: string;
  monthlySpend: number;
  leads: number;
  booked: number;
  sold: number;
  completed: number;
  revenue: number;
  grossProfit: number;
  city: ServiceCity | "both";
  isSample: boolean;
}

export interface Membership {
  id: string;
  customer: string;
  technicianId: string;
  startDate: string;
  renewalDate: string;
  billing: "annual" | "monthly";
  amount: number;
  status: "active" | "canceled";
  canceledDate: string;
  inspectionFulfilled: boolean;
  flushFulfilled: boolean;
  fulfillmentCost: number;
  isSample: boolean;
}

export interface CashWeek {
  weekStart: string;
  beginningBalance: number;
  collections: number;
  accountsReceivable: number;
  deposits: number;
  payroll: number;
  payrollTaxes: number;
  materials: number;
  subcontractors: number;
  marketing: number;
  software: number;
  loanPayments: number;
  ownerSalary: number;
  ownerDistributions: number;
  debtPrincipal: number;
  taxes: number;
  other: number;
  majorBills: string;
  notes: string;
  isSample: boolean;
}

export interface MonthlyActual {
  month: string;
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  isSample: boolean;
}

export interface PricingKindConfig {
  kind: PricingJobKind;
  label: string;
  laborRate: number;
  materialsMarkup: number;
  laborBurden: number;
  targetMargin: number;
}

export interface FunnelRates {
  leadToBook: number;
  bookToComplete: number;
  completeToSold: number;
  soldToCollected: number;
}

export interface Settings {
  weeklyBreakEven: number;
  monthlyFixedOverhead: number;
  monthlyOperatingDays: number;
  annualRevenueGoal: number;
  weeklyRevenueGoal: number;
  monthlyRevenueGoal: number;
  annualProfitGoal: number;
  targetNetMargin: number;
  growthReserveRate: number;
  goalsApproved: boolean;
  targetGrossMarginLow: number;
  targetGrossMarginHigh: number;
  averageTicket: number;
  closeRate: number;
  targetCallsPerTechDayLow: number;
  targetCallsPerTechDayHigh: number;
  incomingCallsPerDay: number;
  processingFeeRate: number;
  membershipAnnualPrice: number;
  membershipMonthlyPrice: number;
  membershipDiscount: number;
  laborPercentWarning: number;
  workingWeekdays: number[];
  holidays: string[];
  timezone: string;
  overheadIncludesMarketing: boolean;
  overheadIncludesSoftware: boolean;
  overheadIncludesLoans: boolean;
  overheadIncludesOwnerSalary: boolean;
  overheadIncludesNoahSalary: boolean;
  assumedPaidHoursPerSoldJob: number;
  assumedHelperHoursPerSoldJob: number;
  assumedCommissionPct: number;
  assumedOtherVariablePct: number;
  beginningBankBalance: number;
  membershipGrowthGoal: number;
  callbackRateTarget: number;
  softwareMonthly: number;
  loanMonthly: number;
  marketingBudgetMonthly: number;
  assumedMaterialsPct: number;
  assumedSubPct: number;
  cashReserveTarget: number;
  planningYear: number;
  bookingRate: number;
  ownerMonthlySalary: number;
  plannedMonthlyDistribution: number;
  funnel: FunnelRates;
  pricingKinds: PricingKindConfig[];
  companyName: string;
  tagline: string;
  established: number;
  market: string;
}

export interface ScenarioAssumptions {
  id: string;
  name: string;
  lockedPreset: boolean;
  averageTicket: number;
  closeRate: number;
  incomingCallsPerDay: number;
  technicians: number;
  hireApprentice: boolean;
  workingDays: number;
  grossMargin: number;
  monthlyOverhead: number;
  marketingBudget: number;
  materialCostPct: number;
  subCostPct: number;
  laborWage: number;
  laborBurden: number;
  apprenticeWage: number;
  membershipSalesPerMonth: number;
  callbackRate: number;
  callsPerTechDay: number;
}

export interface AppState {
  version: 1;
  sampleMode: boolean;
  settings: Settings;
  employees: Employee[];
  jobs: Job[];
  dailyLogs: DailyLog[];
  marketing: MarketingSource[];
  memberships: Membership[];
  cashWeeks: CashWeek[];
  monthlyActuals: MonthlyActual[];
  scenarios: [ScenarioAssumptions, ScenarioAssumptions, ScenarioAssumptions];
  customScenarios: ScenarioAssumptions[];
  plan: Plan2027;
  dailyChecklists: DailyChecklist[];
  importHistory: ImportEvent[];
  integrations: IntegrationStatus;
  updatedAt: string;
}

export interface BudgetLine {
  id: string;
  name: string;
  group: BudgetGroup;
  monthlyBudget: number[];
  monthlyActual: number[];
  monthlyForecast: number[];
}

export interface HiringPlan {
  employeeId: string;
  startDate: string;
  displayName: string;
  hourlyWage: number;
  weeklySalesThreshold: number;
  commissionRate: number;
  laborBurden: number;
  paidHoursPerWeek: number;
  productiveHoursPerDay: number;
  vehicleMonthly: number;
  fuelMonthly: number;
  insuranceMonthly: number;
  toolsMonthly: number;
  uniformsMonthly: number;
  startupTools: number;
  startupUniforms: number;
  extraMarketingMonthly: number;
  usesExistingTruck: boolean;
  rampFeb: number;
  rampMar: number;
  rampAprOnward: number;
  cashMonthsRequired: number;
  minIncomingCallsPerDay: number;
}

export interface MarketAssumptions {
  richardsonHouseholds: number;
  planoHouseholds: number;
  richardsonOwnerOccupied: number;
  planoOwnerOccupied: number;
  richardsonOwnerShare: number;
  planoOwnerShare: number;
  richardsonMedianYearBuilt: number;
  planoMedianYearBuilt: number;
  richardsonDetachedShare: number;
  planoDetachedShare: number;
  jobsPerServiceableHhYear: number;
  averageTicket: number;
  existingCustomersRichardson: number;
  existingCustomersPlano: number;
  driveMinutesSavedPerJob: number;
  minutesPerCompletedJob: number;
  serviceableMode: "owner_occupied" | "owner_detached" | "all_households";
}

export interface MonthlyCashPlan {
  month: number;
  collections: number;
  payroll: number;
  materials: number;
  subcontractors: number;
  overhead: number;
  taxes: number;
  debtPrincipal: number;
  ownerSalary: number;
  ownerDistributions: number;
  other: number;
  notes: string;
}

export interface Plan2027 {
  year: number;
  draft: boolean;
  budgetLocked: boolean;
  budgetLockedAt: string | null;
  ownerOffTruckDate: string;
  lines: BudgetLine[];
  hiring: HiringPlan;
  secondHire: HiringPlan;
  market: MarketAssumptions;
  monthlyCash: MonthlyCashPlan[];
  lastBudgetEdit: string | null;
  lastForecastEdit: string | null;
  lastActualEdit: string | null;
  /** Cash set aside for growth by month. Not an operating expense and not deducted from accounting net profit. */
  growthAllocated: number[];
}

export interface DailyChecklist {
  date: string;
  items: { id: string; label: string; done: boolean }[];
}

export interface ImportEvent {
  id: string;
  at: string;
  source: IntegrationKind;
  kind: string;
  rows: number;
  notes: string;
}

export interface IntegrationStatus {
  quickbooks: { connected: boolean; lastSync: string | null };
  podium: { connected: boolean; lastSync: string | null };
}

export interface MissingInfo {
  field: string;
  reason: string;
}

export interface JobEconomics {
  jobId: string;
  revenue: number;
  techLabor: number;
  helperLabor: number;
  overheadLaborExcluded: number;
  materials: number;
  subcontractors: number;
  processing: number;
  commission: number;
  otherVariable: number;
  grossProfit: number;
  grossMargin: number | null;
  contributionProfit: number;
  contributionMargin: number | null;
  revenuePerCrewHour: number | null;
  laborPct: number | null;
  laborHigh: boolean;
  missing: MissingInfo[];
}

export interface MonthProjection {
  today: string;
  monthKey: string;
  workingDaysInMonth: string[];
  workingDaysElapsed: string[];
  workingDaysRemaining: string[];
  mtdCompletedRevenue: number;
  mtdSoldRevenue: number;
  mtdCollectedRevenue: number;
  mtdInvoicedRevenue: number;
  monthlyCashBreakEven: number;
  monthlyCostBreakEven: number | null;
  fixedOperatingExpenses: number;
  contributionMargin: number | null;
  projectedContributionProfit: number;
  profitPerDollarAboveBreakEven: number | null;
  profitOnRevenueAboveBreakEven: number;
  monthlyRevenueGoal: number;
  revenueRemainingToBreakEven: number;
  revenueRemainingToGoal: number;
  currentAvgTicket: number | null;
  currentCloseRate: number | null;
  usingAssumedTicket: boolean;
  usingAssumedClose: boolean;
  jobsNeededToBreakEven: number | null;
  callsNeededToBreakEven: number | null;
  jobsNeededToGoal: number | null;
  callsNeededToGoal: number | null;
  callsPerDayToBreakEven: number | null;
  callsPerDayToGoal: number | null;
  incomingLeads: number;
  booked: number;
  completedAppointments: number;
  soldJobs: number;
  forecastDailyRevenue: number;
  projectedMonthEndRevenue: number;
  projectedBreakEvenDate: string | null;
  workingDaysAfterBreakEven: number | null;
  notProjectedToBreakEven: boolean;
  paceVsBreakEven: number;
  paceVsGoal: number;
  status: "red" | "yellow" | "green";
  statusLabel: string;
  projectedCashProfit: number;
  projectedGrossProfit: number;
  projectedOperatingProfit: number;
  grossMargin: number | null;
  revenuePerTechDay: number | null;
  dataMode: DataMode;
  missing: MissingInfo[];
}
