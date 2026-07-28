// Server-only. DPD parcel-locker ("paštomatas") network in Lithuania,
// for the Krantas merch store's DPD locker delivery option.
//
// Sweetnet supplied a static countrywide export of DPD's Lithuanian
// locker network — served here as a static dataset rather than a live
// DPD API call. Krantas only ships within Lithuania, so this is LT-only
// (unlike the Baltic-wide version used by shop.sweetnet.lt).

import pickupPointsData from "./pickupPointsData.json";

export type PickupPoint = {
  id: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
};

const ALL_POINTS: PickupPoint[] = pickupPointsData as PickupPoint[];

/** All Lithuanian cities/towns that have at least one DPD parcel locker. */
export function getPickupCities(): string[] {
  const cities = new Set<string>();
  for (const p of ALL_POINTS) cities.add(p.city);
  return Array.from(cities).sort((a, b) => a.localeCompare(b, "lt"));
}

/** DPD parcel-locker points, optionally narrowed to one city. */
export function getPickupPoints(city?: string): PickupPoint[] {
  const cityLower = city?.trim().toLowerCase();
  if (!cityLower) return ALL_POINTS;
  return ALL_POINTS.filter((p) => p.city.toLowerCase() === cityLower);
}

export function findPickupPoint(id: string): PickupPoint | undefined {
  return ALL_POINTS.find((p) => p.id === id);
}

/** One-line formatted address, stored on the order (e.g. in shipping_address). */
export function formatPickupPoint(p: PickupPoint): string {
  return `DPD paštomatas — ${p.name}, ${p.street}, ${p.city} ${p.postalCode}`;
}
