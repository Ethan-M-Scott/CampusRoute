import { NextRequest, NextResponse } from "next/server";
import "@/config/mongodb";
import { auth } from "../../../../../auth";
import SavedStop from "../../../models/SavedStop";

// GET /api/stops/mine  -> list saved stops for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    // If no session, just return empty list (frontend already handles this)
    if (!session) {
      return NextResponse.json({ stops: [] }, { status: 200 });
    }

    const userId = session.user.id;

    const docs = await SavedStop.find({ userId }).lean();

    return NextResponse.json({
      stops: docs.map((d: any) => ({
        _id: d._id.toString(),
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

// POST /api/stops/mine  -> replace saved stops for current user
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
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

    // Filter out anything invalid
    const cleaned = stops.filter(
      (s) =>
        s &&
        typeof s.passioStopId === "string" &&
        s.passioStopId.length > 0 &&
        typeof s.stopName === "string" &&
        s.stopName.length > 0
    );

    // If list is empty, treat as "clear all stops"
    await SavedStop.deleteMany({ userId });

    if (cleaned.length > 0) {
      await SavedStop.insertMany(
        cleaned.map((s) => ({
          userId,
          passioStopId: s.passioStopId,
          stopName: s.stopName,
        }))
      );
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

// DELETE /api/stops/mine?id=<mongoId>  -> delete one saved stop
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id query parameter" },
        { status: 400 }
      );
    }

    await SavedStop.deleteOne({ _id: id, userId });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error deleting saved stop:", err);
    return NextResponse.json(
      { error: "Failed to delete saved stop" },
      { status: 500 }
    );
  }
}
