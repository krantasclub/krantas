export default function Marquee({ text }: { text: string }) {
  const items = new Array(8).fill(text);
  return (
    <div className="sticky top-16 sm:top-20 z-40 bg-[var(--accent)] text-[#12100c] overflow-hidden border-y border-[#12100c]/20">
      <div className="marquee-track py-2.5 sm:py-3">
        {[...items, ...items].map((t, i) => (
          <span
            key={i}
            className="font-mono text-xs sm:text-sm tracking-[0.16em] uppercase whitespace-nowrap px-4 sm:px-6 flex items-center gap-4 sm:gap-6"
          >
            {t}
            <span aria-hidden>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
