import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nediv — Donor & Shul Management",
  description: "Donor CRM, payments, pledges, seats, and reporting for community organizations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
