// src/app/api/stops/all/route.ts
import { NextRequest, NextResponse } from "next/server";

const PASSIO_BACKEND_URL =
  process.env.PASSIO_BACKEND_URL ?? "http://127.0.0.1:5050";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const systemId = searchParams.get("system_id");

  if (!systemId) {
    return NextResponse.json({ stops: [] });
  }

  const url = `${PASSIO_BACKEND_URL}/stops/all?system_id=${encodeURIComponent(systemId)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error("Passio backend /stops/all failed:", res.status);
      return NextResponse.json(
        { error: "Failed to load stops" },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error calling Passio backend /stops/all:", err);
    return NextResponse.json(
      { error: "Failed to load stops" },
      { status: 500 }
    );
  }
}
