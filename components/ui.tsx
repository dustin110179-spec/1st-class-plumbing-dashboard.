"use client";

import { clamp, money, parseNumber, pct } from "@/lib/format";
import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  sub,
  tone = "neutral",
  forecast,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "green" | "red" | "yellow" | "navy";
  forecast?: boolean;
}) {
  const bar =
    tone === "green"
      ? "bg-profit"
      : tone === "red"
        ? "bg-brand-red"
        : tone === "yellow"
          ? "bg-brand-yellow"
          : tone === "navy"
            ? "bg-navy"
            : "bg-navy-100";
  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-4 shadow-card">
      <div className={`absolute inset-y-0 left-0 w-1.5 ${bar}`} />
      <div className="flex items-start justify-between gap-2 pl-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700">{label}</p>
        {forecast ? (
          <span className="rounded bg-navy-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-700">
            Forecast
          </span>
        ) : null}
      </div>
      <p className="mt-1 pl-2 text-2xl font-semibold tabular tracking-tight text-navy">{value}</p>
      {sub ? <p className="mt-1 pl-2 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl bg-white p-4 shadow-card ${className}`}>
      {title ? (
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">{title}</h2>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  money: asMoney,
  percent,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  money?: boolean;
  percent?: boolean;
}) {
  const display = percent ? Number((value * 100).toFixed(2)) : value;
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <span className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-navy">
        {prefix || asMoney ? <span className="pl-2 text-sm text-slate-500">{prefix ?? "$"}</span> : null}
        <input
          className="w-full bg-transparent px-2 py-2 text-sm tabular outline-none"
          type="number"
          value={Number.isFinite(display) ? display : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = parseNumber(e.target.value);
            const next = percent ? n / 100 : n;
            const clamped = clamp(next, min ?? -1e12, max ?? 1e12);
            onChange(percent && min != null ? Math.max(min, clamped) : clamped);
          }}
        />
        {suffix || percent ? <span className="pr-2 text-sm text-slate-500">{suffix ?? "%"}</span> : null}
      </span>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-navy"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (n: number) => string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span className="tabular text-navy">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        className="w-full accent-navy"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <select
        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-navy"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProgressBar({
  value,
  max,
  tone = "navy",
}: {
  value: number;
  max: number;
  tone?: "navy" | "green" | "red" | "yellow";
}) {
  const pctV = max <= 0 ? 0 : clamp((value / max) * 100, 0, 100);
  const color =
    tone === "green"
      ? "bg-profit"
      : tone === "red"
        ? "bg-brand-red"
        : tone === "yellow"
          ? "bg-brand-yellow"
          : "bg-navy";
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full ${color}`} style={{ width: `${pctV}%` }} />
    </div>
  );
}

export function Gauge({
  value,
  min = 0,
  max = 1,
  label,
  goodHigh = true,
}: {
  value: number;
  min?: number;
  max?: number;
  label: string;
  goodHigh?: boolean;
}) {
  const t = clamp((value - min) / (max - min || 1), 0, 1);
  const angle = -90 + t * 180;
  const good = goodHigh ? t >= 0.66 : t <= 0.33;
  const mid = goodHigh ? t >= 0.4 : t <= 0.6;
  const color = good ? "#147A3F" : mid ? "#C9A227" : "#C12216";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="h-16 w-28">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#E8EEF4" strokeWidth="10" />
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${t * 157} 157`}
        />
        <line
          x1="60"
          y1="60"
          x2={60 + 40 * Math.cos((angle * Math.PI) / 180)}
          y2={60 + 40 * Math.sin((angle * Math.PI) / 180)}
          stroke="#0A2540"
          strokeWidth="2"
        />
      </svg>
      <p className="text-sm font-semibold tabular text-navy">{pct(value)}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

export function StatusBanner({
  status,
  label,
}: {
  status: "red" | "yellow" | "green";
  label: string;
}) {
  const cls =
    status === "green"
      ? "bg-profit text-white"
      : status === "yellow"
        ? "bg-brand-yellow text-navy"
        : "bg-brand-red text-white";
  const word = status === "green" ? "ON TRACK" : status === "yellow" ? "BREAK-EVEN ONLY" : "BELOW BREAK-EVEN";
  return (
    <div className={`rounded-xl px-5 py-4 ${cls}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em]">{word}</p>
      <p className="mt-1 text-lg font-semibold leading-snug">{label}</p>
    </div>
  );
}

export function Tone({
  children,
  good,
}: {
  children: ReactNode;
  good: boolean | null;
}) {
  const cls = good == null ? "text-navy" : good ? "text-profit" : "text-brand-red";
  return <span className={cls}>{children}</span>;
}

export function SampleBanner({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <div className="rounded-lg border border-brand-yellow bg-[#FFF8D1] px-3 py-2 text-sm text-navy">
      <strong>SAMPLE DATA</strong> — these numbers are for demonstration only and are not actual 1st Class Plumbing performance.
    </div>
  );
}

export function Missing({ items }: { items: { field: string; reason: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-paper px-3 py-2 text-xs text-slate-600">
      <p className="font-semibold text-navy">Information needed for a more accurate result</p>
      <ul className="mt-1 list-disc pl-4">
        {items.map((m) => (
          <li key={m.field}>{m.reason}</li>
        ))}
      </ul>
    </div>
  );
}

export function Btn({
  children,
  onClick,
  tone = "navy",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "navy" | "red" | "ghost";
  type?: "button" | "submit";
}) {
  const cls =
    tone === "red"
      ? "bg-brand-red text-white"
      : tone === "ghost"
        ? "bg-white text-navy border border-slate-200"
        : "bg-navy text-white";
  return (
    <button type={type} onClick={onClick} className={`rounded-lg px-3 py-2 text-sm font-medium ${cls}`}>
      {children}
    </button>
  );
}

export function moneyOrDash(n: number | null | undefined) {
  return money(n);
}
