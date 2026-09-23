import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exam Host — synced college exams",
  description: "Teachers schedule papers, students solve on one clock. Auto-submit at 0:00.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
