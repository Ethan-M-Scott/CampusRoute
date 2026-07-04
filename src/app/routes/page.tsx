"use client";
import { useSession } from "@/lib/auth-client"
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { MapPin, Bus, User, LogOut, Plus, Trash2, AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAppState } from '@/src/components/AppStateContext';
import { SCHOOLS } from '@/src/data/schools';

type SystemAlert = {
  id: string;
  header: string;
  description: string;
  dateTimeCreated: string;
  routeId: string | null;
  important: boolean;
};

type SavedStopRecord = {
  _id: string;
  passioStopId: string;
  stopName: string;
};

type ApiRoute = {
  id: string;
  name: string;
  shortName?: string | null;
  serviceTime?: string | null;
  activeVehicles: number;
  status: string;
  nextStopName?: string | null;
  nextStopEtaMinutes?: number | null;
  closestBusDistanceMiles?: number | null;
  arrivalEtaMinutes?: number | null;
};

type ApiStop = {
  id: string;
  name: string;
  distanceMiles?: number | null;
  routes: ApiRoute[];
};

type NearbyResponse = {
  routes?: ApiRoute[];
  stops?: ApiStop[];
};

type NearbyRoute = ApiRoute & { nearestDistanceMiles?: number };

type StopDetail = {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  routes: ApiRoute[];
};

type SystemInfo = {
  id?: number;
  name?: string | null;
  username?: string | null;
  goAgencyName?: string | null;
};

// HELPER FUNCTIONS 

function formatRouteStatus(route: ApiRoute, distanceMiles?: number | null) {
  if (route.nextStopName && route.nextStopEtaMinutes != null) {
    const etaPart = `Next stop: ${route.nextStopName} in ${route.nextStopEtaMinutes} min`;
    if (distanceMiles != null) {
      return `${distanceMiles.toFixed(2)} miles away — ${etaPart}`;
    }
    return etaPart;
  }

  if (distanceMiles != null) {
    return `${distanceMiles.toFixed(2)} miles away — ${route.status}`;
  }

  return route.status;
}

/**
 * Haversine helper (approx) in miles.
 */
