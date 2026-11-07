"use client";

export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt="1st Class Plumbing"
      className={className}
    />
  );
}
