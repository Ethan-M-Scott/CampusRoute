from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import math
import time
import requests
import passiogo
from datetime import datetime 

# FastAPI wrapper around Passio Go that serves transit data to the web app.

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_CACHE = {}
_REFRESH_SECONDS = 25.0
_DEFAULT_BUS_SPEED_MPH = 12.0

@app.get("/")
def read_root():
    return {"status": "CampusRoute Backend is running!"}

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

def _ensure_system(system_id: int):
    if system_id not in _CACHE:
        try:
            system = passiogo.getSystemFromID(system_id)
            _CACHE[system_id] = {
                "system": system,
                "routes": None,
                "stops": None,
                "vehicles": None,
                "alerts": None,
                "route_stop_sequences": None,
                "last_refresh": 0.0
            }
        except Exception as e:
            print(f"Error loading Passio system {system_id}:", e)
            raise HTTPException(status_code=500, detail=f"Passio system {system_id} could not be loaded")
    return _CACHE[system_id]

def _refresh_system_data(system_id: int, force: bool = False):
    cache_entry = _ensure_system(system_id)
    now = time.time()
    if not force and now - cache_entry["last_refresh"] < _REFRESH_SECONDS and cache_entry["routes"] is not None:
        return

    sys = cache_entry["system"]
    try:
        cache_entry["routes"] = sys.getRoutes()
        cache_entry["stops"] = sys.getStops()
        cache_entry["vehicles"] = sys.getVehicles()
        cache_entry["raw_vehicles"] = _get_raw_vehicle_records(system_id)
        cache_entry["alerts"] = sys.getSystemAlerts()
        cache_entry["route_stop_sequences"] = None
        cache_entry["last_refresh"] = now
    except Exception as e:
        print(f"Error refreshing data for system {system_id}:", e)

def _get_data(system_id: int):
    _refresh_system_data(system_id)
    c = _CACHE[system_id]
    return c["routes"] or [], c["stops"] or [], c["vehicles"] or [], c["alerts"] or []


def _get_vehicle_records(system_id: int):
    cache_entry = _ensure_system(system_id)
    records = cache_entry.get("raw_vehicles")
    if records:
        return records
    return cache_entry.get("vehicles") or []


def _normalize_id(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _vehicle_value(vehicle, key: str, default=None):
    if isinstance(vehicle, dict):
        return vehicle.get(key, default)
    return getattr(vehicle, key, default)


def _vehicle_latitude(vehicle):
    latitude = _vehicle_value(vehicle, "latitude", None)
    if latitude is None and not isinstance(vehicle, dict):
        latitude = getattr(vehicle, "longitude", None)
    if latitude is None:
        return None
    try:
        return float(latitude)
    except (TypeError, ValueError):
        return None


def _vehicle_longitude(vehicle):
    longitude = _vehicle_value(vehicle, "longitude", None)
    if longitude is None and isinstance(vehicle, dict):
        return None
    if longitude is None:
        return None
    try:
        return float(longitude)
    except (TypeError, ValueError):
        return None


def _build_route_vehicle_map(routes, vehicles):
    route_vehicle_map: dict[str, list] = {}

    for route in routes:
        route_ids = {
            _normalize_id(getattr(route, "id", None)),
            _normalize_id(getattr(route, "myid", None)),
        }
        route_ids.discard(None)

        if not route_ids:
            continue

        matched_vehicles = []
        for vehicle in vehicles:
            vehicle_route_id = _normalize_id(_vehicle_value(vehicle, "routeId", None))
            if vehicle_route_id in route_ids:
                matched_vehicles.append(vehicle)

        for route_id in route_ids:
            route_vehicle_map[route_id] = matched_vehicles

    return route_vehicle_map


def _build_route_stop_sequences(system_id: int, routes):
    cache_entry = _ensure_system(system_id)
    if cache_entry.get("route_stop_sequences") is not None:
        return cache_entry["route_stop_sequences"]

    route_stop_sequences: dict[str, list[dict]] = {}

    for route in routes:
        try:
            route_stops = route.getStops() or []
        except Exception as e:
            print(f"Error loading stops for route {getattr(route, 'id', None)}:", e)
            route_stops = []

        stop_payloads = []
        for stop in route_stops:
            stop_lat = getattr(stop, "latitude", None)
            stop_lng = getattr(stop, "longitude", None)
            if stop_lat is None or stop_lng is None:
                continue

            stop_payloads.append(
                {
                    "id": _normalize_id(getattr(stop, "id", None)),
                    "name": getattr(stop, "name", "Unnamed stop"),
                    "latitude": float(stop_lat),
                    "longitude": float(stop_lng),
                }
            )

        for key in (
            _normalize_id(getattr(route, "id", None)),
            _normalize_id(getattr(route, "myid", None)),
        ):
            if key is not None:
                route_stop_sequences[key] = stop_payloads

    cache_entry["route_stop_sequences"] = route_stop_sequences
    return route_stop_sequences


def _latlng_to_xy(lat: float, lng: float, ref_lat: float) -> tuple[float, float]:
    radius_m = 6371000.0
    x = math.radians(lng) * radius_m * math.cos(math.radians(ref_lat))
    y = math.radians(lat) * radius_m
    return x, y


def _bearing_degrees(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dlng = math.radians(lng2 - lng1)
    y = math.sin(dlng) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlng)
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360.0) % 360.0


