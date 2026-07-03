# CampusRoute

CampusRoute is a campus transit dashboard for tracking buses, nearby routes, service alerts, and saved stops for a selected college. The site is built with Next.js on the frontend and FastAPI on the backend, and it uses Passio Go data so the transit view stays tied to the user's school.

## What the website does

- Shows a school-specific transit map using the Passio Go web embed.
- Displays nearby and all available bus routes.
- Shows live route status, next stop predictions, and route activity.
- Lets users save stops and view bus-to-stop distance plus an estimated arrival time.
- Loads active system alerts from the transit provider.
- Supports login and sign-up so saved stops can be tied to a user account.

## Project structure

- `src/app/page.tsx` is the public landing page.
- `src/app/routes/page.tsx` is the main authenticated transit dashboard.
- `src/app/api/*` contains Next.js API routes that proxy requests to the Python backend.
- `passio-backend/main.py` is the FastAPI service that talks to Passio Go.
- `src/components/*` contains shared UI pieces such as modals, panels, and app state.
- `src/data/schools.ts` stores the school list and Passio system IDs.

## Frontend overview

The frontend is a Next.js App Router application written in TypeScript and React. It handles the user interface, school selection, saved-stop display, and the embedded Passio Go map.

### Important frontend functions and components

- `SplashPage` in `src/app/page.tsx`
  - Renders the landing page.
  - Provides the Login and Sign Up entry points.
  - Uses the search-parameter helper to open auth modals.

- `RoutesPage` in `src/app/routes/page.tsx`
  - Drives the authenticated transit experience.
  - Fetches the school's system metadata, routes, stops, alerts, and saved-stop details.
  - Embeds the Passio Go map using the school's Passio username.
  - Keeps the map tied to the selected college.

- `SavedStopCard`
  - Renders each saved stop.
  - Shows only routes with active vehicles.
  - Displays closest bus distance and estimated arrival time when available.

- `formatRouteStatus(route, distanceMiles?)`
  - Formats the text shown for route cards.
  - Combines route status with the next stop prediction when the backend provides one.

- `getRouteKey(route)`
  - Builds a composite React key for route rows.
  - Prevents duplicate-key warnings when Passio returns repeated route IDs for different route variants.

### Frontend data flow

1. The selected school comes from session data or local app state.
2. The page requests school metadata from `/api/systems/details`.
3. The app loads routes, stops, alerts, and saved stops through Next.js API routes.
4. The Passio Go map is embedded using the school's Passio username.
5. Saved-stop cards use the backend's stop details response to show route activity, bus distance, and ETA.

## Backend overview

The backend is a FastAPI service that wraps the Passio Go Python library and exposes data in a shape the Next.js app can consume.

### Important backend functions

- `_ensure_system(system_id)`
  - Loads and caches the Passio system object.
  - Prevents repeated re-initialization on every request.

- `_refresh_system_data(system_id, force=False)`
  - Refreshes routes, stops, vehicles, alerts, and raw vehicle records.
  - Keeps transit data current while avoiding unnecessary network calls.

- `_get_data(system_id)`
  - Returns the cached routes, stops, vehicles, and alerts.

- `_get_raw_vehicle_records(system_id)`
  - Fetches raw Passio bus JSON directly from Passio Go.
  - This is necessary because the SDK vehicle objects do not preserve the full coordinate data.

- `_vehicle_latitude(vehicle)` and `_vehicle_longitude(vehicle)`
  - Read and normalize vehicle coordinates.
  - Convert raw string values into floats for distance math.

- `_build_route_vehicle_map(routes, vehicles)`
  - Groups live vehicles by route ID.

- `_build_route_stop_sequences(system_id, routes)`
  - Loads stop order for each route.
  - Helps estimate the next stop and travel time.

- `_estimate_next_stop_for_vehicle(vehicle, route_stops)`
  - Estimates which stop a bus will reach next.
  - Returns the next stop name and ETA in minutes.

- `_estimate_route_eta(route_stops, vehicles)`
  - Chooses the best ETA estimate across all vehicles on a route.

- `_closest_bus_distance_to_stop_miles(stop_lat, stop_lng, route_keys, vehicles)`
  - Computes the shortest distance from any active bus on a route to the stop.

- `_get_system_metadata(system_id)`
  - Returns the Passio system ID, name, username, and agency name.

### Backend endpoints

- `GET /`
  - Health check for the backend.

- `GET /system`
  - Returns system metadata used to build the Passio Go embed URL.

- `GET /routes/nearby`
  - Returns nearby stops and routes when coordinates are provided.
  - Returns the full route list when coordinates are not provided.

- `GET /routes/by-id`
  - Returns route details for specific IDs.

- `GET /stops/all`
  - Returns all stops for the selected system.

- `GET /stops/details`
  - Returns detailed stop information for saved stops.
  - Includes `closestBusDistanceMiles` and `arrivalEtaMinutes`.

- `GET /stops/mine`
  - Returns the user's saved stops from the database.

- `GET /alerts`
  - Returns active service alerts.

## Local development

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd passio-backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 5050
```

## Environment variables

- `PASSIO_BACKEND_URL`
  - Optional.
  - Defaults to `http://127.0.0.1:5050`.
  - Used by the Next.js API routes to reach the FastAPI service.

## Design notes

- The app is school-specific, not a generic campus map.
- The Passio Go embed is cropped to hide the top site chrome and keep the focus on the live map.
- Saved stops show bus-relative information instead of user-to-stop distance.
- The route list keeps duplicate Passio route variants separate with composite React keys.

## Purpose

CampusRoute exists to give students a single place to check transit movement, bus arrival estimates, and route alerts for their own college without jumping between separate transit pages.
