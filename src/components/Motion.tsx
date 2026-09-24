"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function ScrubReveal({ text }: { text: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const words = gsap.utils.toArray<HTMLElement>(".scrub-word");
      gsap.fromTo(
        words,
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.06,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 80%",
            end: "bottom 45%",
            scrub: true,
          },
        }
      );
    },
    { scope: root }
  );

  return (
    <div ref={root} className="mx-auto w-full max-w-4xl px-4">
      <p className="font-display text-center text-2xl font-bold leading-snug md:text-4xl md:leading-tight">
        {text.split(" ").map((w, i) => (
          <span key={i} className="scrub-word mr-[0.28em] inline-block">
            {w}
          </span>
        ))}
      </p>
    </div>
  );
}

export function ScaleImage({
  seed,
  caption,
}: {
  seed: string;
  caption: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".scale-img",
        { scale: 0.82, opacity: 0.4 },
        {
          scale: 1.0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 90%",
            end: "center 45%",
            scrub: true,
          },
        }
      );
    },
    { scope: root }
  );

  return (
    <div ref={root} className="group mx-auto w-full max-w-5xl px-4">
      <div className="overflow-hidden rounded-3xl">
        <img
          src={`https://picsum.photos/seed/${seed}/1600/900`}
          alt={caption}
          className="scale-img aspect-[16/9] w-full object-cover grayscale contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <p className="mt-3 text-center text-sm text-zinc-500">{caption}</p>
    </div>
  );
}