def _angle_difference(a: float, b: float) -> float:
    return abs((a - b + 180.0) % 360.0 - 180.0)


def _speed_mps(speed_mph: float | None) -> float:
    speed = speed_mph if speed_mph is not None else _DEFAULT_BUS_SPEED_MPH
    if speed <= 0:
        return 0.0
    return speed * 0.44704


def _estimate_next_stop_for_vehicle(vehicle, route_stops: list[dict]) -> tuple[str | None, int | None, float | None]:
    if len(route_stops) < 2:
        return None, None, None

    vehicle_lat = _vehicle_latitude(vehicle)
    vehicle_lng = _vehicle_longitude(vehicle)
    if vehicle_lat is None or vehicle_lng is None:
        return None, None, None

    course_value = getattr(vehicle, "calculatedCourse", None)
    try:
        course = float(course_value) if course_value is not None else None
    except (TypeError, ValueError):
        course = None

    try:
        speed_value = _vehicle_value(vehicle, "speed", None)
        vehicle_speed = float(speed_value) if speed_value is not None else None
    except (TypeError, ValueError):
        vehicle_speed = None

    speed_mps = _speed_mps(vehicle_speed)
    if speed_mps <= 0:
        speed_mps = _speed_mps(None)

    best_segment = None
    best_score = None

    for index in range(len(route_stops) - 1):
        start = route_stops[index]
        end = route_stops[index + 1]

        ref_lat = (vehicle_lat + start["latitude"] + end["latitude"]) / 3.0
        px, py = _latlng_to_xy(vehicle_lat, vehicle_lng, ref_lat)
        ax, ay = _latlng_to_xy(start["latitude"], start["longitude"], ref_lat)
        bx, by = _latlng_to_xy(end["latitude"], end["longitude"], ref_lat)

        vx = bx - ax
        vy = by - ay
        wx = px - ax
        wy = py - ay

        seg_len_sq = vx * vx + vy * vy
        if seg_len_sq == 0:
            continue

        t = max(0.0, min(1.0, (wx * vx + wy * vy) / seg_len_sq))
        proj_x = ax + t * vx
        proj_y = ay + t * vy

        distance_to_segment = math.hypot(px - proj_x, py - proj_y)
        score = distance_to_segment

        if course is not None:
            segment_bearing = _bearing_degrees(start["latitude"], start["longitude"], end["latitude"], end["longitude"])
            score += _angle_difference(course, segment_bearing) * 12.0

        if best_score is None or score < best_score:
            best_score = score
            best_segment = {
                "index": index,
                "distance_to_next_stop_m": math.hypot(bx - px, by - py),
            }

    if best_segment is None:
        return None, None, None

    eta_minutes = max(1, int(round(best_segment["distance_to_next_stop_m"] / speed_mps / 60.0)))
    next_stop = route_stops[best_segment["index"] + 1]
    return next_stop["name"], eta_minutes, best_segment["distance_to_next_stop_m"]


