import { NextResponse } from "next/server";

type MapboxFeature = {
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

  const url = new URL("https://api.mapbox.com/search/searchbox/v1/reverse");
  url.searchParams.set("longitude", lon);
  url.searchParams.set("latitude", lat);
  url.searchParams.set("types", "poi");
  url.searchParams.set("limit", "5");
  url.searchParams.set("access_token", token);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch data from Mapbox." },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { features?: MapboxFeature[] };
  const businesses: Business[] = (data.features ?? []).map((feature) => ({
    name: feature.properties?.name ?? "Unknown",
    address:
      feature.properties?.full_address ??
      feature.properties?.place_formatted ??
      "",
  }));

  return NextResponse.json({ businesses });
}
