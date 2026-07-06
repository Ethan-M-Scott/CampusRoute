import { NextRequest, NextResponse } from "next/server";

// Proxies system alert lookups to the Python backend.
const PASSIO_BACKEND_URL =
  process.env.PASSIO_BACKEND_URL ?? "http://127.0.0.1:5050";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const systemId = searchParams.get("system_id");

  if (!systemId) {
    return NextResponse.json({ alerts: [] });
  }

  try {
    const url = `${PASSIO_BACKEND_URL}/alerts?system_id=${encodeURIComponent(
      systemId
    )}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error("Passio backend /alerts failed:", res.status);
      return NextResponse.json(
        { error: "Failed to load system alerts" },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error calling Passio backend /alerts:", err);
    return NextResponse.json({ error: "Failed to load alerts" }, { status: 500 });
  }
}