def _calculate_on_road_distance_to_stop(vehicle, target_stop_id: str, route_stops: list[dict]) -> float | None:
    if not route_stops:
        return None

    # 1. Find the vehicle's position relative to the route segments.
    _, _, distance_to_next_stop_m = _estimate_next_stop_for_vehicle(vehicle, route_stops)
    if distance_to_next_stop_m is None:
        return None

    # Find the index of the next stop and the target stop in the sequence.
    next_stop_index = -1
    target_stop_index = -1
    for i, stop in enumerate(route_stops):
        if stop["id"] == _estimate_next_stop_for_vehicle(vehicle, route_stops)[0]:
             # This is brittle, but _estimate_next_stop_for_vehicle only returns name.
             # A better implementation would return the stop object or ID.
             # For now, we find the *first* match by name.
            if next_stop_index == -1:
                next_stop_index = i
        if str(stop.get("id")) == str(target_stop_id):
            target_stop_index = i

    if next_stop_index == -1 or target_stop_index == -1:
        return None # Vehicle's next stop or target stop not on this route sequence.

    # 2. If the target stop is the vehicle's next stop, the distance is simple.
    if next_stop_index == target_stop_index:
        return distance_to_next_stop_m

    # 3. If target is further along, sum segment distances.
    total_distance_m = distance_to_next_stop_m
    
    # Iterate through segments from the next stop to the one before the target stop.
    current_idx = next_stop_index
    while current_idx != target_stop_index:
        start_stop = route_stops[current_idx]
        next_idx = (current_idx + 1) % len(route_stops)
        end_stop = route_stops[next_idx]
        
        total_distance_m += _haversine(start_stop["latitude"], start_stop["longitude"], end_stop["latitude"], end_stop["longitude"])
        current_idx = next_idx
        
    return total_distance_m


