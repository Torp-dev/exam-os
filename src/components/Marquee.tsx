const ITEMS = [
  "Fergusson College",
  "MIT Pune",
  "St. Xavier's",
  "Same second",
  "Auto-submit at zero",
  "Sanity powered",
];

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-y border-black/10 bg-white py-4">
      <div className="flex w-max animate-marquee items-center gap-10 pr-10">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            <span className="font-display text-sm font-bold uppercase tracking-[0.18em] text-zinc-800">
              {t}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-black/30" />
          </span>
        ))}
      </div>
    </div>
  );
}
