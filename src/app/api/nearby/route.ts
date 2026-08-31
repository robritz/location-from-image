import { NextResponse } from "next/server";

type MapboxFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
    coordinates?: { latitude?: number; longitude?: number };
  };
};

export type Business = {
  name: string;
  address: string;
};

// Maximum search radius: 100 feet in meters.
const MAX_DISTANCE_METERS = 100 * 0.3048;

// Mapbox canonical category IDs for businesses that sell food
// (excludes grocery stores and supermarkets).
const FOOD_CATEGORIES = ["food_and_drink"];

// Haversine distance in meters between two [lon, lat] points.
function distanceMeters(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function featureCoords(
  feature: MapboxFeature,
): { lat: number; lon: number } | null {
  const coords = feature.properties?.coordinates;
  if (typeof coords?.latitude === "number" && typeof coords?.longitude === "number") {
    return { lat: coords.latitude, lon: coords.longitude };
  }
  const geo = feature.geometry?.coordinates;
  if (Array.isArray(geo) && geo.length === 2) {
    return { lat: geo[1], lon: geo[0] };
  }
  return null;
}

export async function GET(request: Request) {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Mapbox token is not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
    return NextResponse.json(
      { error: "Valid 'lat' and 'lon' query parameters are required." },
      { status: 400 },
    );
  }

  const origin = { lat: Number(lat), lon: Number(lon) };

  // Query each food category near the point in parallel.
  const responses = await Promise.all(
    FOOD_CATEGORIES.map(async (category) => {
      const url = new URL(
        `https://api.mapbox.com/search/searchbox/v1/category/${category}`,
      );
      url.searchParams.set("proximity", `${lon},${lat}`);
      url.searchParams.set("limit", "10");
      url.searchParams.set("access_token", token);

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [] as MapboxFeature[];
      const data = (await res.json()) as { features?: MapboxFeature[] };
      return data.features ?? [];
    }),
  );

  // Merge, dedupe, sort by distance, keep the closest five.
  const seen = new Set<string>();
  const businesses: Business[] = responses
    .flat()
    .map((feature) => {
      const coords = featureCoords(feature);
      return {
        name: feature.properties?.name ?? "Unknown",
        address:
          feature.properties?.full_address ??
          feature.properties?.place_formatted ??
          "",
        distance: coords ? distanceMeters(origin, coords) : Infinity,
      };
    })
    .filter((b) => b.distance <= MAX_DISTANCE_METERS)
    .sort((a, b) => a.distance - b.distance)
    .filter((b) => {
      const key = `${b.name}|${b.address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5)
    .map(({ name, address }) => ({ name, address }));

  return NextResponse.json({ businesses });
}