def _find_nearest_vehicle_to_stop(stop: dict, vehicles: list) -> tuple[float | None, float | None]:
    stop_lat = stop.get("latitude")
    stop_lng = stop.get("longitude")
    if stop_lat is None or stop_lng is None:
        return None, None

    min_dist_m: float | None = None

    for v in vehicles:
        v_lat, v_lng = getattr(v, "latitude", None), getattr(v, "longitude", None)
        if v_lat is not None and v_lng is not None:
            dist_m = _haversine(stop_lat, stop_lng, v_lat, v_lng)
            if min_dist_m is None or dist_m < min_dist_m:
                min_dist_m = dist_m
    
    return min_dist_m, (min_dist_m / 1609.34) if min_dist_m is not None else None

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Straight-line distance between two coordinates, in meters.
    """
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def _estimate_route_eta(route_stops: list[dict], vehicles: list) -> tuple[str | None, int | None]:
    best_name = None
    best_eta = None

    for vehicle in vehicles:
        next_stop_name, eta_minutes, _ = _estimate_next_stop_for_vehicle(vehicle, route_stops)
        if next_stop_name is None or eta_minutes is None:
            continue

        if best_eta is None or eta_minutes < best_eta:
            best_name = next_stop_name
            best_eta = eta_minutes

    return best_name, best_eta


def _closest_bus_distance_to_stop_miles(
    stop_lat: float,
    stop_lng: float,
    route_keys: set[str],
    vehicles: list,
) -> float | None:
    closest_distance = None

    for vehicle in vehicles:
        vehicle_route_id = _normalize_id(_vehicle_value(vehicle, "routeId", None))
        if vehicle_route_id is None or vehicle_route_id not in route_keys:
            continue

        vehicle_lat = _vehicle_latitude(vehicle)
        vehicle_lng = _vehicle_longitude(vehicle)
        if vehicle_lat is None or vehicle_lng is None:
            continue

        distance_miles = _haversine(stop_lat, stop_lng, float(vehicle_lat), float(vehicle_lng)) / 1609.34
        if closest_distance is None or distance_miles < closest_distance:
            closest_distance = distance_miles

    return closest_distance


def _get_system_metadata(system_id: int):
    cache_entry = _ensure_system(system_id)
    system = cache_entry["system"]
    return {
        "id": getattr(system, "id", system_id),
        "name": getattr(system, "name", None),
        "username": getattr(system, "username", None),
        "goAgencyName": getattr(system, "goAgencyName", None),
    }


def _get_raw_vehicle_records(system_id: int) -> list[dict]:
    try:
        response = requests.post(
            "https://passiogo.com/mapGetData.php?getBuses=2",
            json={"s0": str(system_id), "sA": 1},
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
    except Exception as e:
        print(f"Error loading raw vehicle data for system {system_id}:", e)
        return []

    records: list[dict] = []
    for buses in (payload.get("buses") or {}).values():
        if not buses:
            continue
        vehicle = buses[0]
        if isinstance(vehicle, dict):
            records.append(vehicle)

    return records


def _build_vehicle_index(vehicles):
    """
    Build a dict mapping route IDs -> number of active vehicles.

    Different systems sometimes use different IDs; here we just key by
    whatever `vehicle.routeId` is, as a string.
    """
    counts: dict[str, int] = {}
    for v in vehicles:
        rid = getattr(v, "routeId", None)
        if not rid:
            continue
        key = str(rid)
        counts[key] = counts.get(key, 0) + 1
    return counts


def _build_route_payloads(system_id: int, routes, vehicles):
    """
    Build base payload for every route and a lookup dict that can be accessed by
    either route.id or route.myid (because stops.routesAndPositions uses myid).
    """
    route_vehicle_map = _build_route_vehicle_map(routes, vehicles)
    route_stop_sequences = _build_route_stop_sequences(system_id, routes) if routes else {}

    base_routes = []
    route_by_any_id: dict[str, dict] = {}

    for r in routes:
        # Passio Route objects typically have both `id` and `myid`.
        rid = getattr(r, "id", None)
        myid = getattr(r, "myid", None)

        # Active vehicles: try to match both id and myid to whatever vehicle.routeId is.
        route_ids = {rid, myid}
        route_ids.discard(None)

        matched_vehicles = []
        seen_vehicle_ids = set()
        for route_id in route_ids:
            for vehicle in route_vehicle_map.get(str(route_id), []):
                vehicle_key = _normalize_id(getattr(vehicle, "id", None)) or str(id(vehicle))
                if vehicle_key in seen_vehicle_ids:
                    continue
                seen_vehicle_ids.add(vehicle_key)
                matched_vehicles.append(vehicle)

        active = len(matched_vehicles)

        route_stops = []
        for route_id in route_ids:
            route_stops = route_stop_sequences.get(str(route_id), [])
            if route_stops:
                break

        next_stop_name, next_stop_eta = _estimate_route_eta(route_stops, matched_vehicles)

        payload = {
            "id": str(rid) if rid is not None else str(myid),
            "name": getattr(r, "name", "Unnamed route"),
            "shortName": getattr(r, "shortName", None),
            "serviceTime": getattr(r, "serviceTime", None),
            "activeVehicles": active,
            "status": "Buses on route" if active > 0 else "No buses currently on route",
            "nextStopName": next_stop_name,
            "nextStopEtaMinutes": next_stop_eta,
        }

        base_routes.append(payload)

        # Lookups by both `id` and `myid` so stops can match them.
        if rid is not None:
            route_by_any_id[str(rid)] = payload
        if myid is not None:
            route_by_any_id[str(myid)] = payload

    return base_routes, route_by_any_id


@app.get("/routes/nearby")
def get_nearby_routes(
    system_id: int = Query(..., description="Passio System ID"),
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
    radius_m: float = Query(default=1600, description="Search radius (~1 mile)"),
    max_stops: int = Query(default=15, description="Max nearby stops to include"),
):
    """
    If lat/lng are provided:
      • compute nearby stops within the radius
      • for each stop, attach the routes that serve it
    If lat/lng are not provided:
      • just return all routes with active vehicle counts
    """
    routes, stops, _, _ = _get_data(system_id) 
    vehicle_records = _get_vehicle_records(system_id)

    base_routes, route_by_any_id = _build_route_payloads(system_id, routes, vehicle_records)

    # No location → list of routes only.
    if lat is None or lng is None:
        return {"routes": base_routes}

    nearby_stops = []

    for s in stops:
        s_lat = getattr(s, "latitude", None)
        s_lng = getattr(s, "longitude", None)
        if s_lat is None or s_lng is None:
            continue

        d_m = _haversine(lat, lng, s_lat, s_lng)
        if d_m > radius_m:
            continue

        routes_and_positions = getattr(s, "routesAndPositions", {}) or {}
        stop_routes = []

        # routesAndPositions uses the route's internal ID (often myid),
        # so we look it up in route_by_any_id.
        for key in routes_and_positions.keys():
            r_payload = route_by_any_id.get(str(key))
            if r_payload:
                stop_routes.append(r_payload)

        if not stop_routes:
            continue

        nearby_stops.append(
            {
                "id": getattr(s, "id", None),
                "name": getattr(s, "name", "Unnamed stop"),
                "latitude": s_lat,
                "longitude": s_lng,
                "distanceMeters": d_m,
                "distanceMiles": d_m / 1609.34,
                "routes": stop_routes,
            }
        )

    nearby_stops.sort(key=lambda st: st["distanceMeters"])
    nearby_stops = nearby_stops[:max_stops]

    return {
        "routes": base_routes,
        "stops": nearby_stops,
    }


@app.get("/system")
def get_system(system_id: int = Query(..., description="Passio System ID")):
    """
    Returns basic metadata for a Passio system, including the URL-friendly username.
    """
    return _get_system_metadata(system_id)


@app.get("/stops/all")
def get_all_stops(system_id: int = Query(..., description="Passio System ID")):
    """
    All stops for UGA system (used to populate the Saved Stops checklist).
    """
    routes, stops, vehicles, _ = _get_data(system_id)  

    payload = []
    for s in stops:
        payload.append(
            {
                "id": getattr(s, "id", None),
                "name": getattr(s, "name", "Unnamed stop"),
                "latitude": getattr(s, "latitude", None),
                "longitude": getattr(s, "longitude", None),
            }
        )

    return {"stops": payload}


@app.get("/stops/details")
def get_stops_details(
    system_id: int = Query(..., description="Passio System ID"),
    ids: str = Query(..., description="Comma-separated Passio stop IDs"),
):
    """
    Detailed info for specific stops, including the routes that serve each stop
    and the number of active buses on those routes.

    This powers the Saved Stops panel in the authenticated view.
    """
    routes, stops, _, _ = _get_data(system_id) 
    vehicle_records = _get_vehicle_records(system_id)

    wanted_ids = {s for s in ids.split(",") if s}

    base_routes, route_by_any_id = _build_route_payloads(system_id, routes, vehicle_records)
    route_vehicle_map = _build_route_vehicle_map(routes, vehicle_records)
    route_stop_sequences = _build_route_stop_sequences(system_id, routes)

    result = []

    for s in stops:
        sid = getattr(s, "id", None)
        if sid is None or str(sid) not in wanted_ids:
            continue

        stop_lat = getattr(s, "latitude", None)
        stop_lng = getattr(s, "longitude", None)

        routes_and_positions = getattr(s, "routesAndPositions", {}) or {}
        stop_routes = []

        for key in routes_and_positions.keys():
            r_payload = route_by_any_id.get(str(key))
            if r_payload:
                route_vehicles = route_vehicle_map.get(str(key), [])
                payload_copy = r_payload.copy()

                min_dist_m: float | None = None
                closest_speed_mph: float | None = None
                if stop_lat is not None and stop_lng is not None:
                    for vehicle in route_vehicles:
                        vehicle_lat = _vehicle_latitude(vehicle)
                        vehicle_lng = _vehicle_longitude(vehicle)
                        if vehicle_lat is None or vehicle_lng is None:
                            continue

                        dist_m = _haversine(float(stop_lat), float(stop_lng), float(vehicle_lat), float(vehicle_lng))
                        if min_dist_m is None or dist_m < min_dist_m:
                            min_dist_m = dist_m
                            try:
                                speed_value = _vehicle_value(vehicle, "speed", None)
                                closest_speed_mph = float(speed_value) if speed_value is not None else None
                            except (TypeError, ValueError):
                                closest_speed_mph = None

                payload_copy["closestBusDistanceMiles"] = (
                    min_dist_m / 1609.34 if min_dist_m is not None else None
                )
                if min_dist_m is not None:
                    speed_mph = closest_speed_mph if closest_speed_mph and closest_speed_mph > 0 else _DEFAULT_BUS_SPEED_MPH
                    payload_copy["arrivalEtaMinutes"] = max(1, int(math.ceil((min_dist_m / 1609.34) / speed_mph * 60.0)))
                else:
                    payload_copy["arrivalEtaMinutes"] = None
                stop_routes.append(payload_copy)

        result.append(
            {
                "id": sid,
                "name": getattr(s, "name", "Unnamed stop"),
                "latitude": stop_lat,
                "longitude": stop_lng,
                "routes": stop_routes,
            }
        )

    return {"stops": result}


@app.get("/alerts")
def get_system_alerts(system_id: int = Query(..., description="Passio System ID")):
    """
    Returns a list of active system alerts.
    """
    _, _, _, alerts = _get_data(system_id) 
    
    current_time = datetime.now()
    active_alerts = []

    for alert in alerts:
       
        if getattr(alert, "archive", "0") != "1":
            try:
                
                date_from = datetime.strptime(getattr(alert, "dateTimeFrom"), "%Y-%m-%d %H:%M:%S")
                date_to = datetime.strptime(getattr(alert, "dateTimeTo"), "%Y-%m-%d %H:%M:%S")

                if date_from <= current_time <= date_to:
                   
                    header = getattr(alert, "gtfsAlertHeaderText", None) or getattr(alert, "name", "System Alert")
                    description = getattr(alert, "gtfsAlertDescriptionText", None) or getattr(alert, "html", "")
                    
                    active_alerts.append({
                        "id": getattr(alert, "id"),
                        "header": header,
                        "description": description,
                        "dateTimeCreated": getattr(alert, "dateTimeCreated"),
                        "routeId": getattr(alert, "routeId"),
                        "important": getattr(alert, "important") == "1",
                    })
            except (ValueError, TypeError):
                
                pass

    return {"alerts": active_alerts}