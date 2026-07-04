// Shared Passio API response shapes used by route and stop views.
// shared shapes (copy into components where needed)

export type NearbyRoute = {
  id: string;
  name: string;
  shortName?: string | null;
  serviceTime?: string | null;
  activeVehicles: number;
  status: string;
  nearestStopName?: string | null;
  nearestStopDistanceMiles?: number | null;
};

export type NearbyStop = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number;
  distanceMiles: number;
  routes: NearbyRoute[];
};

export type NearbyResponse = {
  routes: NearbyRoute[];
  stops?: NearbyStop[];
};

export type StopRoute = {
  id: string;
  name: string;
  shortName?: string | null;
  serviceTime?: string | null;
  activeVehicles: number;
  status: string;
};

export type StopDetails = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  routes: StopRoute[];
};
