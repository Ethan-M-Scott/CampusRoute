"use client";

import React, { useEffect, useState } from "react";
import { MapPin, User, X, Save, LogOut } from "lucide-react";

type StopOption = {
  id: string;
  name: string;
};

type FormViewProps = {
  onClose: () => void;
  onLogout?: () => void;
  onSaved?: () => void;
};

export function FormView({
  onClose,
  onLogout,
  onSaved,
}: FormViewProps) {
  const [stops, setStops] = useState<StopOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingStops, setLoadingStops] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStops = async () => {
      setLoadingStops(true);
      try {
        const res = await fetch("/api/stops/all");
        const data = await res.json();
        const options: StopOption[] = (data.stops || []).map((s: any) => ({
          id: s.id,
          name: s.name,
        }));
        setStops(options);
      } catch (err) {
        console.error("Failed to load stops", err);
        setError("Failed to load stops from the server.");
      } finally {
        setLoadingStops(false);
      }
    };

    loadStops();
  }, []);

  const toggleStop = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selected.size === 0) {
      setError("Please select at least one stop.");
      return;
    }

    setSubmitting(true);
    try {
      const stopIds = Array.from(selected);
      const stopNames = stopIds.map(
        (id) => stops.find((s) => s.id === id)?.name || "Saved stop"
      );

      const res = await fetch("/api/stops/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopIds, stopNames }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save stops.");
      }

      onSaved?.();
      setSelected(new Set());
      onClose();
    } catch (err: any) {
      console.error("Error saving stops", err);
      setError(err.message || "Something went wrong saving your stops.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="bg-blue-800 rounded-lg px-4 py-2 flex items-center gap-3">
            <User className="w-5 h-5 text-white" />
            <span className="text-white" style={{ fontWeight: 600 }}>
              dawg_user
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                style={{ fontWeight: 600 }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center gap-2"
              style={{ fontWeight: 600 }}
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      </header>

      <main className="p-8 flex justify-center">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-12">
          <h1 className="mb-2" style={{ fontSize: "32px", fontWeight: 700 }}>
            Add Saved Stops
          </h1>
          <p className="text-gray-600 mb-8" style={{ fontSize: "16px" }}>
            Choose the bus stops you care about most. CampusRoute will show live
            status for the routes serving these stops.
          </p>

          {error && (
            <div className="mb-4 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2" style={{ fontWeight: 600 }}>
                Select Stops
              </label>

              {loadingStops ? (
                <p className="text-gray-600 text-sm">Loading stops…</p>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2 bg-gray-50">
                  {stops.map((stop) => (
                    <label
                      key={stop.id}
                      className="flex items-center gap-2 text-sm text-gray-800"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={selected.has(stop.id)}
                        onChange={() => toggleStop(stop.id)}
                      />
                      <span>{stop.name}</span>
                    </label>
                  ))}
                  {stops.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      No stops available from the API.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-12 px-6 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                style={{ fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loadingStops}
                className="h-12 bg-blue-600 text-white rounded-lg px-6 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ fontWeight: 600 }}
              >
                <Save className="w-4 h-4" />
                {submitting ? "Saving..." : "Save Stops"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
