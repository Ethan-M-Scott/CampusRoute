import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "../../../../../db";

// GET /api/stops/mine -> list saved stops for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ stops: [] }, { status: 200 });
    }

    const docs = await db.savedStop.findMany({
      where: { userId: session.user.id },
      orderBy: { passioStopId: "asc" },
    });

    return NextResponse.json({
      stops: docs.map((d) => ({
        _id: d.id,
        passioStopId: d.passioStopId,
        stopName: d.stopName,
      })),
    });
  } catch (err) {
    console.error("Error loading saved stops:", err);
    return NextResponse.json(
      { error: "Failed to load saved stops", stops: [] },
      { status: 500 }
    );
  }
}

// POST /api/stops/mine -> replace saved stops for current user
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body || !Array.isArray(body.stops)) {
      return NextResponse.json(
        { error: "Expected { stops: [...] }" },
        { status: 400 }
      );
    }

    const stops = body.stops as { passioStopId: string; stopName: string }[];

    const cleaned = stops.filter(
      (s) =>
        s &&
        typeof s.passioStopId === "string" &&
        s.passioStopId.length > 0 &&
        typeof s.stopName === "string" &&
        s.stopName.length > 0
    );

    await db.savedStop.deleteMany({
      where: { userId: session.user.id },
    });

    if (cleaned.length > 0) {
      await db.savedStop.createMany({
        data: cleaned.map((s) => ({
          userId: session.user.id,
          passioStopId: s.passioStopId,
          stopName: s.stopName,
        })),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error saving stops:", err);
    return NextResponse.json(
      { error: "Failed to save stops" },
      { status: 500 }
    );
  }
}

// DELETE /api/stops/mine?id=<mongoId> -> delete one saved stop
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id query parameter" },
        { status: 400 }
      );
    }

    await db.savedStop.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error deleting saved stop:", err);
    return NextResponse.json(
      { error: "Failed to delete saved stop" },
      { status: 500 }
    );
  }
}
