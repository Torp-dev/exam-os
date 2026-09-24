"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        className={`flex w-full max-w-3xl items-center justify-between rounded-full border px-5 py-2.5 backdrop-blur-xl transition-all duration-500 ${
          scrolled
            ? "border-black/10 bg-white/85 shadow-lg shadow-black/5"
            : "border-white/15 bg-black/40 shadow-none"
        }`}
      >
        <Link
          href="/"
          className={`font-display text-sm font-extrabold tracking-tight ${
            scrolled ? "text-ink" : "text-white"
          }`}
        >
          Exam Host
        </Link>
        <div
          className={`hidden items-center gap-6 text-sm font-medium md:flex ${
            scrolled ? "text-zinc-600" : "text-white/70"
          }`}
        >
          <Link href="/#papers" className="transition hover:text-current hover:opacity-100">
            View live papers
          </Link>
          <Link href="/results" className="transition hover:text-current hover:opacity-100">
            Check exam results
          </Link>
          <Link href="/#notices" className="transition hover:text-current hover:opacity-100">
            View Notice
          </Link>
        </div>
        <Link
          href="/#papers"
          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Enter hall
        </Link>
      </nav>
    </div>
  );
}
