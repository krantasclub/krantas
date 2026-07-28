import Image from "next/image";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const PHOTOS = [
  { id: "photo-1", src: "/location/photo-1.webp", rotate: -3 },
  { id: "photo-2", src: "/location/photo-2.webp", rotate: 2 },
  { id: "map", src: "/location/map.webp", rotate: -2 },
  { id: "directions", src: "/location/directions.webp", rotate: 3 },
];

export default function LocationSection() {
  return (
    <section id="location" className="relative bg-[var(--bg)] px-5 sm:px-8 py-20 sm:py-28 border-t border-[var(--line)]">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeading note="How to find us" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 place-items-center">
          {PHOTOS.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <div
                className="relative w-full aspect-[3/4] max-w-[260px] overflow-hidden border border-[var(--line)] shadow-[0_14px_34px_rgba(0,0,0,0.5)]"
                style={{ transform: `rotate(${p.rotate}deg)` }}
              >
                <Image
                  src={p.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, 260px"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
