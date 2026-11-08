import { uid } from "./format";
import type { AppState, Job, JobCategory, JobStatus } from "./types";

export interface ColumnMap {
  date?: string;
  customer?: string;
  jobType?: string;
  technician?: string;
  estimatedRevenue?: string;
  soldRevenue?: string;
  completedRevenue?: string;
  invoicedRevenue?: string;
  collectedRevenue?: string;
  status?: string;
  materials?: string;
  subcontractors?: string;
  paidHours?: string;
  source?: string;
  externalId?: string;
  category?: string;
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
  return { headers, rows };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function suggestMap(headers: string[]): ColumnMap {
  const lower = headers.map((h) => h.toLowerCase());
  const find = (...needles: string[]) =>
    headers.find((_, i) => needles.some((n) => lower[i].includes(n)));
  return {
    date: find("date", "job date", "completed", "invoice date"),
    customer: find("customer", "client", "name", "contact"),
    jobType: find("job type", "service", "description", "item"),
    technician: find("tech", "employee", "assigned"),
    estimatedRevenue: find("estimate", "quoted"),
    soldRevenue: find("sold", "total", "amount", "revenue"),
    completedRevenue: find("completed", "job total"),
    invoicedRevenue: find("invoice", "invoiced"),
    collectedRevenue: find("paid", "collected", "payment"),
    status: find("status"),
    materials: find("material", "parts"),
    subcontractors: find("sub", "contractor cost"),
    paidHours: find("hours", "duration", "time"),
    source: find("source", "campaign", "lead"),
    externalId: find("id", "invoice #", "job #", "number"),
    category: find("category", "type", "department"),
  };
}

function moneyCell(v: string): number {
  const n = Number(String(v).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function matchTech(name: string, state: AppState): string {
  const n = name.trim().toLowerCase();
  if (!n) return state.employees[0]?.id ?? "dustin";
  const hit = state.employees.find((e) => e.name.toLowerCase() === n || n.includes(e.name.toLowerCase()));
  return hit?.id ?? state.employees[0]?.id ?? "dustin";
}

function matchSource(name: string, state: AppState): string {
  const n = name.trim().toLowerCase();
  const hit = state.marketing.find((m) => m.name.toLowerCase().includes(n) || n.includes(m.id));
  return hit?.id ?? "organic";
}

function statusCell(v: string): JobStatus {
  const n = v.toLowerCase();
  if (n.includes("cancel")) return "canceled";
  if (n.includes("sched") || n.includes("book")) return "scheduled";
  if (n.includes("estim")) return "estimate";
  return "completed";
}

function categoryCell(v: string): JobCategory {
  const n = v.toLowerCase();
  if (n.includes("contractor") || n.includes("builder")) return "contractor";
  if (n.includes("sewer") || n.includes("project") || n.includes("replace")) return "large_project";
  return "service";
}

function normalizeDate(v: string): string {
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const mm = m[1].padStart(2, "0");
    const dd = m[2].padStart(2, "0");
    const yy = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${yy}-${mm}-${dd}`;
  }
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return "";
}

export function importJobs(
  state: AppState,
  rows: Record<string, string>[],
  map: ColumnMap,
): { state: AppState; imported: number; skipped: number } {
  const existing = new Set(
    state.jobs.map((j) => j.externalId).filter(Boolean).concat(state.jobs.map((j) => `${j.date}|${j.customer}|${j.soldRevenue}`)),
  );
  let imported = 0;
  let skipped = 0;
  const jobs = [...state.jobs];
  for (const row of rows) {
    const get = (k?: string) => (k ? row[k] ?? "" : "");
    const date = normalizeDate(get(map.date));
    const customer = get(map.customer) || "Imported customer";
    const soldRevenue = moneyCell(get(map.soldRevenue) || get(map.completedRevenue) || get(map.invoicedRevenue));
    const externalId = get(map.externalId);
    const dedupe = externalId || `${date}|${customer}|${soldRevenue}`;
    if (!date || existing.has(dedupe)) {
      skipped += 1;
      continue;
    }
    existing.add(dedupe);
    const completedRevenue = moneyCell(get(map.completedRevenue)) || soldRevenue;
    jobs.push({
      id: uid("job"),
      date,
      customer,
      jobType: get(map.jobType) || "Imported job",
      category: categoryCell(get(map.category)),
      technicianId: matchTech(get(map.technician), state),
      helperIds: [],
      window: "",
      estimatedRevenue: moneyCell(get(map.estimatedRevenue)) || soldRevenue,
      soldRevenue,
      completedRevenue,
      invoicedRevenue: moneyCell(get(map.invoicedRevenue)) || completedRevenue,
      collectedRevenue: moneyCell(get(map.collectedRevenue)),
      status: statusCell(get(map.status)),
      sold: soldRevenue > 0,
      estimatedHours: moneyCell(get(map.paidHours)),
      paidHoursTech: moneyCell(get(map.paidHours)),
      paidHoursHelpers: {},
      materials: moneyCell(get(map.materials)),
      subcontractors: moneyCell(get(map.subcontractors)),
      membershipSold: false,
      callback: false,
      callbackCost: 0,
      optionsPresented: "none",
      financingOffered: false,
      reviewScore: null,
      opportunityMissed: false,
      sourceId: matchSource(get(map.source), state),
      isSample: false,
      externalId,
      notes: "Imported",
    });
    imported += 1;
  }
  return { state: { ...state, jobs, sampleMode: false, updatedAt: new Date().toISOString() }, imported, skipped };
}

export function exportJobsCsv(jobs: Job[]): string {
  const headers = [
    "date",
    "customer",
    "jobType",
    "category",
    "technicianId",
    "helpers",
    "window",
    "estimatedRevenue",
    "soldRevenue",
    "completedRevenue",
    "invoicedRevenue",
    "collectedRevenue",
    "status",
    "sold",
    "paidHoursTech",
    "materials",
    "subcontractors",
    "sourceId",
    "membershipSold",
    "callback",
    "isSample",
    "externalId",
  ];
  const lines = [headers.join(",")];
  for (const j of jobs) {
    const row = [
      j.date,
      csvEscape(j.customer),
      csvEscape(j.jobType),
      j.category,
      j.technicianId,
      csvEscape(j.helperIds.join("|")),
      j.window,
      j.estimatedRevenue,
      j.soldRevenue,
      j.completedRevenue,
      j.invoicedRevenue,
      j.collectedRevenue,
      j.status,
      j.sold,
      j.paidHoursTech,
      j.materials,
      j.subcontractors,
      j.sourceId,
      j.membershipSold,
      j.callback,
      j.isSample,
      csvEscape(j.externalId),
    ];
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function toExcelHtml(jobs: Job[]): string {
  const csv = exportJobsCsv(jobs);
  const rows = csv.split("\n").map((line) => {
    const cells = splitCsvLine(line);
    return `<tr>${cells.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`;
  });
  return `<html><head><meta charset="utf-8"></head><body><table>${rows.join("")}</table></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
