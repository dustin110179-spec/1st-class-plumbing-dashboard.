"use client";

export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="1st Class Plumbing — A Different Kind of Service"
      className={className}
    />
  );
}
