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
  return (
    <span className="font-mono font-semibold tabular-nums" suppressHydrationWarning>
      {prefix}{formatCountdown(ms)}
    </span>
  );
}
