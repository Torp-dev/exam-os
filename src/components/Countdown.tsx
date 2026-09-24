"use client";
import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/exams";

export default function Countdown({ targetISO, prefix = "" }: { targetISO: string; prefix?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(targetISO).getTime() - now;
  // Far-future targets (e.g. a 2030 closeAt) read as a date, not "1194d 14:06:42".
  if (ms > 30 * 86400_000) {
    return (
      <span className="font-semibold tabular-nums" suppressHydrationWarning>
        {prefix}{new Date(targetISO).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
      </span>
    );
  }
  return (
    <span className="font-mono font-semibold tabular-nums" suppressHydrationWarning>
      {prefix}{formatCountdown(ms)}
    </span>
  );
}
