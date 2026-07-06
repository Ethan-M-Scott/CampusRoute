"use client";

// Saved-stop selection screen for the authenticated campus dashboard.
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useAppState } from '@/src/components/AppStateContext';
import { SCHOOLS } from '@/src/data/schools';

type ApiStop = {
  id: string;
  name: string;
};

export default function AddSavedStopsPage() {
  const router = useRouter();

  const [allStops, setAllStops] = useState<ApiStop[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingStops, setLoadingStops] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session, isPending } = useSession();
  const { selectedSchool, setSelectedSchool } = useAppState();
  const defaultSchool = SCHOOLS.find(s => s.id === "uga") || SCHOOLS[0];
  const sessionSchool = session?.user?.school ? SCHOOLS.find(s => s.id === session.user.school) : null;
  const school = isPending ? null : (sessionSchool || selectedSchool || defaultSchool);

  // Load user's school from session
  useEffect(() => {
    if (session?.user && session.user.school) {
      const sessionSchool = SCHOOLS.find(s => s.id === session.user.school);
      if (sessionSchool) {
        setSelectedSchool(sessionSchool);
      }
    }
  }, [session, setSelectedSchool]);

  // Load all stops from backend
  useEffect(() => {
    let isMounted = true;
    const loadAllStops = async () => {
      setLoadingStops(true);
      try {
        const res = await fetch(`/api/stops/all?system_id=${school.passioId}`);
        if (!res.ok) throw new Error("Failed to load stops");
        const data = await res.json();
        if (isMounted) setAllStops(data.stops || []);
      } catch (err) {
        console.error("Failed to load all stops", err);
        if (isMounted) setError(`Failed to load stops. ${school?.name}'s transit system may not be supported or is offline.`);
        if (isMounted) setAllStops([]);
      } finally {
        if (isMounted) setLoadingStops(false);
      }
    };

    if (school?.passioId) loadAllStops();
    return () => { isMounted = false; };
  }, [school?.passioId, school?.name]);

  // Load existing saved stops so checkboxes reflect current state
  useEffect(() => {
    let isMounted = true;
    const loadSaved = async () => {
      try {
        const res = await fetch("/api/stops/mine");
        if (res.status === 401) return;
        const data = await res.json();
        const ids: string[] = (data.stops || []).map(
          (s: { passioStopId: string }) => s.passioStopId
        );
        if (isMounted) setSelectedIds(ids);
      } catch (err) {
        console.error("Failed to load existing saved stops", err);
      }
    };

    loadSaved();
    return () => { isMounted = false; };
  }, []);

  const toggleStop = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const selectedStops = selectedIds.map((id) => {
        const stop = allStops.find((s) => s.id === id);
        return {
          passioStopId: id,
          stopName: stop?.name ?? "Unknown stop",
        };
      });

      const res = await fetch("/api/stops/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stops: selectedStops }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save: ${res.status}`);
      }

      router.push("/routes");
    } catch (err) {
      console.error("Error saving stops:", err);
      setError("Failed to save stops.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/routes");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2">Add Saved Stops</h1>
        <p className="text-gray-600 mb-6">
          Choose the bus stops you care about most. My Campus Route will show live
          status for the routes serving these stops.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="font-semibold mb-2">Select Stops</h2>
            <div className="border rounded-lg h-80 overflow-y-auto p-3 space-y-2">
              {loadingStops ? (
                <p className="text-gray-600 text-sm">Loading stops…</p>
              ) : allStops.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  No stops available from the API.
                </p>
              ) : (
                allStops.map((stop) => (
                  <label
                    key={stop.id}
                    className="flex items-center gap-2 text-sm text-gray-800"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedIds.includes(stop.id)}
                      onChange={() => toggleStop(stop.id)}
                    />
                    <span>{stop.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Stops"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
