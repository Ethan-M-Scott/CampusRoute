// src/components/SavedStopsPanel.tsx
"use client";

// Polling panel that keeps saved stops fresh in the authenticated dashboard.
import { useEffect, useState } from "react";
import { Bus, Plus, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type StopRoute = {
  id: string;
  name: string;
  shortName?: string | null;
  serviceTime?: string | null;
  activeVehicles: number;
  status: string;
};

type StopDetails = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  routes: StopRoute[];
};

const POLL_MS = 30_000;

export default function SavedStopsPanel() {
  const router = useRouter();
  const [stops, setStops] = useState<StopDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    async function fetchStops() {
      try {
        setError(null);
        const res = await fetch("/api/stops/mine", {
          cache: "no-store",
        });

        if (res.status === 401) {
          setStops([]);
          setError("You must be signed in to save stops.");
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to load saved stops (${res.status})`);
        }

        const data = (await res.json()) as { stops: StopDetails[] };
        if (cancelled) return;
        setStops(data.stops || []);
      } catch (err) {
        console.error("Error loading saved stops:", err);
        if (!cancelled) setError("Failed to load saved stops.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStops();
    timer = setInterval(fetchStops, POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bus className="w-5 h-5 text-blue-600" />
          <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Saved Stops</h2>
        </div>
        <button
          onClick={() => router.push("/routes/new")}
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="Add saved stops"
        >
          <Plus className="w-4 h-4 text-blue-600" />
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Loading your saved stops…</p>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && stops.length === 0 && (
        <p className="text-sm text-gray-500">
          You haven&apos;t saved any stops yet. Click the + to choose your
          favorite stops.
        </p>
      )}

      {!loading && !error && stops.length > 0 && (
        <div className="space-y-3">
          {stops.map((stop) => {
            const topRoutes = (stop.routes || []).slice(0, 3);

            return (
              <div
                key={stop.id}
                className="bg-gray-100 p-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <p className="font-semibold">{stop.name}</p>

                {topRoutes.length === 0 && (
                  <p className="text-sm text-gray-600">
                    No buses currently reported for this stop.
                  </p>
                )}

                {topRoutes.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {topRoutes.map((r) => (
                      <li key={r.id}>
                        <span className="font-medium">
                          {r.shortName ? `${r.shortName} – ` : ""}
                          {r.name}
                        </span>
                        {": "}
                        {r.activeVehicles > 0
                          ? `${r.activeVehicles} bus${
                              r.activeVehicles > 1 ? "es" : ""
                            } currently on route`
                          : "No active buses right now"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && stops.length > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          Live data refreshes automatically every ~30 seconds.
        </p>
      )}
    </div>
  );
}
