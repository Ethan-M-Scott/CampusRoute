// src/app/api/routes/nearby/route.ts
import { NextRequest, NextResponse } from "next/server";

// Proxies nearby-route lookups to the Python backend.
const PASSIO_BACKEND_URL =
  process.env.PASSIO_BACKEND_URL ?? "http://127.0.0.1:5050";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const systemId = searchParams.get("system_id");

  if (!systemId) {
    return NextResponse.json({ routes: [] });
  }

  const query = new URLSearchParams();
  query.set("system_id", systemId);
  if (lat) query.set("lat", lat);
  if (lng) query.set("lng", lng);

  const url =
    PASSIO_BACKEND_URL +
    "/routes/nearby" +
    (query.toString() ? `?${query.toString()}` : "");

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error("Passio backend /routes/nearby failed:", res.status);
      return NextResponse.json(
        { error: "Failed to load routes" },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error calling Passio backend /routes/nearby:", err);
    return NextResponse.json(
      { error: "Failed to load routes" },
      { status: 500 }
    );
  }
}
