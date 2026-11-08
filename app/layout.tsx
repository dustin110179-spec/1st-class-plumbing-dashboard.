import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1st Class Plumbing — 2027 Budget & Profit Command Center",
  description: "A Different Kind of Service. 2027 financial operating system for 1st Class Plumbing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
