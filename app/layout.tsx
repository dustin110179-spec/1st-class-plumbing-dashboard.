import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1st Class Plumbing — Business Command Center",
  description: "A Different Kind of Service. Live operating dashboard for 1st Class Plumbing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