function SavedStopCard({
  stop,
  detail,
  onDelete,
}: {
  stop: SavedStopRecord;
  detail?: StopDetail;
  onDelete: (id: string) => void;
}) {
  const routes = detail?.routes || [];

  // Only show routes that currently have active vehicles.
  const activeRoutes = (routes || []).filter((r) => r.activeVehicles > 0);

  return (
    <div className="bg-gray-100 p-4 rounded-lg relative group hover:bg-gray-200 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-semibold">{stop.stopName}</p>

          {activeRoutes.length === 0 ? (
            <p className="text-gray-600 text-sm mt-1">
              No active buses currently for this stop.
            </p>
          ) : (
            <div className="mt-2 space-y-1 text-sm text-gray-700">
              {activeRoutes.map((r) => {
                const label = r.shortName
                  ? `${r.name} (${r.shortName})`
                  : r.name;
                return (
                  <div key={getRouteKey(r)}>
                    <p>{label}</p>
                    {/* Show the next stop first so the user can see where the bus is headed. */}
                    <p className="text-xs text-gray-500">
                      {r.nextStopName
                        ? r.nextStopEtaMinutes != null
                          ? `Next stop: ${r.nextStopName} in ${r.nextStopEtaMinutes} min`
                          : `Next stop: ${r.nextStopName}`
                        : "Next stop unavailable"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.closestBusDistanceMiles != null
                        ? `Closest bus: ${r.closestBusDistanceMiles.toFixed(2)} miles from this stop`
                        : "Closest bus distance unavailable"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.arrivalEtaMinutes != null
                        ? `Estimated arrival: about ${r.arrivalEtaMinutes} min`
                        : "Arrival estimate unavailable"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Active buses: {r.activeVehicles}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(stop._id)}
          className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function getAlertColor(isImportant: boolean): { bg: string; border: string; text: string; dot: string; } {
    if (isImportant) {
        return {
            bg: 'bg-blue-100',
            border: 'border-blue-300',
            text: 'text-blue-800',
            dot: 'bg-blue-600',
        };
    }
    // Default to yellow for non-critical informational alerts
    return {
        bg: 'bg-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        dot: 'bg-yellow-600',
    };
}

function getRouteKey(route: { id: string; name?: string | null; shortName?: string | null; status?: string | null }) {
  // Passio can reuse the same route ID for different route variants, so mix in other fields.
  return [route.id, route.shortName || "", route.name || "", route.status || ""].join("|");
}

export default function RoutesPage() {
  const router = useRouter();

  const onAddRoute = useCallback(() => router.push("/routes/new"), [router]);
  const onLogout = useCallback(async() => {
    await signOut();
    router.push('/');
  }, [router]);

  const { 
        data: session, // auth session info
        isPending, //loading state
    } = useSession();

  // Redirect to unauthenticated home page if not logged in
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/');
    }
  }, [session, isPending, router]);

  const [savedStops, setSavedStops] = useState<SavedStopRecord[]>([]);
  const [stopDetails, setStopDetails] = useState<Record<string, StopDetail>>(
    {}
  );
  
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const [nearbyRoutes, setNearbyRoutes] = useState<NearbyRoute[]>([]);
  const [allRoutes, setAllRoutes] = useState<ApiRoute[]>([]);
  const [usedLocation, setUsedLocation] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [loadingAllRoutes, setLoadingAllRoutes] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  const { selectedSchool, setSelectedSchool } = useAppState();
  const defaultSchool = SCHOOLS.find(s => s.id === "uga") || SCHOOLS[0];
  const sessionSchool = session?.user?.school ? SCHOOLS.find(s => s.id === session.user.school) : null;
  const resolvedSchool = sessionSchool || selectedSchool || defaultSchool;
  const schoolPassioId = resolvedSchool.passioId;
  const schoolName = resolvedSchool.name;
  const schoolLatitude = resolvedSchool.latitude;
  const schoolLongitude = resolvedSchool.longitude;

  // Load user's school from session
  useEffect(() => {
    if (session?.user && session.user.school) {
      const sessionSchool = SCHOOLS.find(s => s.id === session.user.school);
      if (sessionSchool) {
        setSelectedSchool(sessionSchool);
      }
    }
  }, [session, setSelectedSchool]);

  useEffect(() => {
    let isMounted = true;

    const loadSystemInfo = async () => {
      if (isPending || !schoolPassioId) {
        if (isMounted) setSystemInfo(null);
        return;
      }

      try {
        const res = await fetch(`/api/systems/details?system_id=${schoolPassioId}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: SystemInfo = await res.json();
        if (isMounted) setSystemInfo(data);
      } catch (err) {
        console.error("Failed to load system metadata", err);
        if (isMounted) setSystemInfo(null);
      }
    };

    loadSystemInfo();
    return () => {
      isMounted = false;
    };
  }, [isPending, schoolPassioId]);

  useEffect(() => {
    let isMounted = true;
    const loadAlerts = async () => {
      if (isPending || !schoolPassioId) {
        if (isMounted) setLoadingAlerts(false);
        return;
      }

      try {
        // Fetching from the explicit FastAPI URL
        const res = await fetch(`http://127.0.0.1:5050/alerts?system_id=${schoolPassioId}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) setAlerts(data.alerts || []);
      } catch (err) {
        console.error("Failed to load system alerts:", err);
        if (isMounted) setAlerts([]);
      } finally {
        if (isMounted) setLoadingAlerts(false);
      }
    };
    loadAlerts();
    return () => { isMounted = false; };
  }, [isPending, schoolPassioId]);
  // --------------------
  
  // Load saved stops from DB
  useEffect(() => {
    let isMounted = true;
    const loadSavedStops = async () => {
      try {
        const res = await fetch("/api/stops/mine");
        if (res.status === 401) {
          if (isMounted) setSavedStops([]);
          return;
        }
        const data = await res.json();
        if (isMounted) setSavedStops(data.stops || []);
      } catch (err) {
        console.error("Failed to load saved stops", err);
      } finally {
        if (isMounted) setLoadingSaved(false);
      }
    };

    loadSavedStops();
    return () => { isMounted = false; };
  }, []);

  // Load details for saved stops (including lat/lng and routes)
  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (savedStops.length === 0) {
        setStopDetails({});
        return;
      }
      const ids = savedStops.map((s) => s.passioStopId).join(",");
      try {
        const res = await fetch(
          `/api/stops/details?ids=${encodeURIComponent(ids)}&system_id=${schoolPassioId}`
        );
        const data = await res.json();
        const map: Record<string, StopDetail> = {};
        for (const st of data.stops || []) {
          map[st.id] = {
            id: st.id,
            name: st.name,
            latitude: st.latitude,
            longitude: st.longitude,
            routes: st.routes || [],
          };
        }
        if (isMounted) setStopDetails(map);
      } catch (err) {
        console.error("Failed to load stop details", err);
        if (isMounted) setStopDetails({});
      }
    };

    if (!isPending && schoolPassioId) fetchDetails();
    return () => { isMounted = false; };
  }, [isPending, savedStops, schoolPassioId]);

  // Always load full list of routes
  useEffect(() => {
    let isMounted = true;
    const loadAllRoutes = async () => {
      setLoadingAllRoutes(true);
      try {
        const res = await fetch(`/api/routes/nearby?system_id=${schoolPassioId}`);
        if (!res.ok) throw new Error("Failed to load routes");
        const data: NearbyResponse = await res.json();
        if (isMounted) setAllRoutes(data.routes || []);
      } catch (err) {
        console.warn("Error loading all routes:", err);
        if (isMounted) setAllRoutes([]);
      } finally {
        if (isMounted) setLoadingAllRoutes(false);
      }
    };

    if (!isPending && schoolPassioId) loadAllRoutes();
    return () => { isMounted = false; };
  }, [isPending, schoolPassioId]);

  // Nearby routes via geolocation
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator) || isPending || !schoolPassioId) {
      return;
    }

    let isMounted = true;
    setLoadingNearby(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!isMounted) return;
        try {
          const { latitude, longitude } = pos.coords;

          const res = await fetch(
            `/api/routes/nearby?lat=${latitude}&lng=${longitude}&system_id=${schoolPassioId}`
          );
          if (!res.ok) throw new Error("Failed to load nearby routes");
          const data: NearbyResponse = await res.json();

          const stops = data.stops || [];
          const map = new Map<string, NearbyRoute>();

          for (const stop of stops) {
            const d = stop.distanceMiles ?? null;
            for (const r of stop.routes || []) {
              const existing = map.get(r.id);
              if (!existing) {
                map.set(r.id, {
                  ...r,
                  nearestDistanceMiles: d ?? undefined,
                });
              } else if (
                d != null &&
                (existing.nearestDistanceMiles == null ||
                  d < existing.nearestDistanceMiles)
              ) {
                existing.nearestDistanceMiles = d;
              }
            }
          }

          const routesArr = Array.from(map.values());
          if (isMounted) {
            setNearbyRoutes(routesArr);
            setUsedLocation(true);
          }
        } catch (err) {
          console.warn("Error loading nearby routes:", err);
          if (isMounted) {
            setUsedLocation(false);
            setNearbyRoutes([]);
          }
        } finally {
          if (isMounted) setLoadingNearby(false);
        }
      },
      (err) => {
        console.warn("User denied/failed geolocation:", err);
        if (isMounted) {
          setUsedLocation(false);
          setNearbyRoutes([]);
          setLoadingNearby(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => { isMounted = false; };
  }, [isPending, schoolPassioId]);

  const deleteStop = async (id: string) => {
    try {
      await fetch(`/api/stops/mine?id=${id}`, { method: "DELETE" });
      setSavedStops((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Failed to delete saved stop", err);
    }
  };

  const renderNearbyRoutes = () => {
    // 1) Prefer nearby routes when geolocation + nearby stops exist.
    if (usedLocation && nearbyRoutes.length > 0) {
      return nearbyRoutes.slice(0, 8).map((route) => {
        const label = route.shortName
          ? `${route.name} (${route.shortName})`
          : route.name;

        // We no longer show distance here; only status.
        const mainText = formatRouteStatus(route);

        return (
          <div
            key={getRouteKey(route)}
            className="bg-gray-100 p-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <p className="font-semibold">{label}</p>
            <p className="text-gray-600 text-sm">{mainText}</p>
            <p className="text-gray-500 text-xs mt-1">
              Active buses: {route.activeVehicles}
            </p>
          </div>
        );
      });
    }

    // 2) Otherwise, show the full list of routes from the API.
    if (allRoutes.length > 0) {
      return allRoutes.map((route) => {
        const label = route.shortName
          ? `${route.name} (${route.shortName})`
          : route.name;

        return (
          <div
            key={getRouteKey(route)}
            className="bg-gray-100 p-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <p className="font-semibold">{label}</p>
            <p className="text-gray-600 text-sm">
              {formatRouteStatus(route, null)}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Active buses: {route.activeVehicles}
            </p>
          </div>
        );
      });
    }

    // 3) Nothing loaded.
    return (
      <p className="text-gray-600 text-sm">
        Unable to load route information. {schoolName}'s transit provider may be offline or unsupported.
      </p>
    );
  };

  const showNoNearbyMessage =
    usedLocation && nearbyRoutes.length === 0 && allRoutes.length > 0;

  const passioAgency = systemInfo?.username?.trim() || "";
  const mapEmbedUrl = passioAgency
    ? `https://${passioAgency}.passiogo.com/?zoom=14.3&lat=${schoolLatitude}&lng=${schoolLongitude}&boldRoutes=1`
    : "";
  const passioMapHeaderCropPx = 92;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 h-20 shadow-lg flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <MapPin className="w-8 h-8 text-white" />
          <span
            className="text-white"
            style={{ fontSize: "24px", fontWeight: 700 }}
          >
            CampusRoute
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isPending ? null : session && (
            <div className="bg-blue-800 rounded-lg px-4 py-2 flex items-center gap-3">
              <User className="w-5 h-5 text-white" />{/* I'm not sure if we still want to keep this icon. */}
              <span className="text-white font-semibold">Welcome, {session.user.name}</span>
            </div>)
          }
          <button
            onClick={onLogout}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            style={{ fontWeight: 600 }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Left: map + legend + alerts */}
          <div className="lg:col-span-2 space-y-6">
          {/* Map card */}
            <div
              className="bg-white rounded-xl shadow-lg p-6"
              style={{ height: "600px" }}
            >
              <div
                className="w-full h-full rounded-lg flex flex-col items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)",
                }}
              >
                {mapEmbedUrl ? (
                  <div
                    className="relative w-full h-full overflow-hidden rounded-lg"
                    aria-label={`${schoolName} Passio Go map`}
                  >
                    <iframe
                      key={mapEmbedUrl}
                      className="absolute left-0 w-full rounded-lg"
                      src={mapEmbedUrl}
                      width="800"
                      height="800"
                      style={{
                        border: 0,
                        top: `-${passioMapHeaderCropPx}px`,
                        height: `calc(100% + ${passioMapHeaderCropPx}px)`,
                      }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${schoolName} Passio Go map`}
                    />
                  </div>
                ) : (
                  <p className="text-gray-600 font-medium">Loading Passio Go map...</p>
                )}
              </div>
            </div>


            {/* Real-time traffic alerts (DYNAMIC) */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold">Traffic Alerts</h2>
              </div>

              {loadingAlerts ? (
                <p className="text-gray-600 text-sm">Loading real-time alerts…</p>
              ) : alerts.length === 0 ? (
                <p className="text-gray-600 text-sm">No active system alerts at this time.</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const colors = getAlertColor(alert.important);
                    return (
                      <div
                        key={alert.id}
                        className={`${colors.bg} border ${colors.border} p-3 rounded-lg flex items-start`}
                      >
                        <div className={`w-3 h-3 rounded-full ${colors.dot} mr-3 mt-1 flex-shrink-0`} />
                        <div>
                          <p className={`font-semibold ${colors.text}`}>{alert.header}</p>
                          <p 
                            className={`text-sm ${colors.text}`}
                            dangerouslySetInnerHTML={{ __html: alert.description }} 
                          />
                          {alert.routeId && (
                            <p className="text-gray-500 text-xs mt-1">
                                Applies to Route ID: {alert.routeId}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* END Dynamic Alerts */}
          </div>

          {/* Right: saved stops + routes near you */}
          <div className="space-y-6">
            {/* Saved Stops */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold">Saved Stops</h2>
                </div>
                <button
                  onClick={onAddRoute}
                  className="p-2 rounded-full text-blue-600 hover:text-blue-700 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {loadingSaved ? (
                <p className="text-gray-600 text-sm">Loading your stops…</p>
              ) : savedStops.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  You don&apos;t have any saved stops yet. Click{" "}
                  <span className="font-semibold">Add</span> to choose some.
                </p>
              ) : (
                <div className="space-y-3">
                  {savedStops.map((s) => {
                    const detail = stopDetails[s.passioStopId];
                    return (
                      <SavedStopCard
                        key={s._id}
                        stop={s}
                        detail={detail}
                        onDelete={deleteStop}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bus Routes Near You */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bus className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold">Bus Routes Near You</h2>
              </div>

              {(loadingNearby || loadingAllRoutes) && (
                <p className="text-gray-600 text-sm mb-2">
                  Loading route information…
                </p>
              )}

              <div className="space-y-3">{renderNearbyRoutes()}</div>

              {showNoNearbyMessage && (
                <p className="text-gray-500 text-sm mt-2">
                  No nearby stops found – showing all {schoolName || "campus"} routes instead.
                </p>
              )}

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3 mt-4">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-800 text-sm">
                  Saved Stops show live status for the routes serving the stops
                  you care about most.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
