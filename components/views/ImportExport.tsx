"use client";

import { exportJobsCsv, importJobs, parseCsv, suggestMap, toExcelHtml, type ColumnMap } from "@/lib/csv";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Btn, Card } from "../ui";

const FIELDS: { key: keyof ColumnMap; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "customer", label: "Customer" },
  { key: "jobType", label: "Job type" },
  { key: "technician", label: "Technician" },
  { key: "estimatedRevenue", label: "Estimated revenue" },
  { key: "soldRevenue", label: "Sold revenue" },
  { key: "completedRevenue", label: "Completed revenue" },
  { key: "invoicedRevenue", label: "Invoiced revenue" },
  { key: "collectedRevenue", label: "Collected revenue" },
  { key: "status", label: "Status" },
  { key: "materials", label: "Materials" },
  { key: "subcontractors", label: "Subcontractors" },
  { key: "paidHours", label: "Paid hours" },
  { key: "source", label: "Lead source" },
  { key: "externalId", label: "Job / invoice ID" },
  { key: "category", label: "Category" },
];

export function ImportExportView() {
  const { state, setState } = useStore();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [map, setMap] = useState<ColumnMap>({});
  const [result, setResult] = useState<string>("");

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCsv(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMap(suggestMap(parsed.headers));
      setResult(`${parsed.rows.length} rows loaded. Map columns, then import. Duplicates are skipped by job ID or date+customer+amount.`);
    };
    reader.readAsText(file);
  }

  function download(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card title="CSV import — Podium FSM, Housecall Pro, QuickBooks">
        <p className="text-sm text-slate-600">
          Exports do not share one layout. Upload a CSV, map each column, then import. Existing jobs with the same external ID (or the same date, customer, and sold amount) are not imported twice.
        </p>
        <input
          className="mt-3 block text-sm"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        {headers.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="text-xs">
                <span className="mb-1 block text-slate-600">{f.label}</span>
                <select
                  className="w-full rounded border px-2 py-1"
                  value={map[f.key] ?? ""}
                  onChange={(e) => setMap({ ...map, [f.key]: e.target.value || undefined })}
                >
                  <option value="">— ignore —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}
        {rows.length > 0 ? (
          <div className="mt-3">
            <Btn
              onClick={() => {
                const { state: next, imported, skipped } = importJobs(state, rows, map);
                setState(next);
                setResult(`Imported ${imported} jobs. Skipped ${skipped} duplicates or rows without a date.`);
              }}
            >
              Import {rows.length} rows
            </Btn>
          </div>
        ) : null}
        {result ? <p className="mt-2 text-sm text-navy">{result}</p> : null}
      </Card>
      <Card title="Export">
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => download("1st-class-jobs.csv", exportJobsCsv(state.jobs), "text/csv")}>Download jobs CSV</Btn>
          <Btn
            tone="ghost"
            onClick={() => download("1st-class-jobs.xls", toExcelHtml(state.jobs), "application/vnd.ms-excel")}
          >
            Download Excel workbook
          </Btn>
          <Btn
            tone="ghost"
            onClick={() =>
              download("1st-class-command-center.json", JSON.stringify(state, null, 2), "application/json")
            }
          >
            Download full backup JSON
          </Btn>
        </div>
        <p className="mt-2 text-xs text-slate-500">{state.jobs.length} jobs on file. Sample jobs stay labeled isSample=true.</p>
      </Card>
    </div>
  );
}
