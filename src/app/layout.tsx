import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exam Host — synced college exams",
  description: "Teachers schedule papers, students solve on one clock. Auto-submit at 0:00.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-paper font-body text-ink">
        {children}
      </body>
    </html>
  );
}
