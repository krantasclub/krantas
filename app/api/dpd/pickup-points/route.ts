import { NextRequest, NextResponse } from "next/server";
import { getPickupCities, getPickupPoints } from "@/lib/dpd/pickupPoints";

// GET /api/dpd/pickup-points              -> { cities: string[] }
// GET /api/dpd/pickup-points?city=Vilnius -> { points: PickupPoint[] }
//
// Used by components/StoreOrderModal.tsx for the "DPD parcel locker"
// delivery option. Lithuania only — Krantas doesn't ship abroad.
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim() || undefined;

  try {
    if (!city) {
      const cities = getPickupCities();
      return NextResponse.json(
        { cities },
        { headers: { "Cache-Control": "public, max-age=3600" } } // static data, safe to cache
      );
    }

    const points = getPickupPoints(city);
    return NextResponse.json(
      { points },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (err) {
    console.error("DPD pickup points error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "pickup_points_failed", cities: [], points: [] },
      { status: 500 }
    );
  }
}
