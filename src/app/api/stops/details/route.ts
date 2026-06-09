import { NextRequest, NextResponse } from "next/server";

const PASSIO_BACKEND_URL = process.env.PASSIO_BACKEND_URL ?? "http://127.0.0.1:5050";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");
  const systemId = searchParams.get("system_id");

  if (!ids || !systemId) {
    return NextResponse.json({ stops: [] });
  }

  try {
    const url = `${PASSIO_BACKEND_URL}/stops/details?ids=${encodeURIComponent(
      ids
    )}&system_id=${encodeURIComponent(systemId)}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error("Passio backend error", res.status, await res.text());
      return NextResponse.json(
        { error: "Failed to load stop details from backend" },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error in /api/stops/details", err);
    return NextResponse.json(
      { error: "Internal error while loading stop details" },
      { status: 500 }
    );
  }
}
