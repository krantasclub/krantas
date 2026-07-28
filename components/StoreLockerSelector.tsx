"use client";

import { useEffect, useState } from "react";

export type LockerPoint = {
  id: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
};

const INPUT_CLS =
  "w-full bg-transparent border-0 border-b border-[var(--line-strong)] text-[var(--ink)] py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--ink-dim)]";
const LABEL_CLS = "block font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ink-dim)] mb-1.5";

export default function StoreLockerSelector({
  value,
  onChange,
}: {
  value: LockerPoint | null;
  onChange: (point: LockerPoint | null) => void;
}) {
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState(false);

  const [city, setCity] = useState(value?.city ?? "");
  const [points, setPoints] = useState<LockerPoint[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsError, setPointsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCitiesLoading(true);
    setCitiesError(false);
    fetch("/api/dpd/pickup-points")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setCities(data.cities ?? []);
      })
      .catch(() => {
        if (!cancelled) setCitiesError(true);
      })
      .finally(() => {
        if (!cancelled) setCitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!city) {
      setPoints([]);
      return;
    }
    let cancelled = false;
    setPointsLoading(true);
    setPointsError(false);
    fetch(`/api/dpd/pickup-points?city=${encodeURIComponent(city)}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setPoints(data.points ?? []);
      })
      .catch(() => {
        if (!cancelled) setPointsError(true);
      })
      .finally(() => {
        if (!cancelled) setPointsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  return (
    <div className="mt-4">
      <label htmlFor="locker-city" className={LABEL_CLS}>
        City
      </label>
      <select
        id="locker-city"
        value={city}
        disabled={citiesLoading || cities.length === 0}
        onChange={(e) => {
          setCity(e.target.value);
          if (value) onChange(null);
        }}
        className={`${INPUT_CLS} bg-[var(--bg)] disabled:opacity-60`}
      >
        <option value="">{citiesLoading ? "Loading cities..." : "Choose a city"}</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {citiesError && <p className="mt-2 font-mono text-[11px] text-[#e5837f]">Couldn&apos;t load cities — try again.</p>}

      {city && pointsLoading && <p className="mt-2 font-mono text-[11px] text-[var(--ink-dim)]">Loading lockers...</p>}
      {city && pointsError && <p className="mt-2 font-mono text-[11px] text-[#e5837f]">Couldn&apos;t load lockers — try again.</p>}
      {city && !pointsLoading && !pointsError && points.length === 0 && (
        <p className="mt-2 font-mono text-[11px] text-[var(--ink-dim)]">No lockers found in {city}.</p>
      )}

      {points.length > 0 && !value && (
        <div className="mt-2">
          <p className={LABEL_CLS}>Choose a locker</p>
          <div className="max-h-56 divide-y divide-[var(--line)] overflow-y-auto border border-[var(--line-strong)]">
            {points.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(p)}
                className="block w-full px-3 py-2.5 text-left text-[12.5px] hover:bg-[var(--line)]/20"
              >
                <span className="block font-medium text-[var(--ink)]">{p.name}</span>
                <span className="block text-[var(--ink-dim)]">
                  {p.street}, {p.city} {p.postalCode}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {value && (
        <div className="mt-2 flex items-start justify-between gap-3 border border-[var(--accent)]/50 px-3 py-2.5">
          <div className="text-[12.5px]">
            <span className="block font-medium text-[var(--ink)]">{value.name}</span>
            <span className="block text-[var(--ink-dim)]">
              {value.street}, {value.city} {value.postalCode}
            </span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(null)}
              className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent)] underline underline-offset-2"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setCity("");
              }}
              aria-label="Remove"
              title="Remove"
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[13px] leading-none text-[var(--ink-dim)] hover:text-[var(--ink)]"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
