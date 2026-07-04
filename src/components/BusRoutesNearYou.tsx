// src/components/BusRoutesNearYou.tsx
"use client";

// Dashboard card that polls nearby Passio routes and live stop proximity.
import { useEffect, useState } from "react";
import { Bus, MapPin, AlertCircle } from "lucide-react";

type NearbyRoute = {
  id: string;
  name: string;
  shortName?: string | null;
  serviceTime?: string | null;
  activeVehicles: number;
  status: string;
  nearestStopName?: string | null;
  nearestStopDistanceMiles?: number | null;
};

type NearbyStop = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number;
  distanceMiles: number;
  routes: NearbyRoute[];
};

type NearbyResponse = {
  routes: NearbyRoute[];
  stops?: NearbyStop[];
};

const POLL_MS = 30_000;

function formatMiles(miles?: number | null): string | null {
  if (miles == null) return null;
  if (miles < 0.1) return "< 0.1 mi";
  return `${miles.toFixed(1)} mi`;
}

export default function BusRoutesNearYou() {
  const [routes, setRoutes] = useState<NearbyRoute[]>([]);
  const [hasNearbyStops, setHasNearbyStops] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    async function fetchRoutes(lat?: number, lng?: number) {
      try {
        setError(null);

        const params =
          lat != null && lng != null ? `?lat=${lat}&lng=${lng}` : "";
        const res = await fetch(`/api/routes/nearby${params}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load routes (${res.status})`);
        }

        const data = (await res.json()) as NearbyResponse;
        if (cancelled) return;

        setRoutes(data.routes || []);
        setHasNearbyStops(Boolean(data.stops && data.stops.length > 0));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Failed to load routes");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    function setupPolling(lat?: number, lng?: number) {
      fetchRoutes(lat, lng);
      timer = setInterval(() => fetchRoutes(lat, lng), POLL_MS);
    }

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationEnabled(false);
      setupPolling();
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setLocationEnabled(true);
          const { latitude, longitude } = pos.coords;
          setupPolling(latitude, longitude);
        },
        () => {
          if (cancelled) return;
          setLocationEnabled(false);
          setupPolling();
        }
      );
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bus className="w-5 h-5 text-blue-600" />
        <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Bus Routes Near You</h2>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Loading live route information…</p>
      )}

      {!loading && error && (
        <p className="text-sm text-blue-600">Failed to load routes.</p>
      )}

      {!loading && !error && routes.length === 0 && (
        <p className="text-sm text-gray-500">No routes available.</p>
      )}

      {!loading && !error && routes.length > 0 && (
        <div className="space-y-3 mb-4">
          {routes.map((route) => {
            const hasNearest = !!route.nearestStopName;
            const miles = formatMiles(route.nearestStopDistanceMiles);

            return (
              <div
                key={route.id}
                className="bg-gray-100 p-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <p className="font-semibold">
                  {route.name}
                  {route.shortName ? ` (${route.shortName})` : ""}
                </p>
                <p className="text-sm text-gray-700">{route.status}</p>
                <p className="text-sm text-gray-500">
                  Active buses: {route.activeVehicles}
                </p>
                {hasNearest && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span>
                      Nearest stop: {route.nearestStopName}
                      {miles && ` • ${miles} away`}
                    </span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Location hint */}
      {!loading && !error && (
        <div className="flex items-start gap-2 text-xs text-gray-600 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <p>
            {locationEnabled === false
              ? "Location is disabled or denied. Showing all UGA routes instead."
              : hasNearbyStops
              ? "Showing routes that go through stops near your current location."
              : "No nearby stops found within ~1 mile. Showing all UGA routes instead."}
          </p>
        </div>
      )}
    </div>
  );
}
