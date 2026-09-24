"use client";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".hero-line",
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: "power3.out" }
      );
      gsap.fromTo(
        ".hero-bg",
        { scale: 1.12 },
        { scale: 1.0, duration: 2.2, ease: "power2.out" }
      );
    },
    { scope: root }
  );

  return (
    <header ref={root} className="grain relative overflow-hidden bg-ink text-white">
      <div className="hero-bg absolute inset-0">
        <img
          src="https://picsum.photos/seed/examhall/1920/1080"
          alt=""
          className="h-full w-full object-cover opacity-40 grayscale contrast-125"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,11,0.55)_55%,#0A0A0B_100%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-40 pt-48 text-center md:pb-56 md:pt-64">
        <h1 className="hero-h1 font-display w-full max-w-5xl font-extrabold text-balance">
          <span className="hero-line block">
            An exam hosting
          </span>
          <span className="hero-line block">
            platform powered
          </span>
          <span className="hero-line block">by Sanity.</span>
        </h1>

        <p className="hero-line mt-6 w-full max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
          Teachers publish once in Sanity. Students open the paper on any campus PC,
          write against one shared timer, and get auto-submitted at zero.
        </p>

        <div className="hero-line mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="#papers"
            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            View live papers
          </Link>
          <Link
            href="/results"
            className="rounded-full bg-red-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Check exam results
          </Link>
          <Link
            href="#notices"
            className="rounded-full bg-amber-300 px-7 py-3 text-sm font-semibold text-black transition hover:bg-amber-200"
          >
            View Notice
          </Link>
        </div>
      </div>
    </header>
  );
}
