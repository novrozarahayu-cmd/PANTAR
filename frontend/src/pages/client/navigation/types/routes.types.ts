export type VehicleType = "mobil" | "motor" | "jalan_kaki";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteRequest {
  origin: Coordinates;
  destination: Coordinates;
  vehicle: VehicleType;
}

export interface RouteHazard {
  id: string;
  title: string;
  address: string;
  severity: "ringan" | "sedang" | "berat" | string;
  status?: string;
  lat: number;
  lng: number;
  distanceToRoute?: number;
  images?: string | null;
}

export interface RouteGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface RoutePath {
  distance: number;
  duration: number;
  geometry: RouteGeometry;
  hazards?: RouteHazard[];
  passableHazards?: RouteHazard[];
}

export interface SafeRouteData {
  status: string;
  message?: string;
  vehicle: VehicleType;
  route: RoutePath;
  baseline?: RoutePath;
  avoided?: RouteHazard[];
}

export interface SafeRouteResponse {
  success: boolean;
  message: string;
  data: SafeRouteData;
}

export interface LocationSuggestion {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}
