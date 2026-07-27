import Reveal from "./Reveal";

export default function SectionHeading({
  eyebrow,
  title,
  note,
}: {
  eyebrow?: string;
  title?: string;
  note?: string;
}) {
  return (
    <Reveal>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10 sm:mb-14 border-b border-[var(--line)] pb-6">
        <div>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          {title && (
            <h2 className="font-display text-4xl sm:text-6xl leading-none">
              {title}
            </h2>
          )}
        </div>
        {note && (
          <p className="font-mono text-xs sm:text-sm text-[var(--ink-dim)] max-w-xs text-right">
            {note}
          </p>
        )}
      </div>
    </Reveal>
  );
}
