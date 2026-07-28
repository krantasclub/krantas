export default function WaveDivider({
  flip = false,
  fill = "var(--bg)",
  className = "",
}: {
  flip?: boolean;
  fill?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none w-full leading-[0] ${flip ? "rotate-180" : ""} ${className}`}
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="w-full h-[54px] sm:h-[84px] block" aria-hidden="true">
        <path
          d="M0,40 C120,10 220,72 340,52 C460,32 520,4 640,26 C760,48 820,78 940,58 C1060,38 1120,8 1240,24 C1330,36 1390,54 1440,44 L1440,90 L0,90 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
