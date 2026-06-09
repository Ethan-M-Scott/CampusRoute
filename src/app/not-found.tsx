// src/app/not-found.tsx
"use client";

import Link from "next/link";
import { MapPin, Bus, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar to match the app style */}
      <header className="bg-blue-600 h-20 shadow-lg flex items-center px-8">
        <div className="flex items-center gap-3">
          <MapPin className="w-8 h-8 text-white" />
          <span className="text-white text-2xl font-bold">CampusRoute</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <Bus className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-4">
            The page you&apos;re looking for doesn&apos;t exist, is invalid, or
            has been removed.
          </p>

          <p className="text-gray-500 text-sm mb-8">
            Check the URL, or use the button below to go back to the main
            CampusRoute home screen.
          </p>

          <div className="flex justify-center">
            <Link
              href="/home"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
