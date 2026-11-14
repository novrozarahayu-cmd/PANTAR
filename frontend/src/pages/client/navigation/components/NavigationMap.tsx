import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import type {
    Coordinates,
    RouteHazard,
    RoutePath,
} from "../types/routes.types";
import type { RoadHazardFeature } from "../types/hazards.types";
import HazardMarkers from "./HazardMarkers";

interface NavigationMapProps {
    route: RoutePath | null;
    baseline: RoutePath | null;
    hazards: RouteHazard[];
    roadHazards: RoadHazardFeature[];
    origin: Coordinates | null;
    destination: Coordinates | null;
    onReroute: (position: Coordinates) => void;
    pickTarget: "origin" | "destination" | null;
    onPickLocation: (position: Coordinates) => void;
    onCancelPick: () => void;
}

const defaultCenter: [number, number] = [3.5952, 98.6722];

const severityColors: Record<string, string> = {
    ringan: "#CA8A04",
    sedang: "#EA580C",
    berat: "#DC2626",
};

function createPinIcon(color: string) {
    return L.divIcon({
        className: "",
        html: `
            <div style="width:36px;height:44px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))">
                <svg viewBox="0 0 36 44" width="36" height="44"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 1C8.6 1 2 7.9 2 16.5C2 27 18 43 18 43S34 27 34 16.5C34 7.9 27.4 1 18 1Z"
                        fill="${color}" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="18" cy="16" r="7" fill="#ffffff"/>
                    <circle cx="18" cy="16" r="4" fill="${color}"/>
                </svg>
            </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 43],
        popupAnchor: [0, -40],
    });
}

function createHazardIcon(color: string) {
    return L.divIcon({
        className: "",
        html: `
            <div style="width:38px;height:42px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))">
                <svg viewBox="0 0 38 42" width="38" height="42"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 1C9 1 2 8 2 17C2 27 19 41 19 41S36 27 36 17C36 8 29 1 19 1Z"
                        fill="${color}" stroke="#ffffff" stroke-width="2"/>
                    <path d="M19 9L28 25H10L19 9Z"
                        fill="#ffffff" stroke="#ffffff" stroke-linejoin="round"/>
                    <path d="M19 14V19" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
                    <circle cx="19" cy="22" r="1.3" fill="${color}"/>
                </svg>
            </div>
        `,
        iconSize: [38, 42],
        iconAnchor: [19, 41],
        popupAnchor: [0, -38],
    });
}

const originIcon = createPinIcon("#16A34A");
const destinationIcon = createPinIcon("#2563EB");

const navigationIcon = L.divIcon({
    className: "",
    html: `
        <div style="
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            border-radius: 50%;
            background: #2563eb;
            box-shadow: 0 2px 8px rgba(0,0,0,.3);
            color: white;
            font-size: 20px;
        ">➤</div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
});

function FitRoute({
    route,
    origin,
    destination,
}: {
    route: RoutePath | null;
    origin: Coordinates | null;
    destination: Coordinates | null;
}) {
    const map = useMap();

    useEffect(() => {
        if (route?.geometry.coordinates.length) {
            const points = route.geometry.coordinates.map(
                ([lng, lat]) => [lat, lng] as [number, number],
            );

            map.fitBounds(points, { padding: [40, 40], maxZoom: 16 });
            return;
        }

        if (origin && destination) {
            map.fitBounds(
                [
                    [origin.lat, origin.lng],
                    [destination.lat, destination.lng],
                ],
                { padding: [40, 40] },
            );
            return;
        }

        if (origin) {
            map.setView([origin.lat, origin.lng], 15);
        }
    }, [map, route, origin, destination]);

    return null;
}

function toLatLngs(route: RoutePath | null): [number, number][] {
    return (
        route?.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng],
        ) ?? []
    );
}

function FollowUserPosition({
    position,
    active,
}: {
    position: Coordinates | null;
    active: boolean;
}) {
    const map = useMap();

    useEffect(() => {
        if (!active || !position) return;

        map.flyTo(
            [position.lat, position.lng],
            17,
            {
                animate: true,
                duration: 0.5,
            },
        );
    }, [map, position, active]);

    return null;
}

function getDistanceToRoute(
    position: Coordinates,
    points: [number, number][],
): number {
    if (points.length < 2) return Infinity;

    const latScale = 111_320;
    const lngScale =
        111_320 * Math.cos((position.lat * Math.PI) / 180);

    const px = position.lng * lngScale;
    const py = position.lat * latScale;
    let minDistance = Infinity;

    for (let i = 0; i < points.length - 1; i++) {
        const ax = points[i][1] * lngScale;
        const ay = points[i][0] * latScale;
        const bx = points[i + 1][1] * lngScale;
        const by = points[i + 1][0] * latScale;

        const dx = bx - ax;
        const dy = by - ay;
        const lengthSquared = dx * dx + dy * dy;

        const t = lengthSquared === 0
            ? 0
            : Math.max(
                0,
                Math.min(
                    1,
                    ((px - ax) * dx + (py - ay) * dy) /
                    lengthSquared,
                ),
            );

        const nearestX = ax + t * dx;
        const nearestY = ay + t * dy;

        minDistance = Math.min(
            minDistance,
            Math.hypot(px - nearestX, py - nearestY),
        );
    }

    return minDistance;
}

function MapPicker({
    active,
    onPick,
}: {
    active: boolean;
    onPick: (position: Coordinates) => void;
}) {
    useMapEvents({
        click(event) {
            if (!active) return;
            onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
        },
    });

    return null;
}

export default function NavigationMap({
    route,
    baseline,
    hazards,
    roadHazards,
    origin,
    destination,
    onReroute,
    onPickLocation,
    pickTarget,
    onCancelPick,
}: NavigationMapProps) {
    const routePoints = useMemo(() => toLatLngs(route), [route]);
    const baselinePoints = useMemo(() => toLatLngs(baseline), [baseline]);

    const [isNavigating, setIsNavigating] = useState(false);
    const [currentPosition, setCurrentPosition] =
        useState<Coordinates | null>(null);
    const [gpsError, setGpsError] = useState("");
    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

    const lastRerouteAt = useRef(0);
    // const deviationCount = useRef(0);

    useEffect(() => {
        if (!isNavigating) return;

        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            ({ coords }) => {
                setCurrentPosition({
                    lat: coords.latitude,
                    lng: coords.longitude,
                });
                setGpsAccuracy(coords.accuracy);
                setGpsError("");
            },
            (error) => {
                const message =
                    error.code === error.PERMISSION_DENIED
                        ? "Izin lokasi ditolak. Aktifkan izin lokasi browser."
                        : error.code === error.TIMEOUT
                            ? "Waktu mendapatkan lokasi habis. Coba lagi."
                            : "Lokasi GPS tidak tersedia.";

                setGpsError(message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 15000,
            },
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isNavigating]);

    const remainingDistance = (() => {
        if (!routePoints.length || !currentPosition) {
            return route?.distance ?? 0;
        }

        const distanceBetween = (
            a: [number, number],
            b: [number, number],
        ) => {
            const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
            const earthRadius = 6371000;

            const dLat = toRadians(b[0] - a[0]);
            const dLng = toRadians(b[1] - a[1]);
            const lat1 = toRadians(a[0]);
            const lat2 = toRadians(b[0]);

            const value =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1) *
                Math.cos(lat2) *
                Math.sin(dLng / 2) ** 2;

            return earthRadius * 2 * Math.atan2(
                Math.sqrt(value),
                Math.sqrt(1 - value),
            );
        };

        const userPoint: [number, number] = [
            currentPosition.lat,
            currentPosition.lng,
        ];

        let nearestIndex = 0;
        let nearestDistance = Infinity;

        routePoints.forEach((point, index) => {
            const distance = distanceBetween(userPoint, point);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });

        let remaining = nearestDistance;

        for (let i = nearestIndex; i < routePoints.length - 1; i++) {
            remaining += distanceBetween(routePoints[i], routePoints[i + 1]);
        }

        return Math.round(remaining);
    })();

    const remainingDuration =
        route && route.distance > 0
            ? Math.round(route.duration * remainingDistance / route.distance)
            : 0;

    const formatDistance = (meters: number) =>
        meters >= 1000
            ? `${(meters / 1000).toFixed(1)} km`
            : `${meters} m`;

    const formatDuration = (seconds: number) => {
        const minutes = Math.ceil(seconds / 60);

        if (minutes < 60) return `${minutes} menit`;

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        return remainingMinutes
            ? `${hours} jam ${remainingMinutes} menit`
            : `${hours} jam`;
    };

    useEffect(() => {
        if (!isNavigating || !currentPosition || routePoints.length < 2) {
            return;
        }

        const distance = getDistanceToRoute(currentPosition, routePoints);

        if (distance > 50 && Date.now() - lastRerouteAt.current >= 5000) {
            lastRerouteAt.current = Date.now();
            onReroute(currentPosition);
        }
    }, [isNavigating, currentPosition, routePoints, onReroute]);

    return (
        <div className="relative z-10 h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:h-[540px] lg:h-[calc(100vh-250px)] lg:min-h-[560px]">
            <MapContainer
                center={defaultCenter}
                zoom={13}
                scrollWheelZoom
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitRoute
                    route={route}
                    origin={origin}
                    destination={destination}
                />

                <FollowUserPosition
                    position={currentPosition}
                    active={isNavigating}
                />

                <MapPicker active={pickTarget !== null} onPick={onPickLocation} />

                {baselinePoints.length > 1 && (
                    <Polyline
                        positions={baselinePoints}
                        pathOptions={{
                            color: "#94a3b8",
                            weight: 5,
                            opacity: 0.65,
                            dashArray: "8 8",
                        }}
                    />
                )}

                {routePoints.length > 1 && (
                    <Polyline
                        positions={routePoints}
                        pathOptions={{
                            color: "#2563eb",
                            weight: 6,
                            opacity: 0.95,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                )}

                {origin && !isNavigating && (
                    <Marker
                        position={[origin.lat, origin.lng]}
                        icon={originIcon}
                        zIndexOffset={1000}
                    >
                        <Popup>Lokasi awal</Popup>
                    </Marker>
                )}

                {destination && (
                    <Marker
                        position={[destination.lat, destination.lng]}
                        icon={destinationIcon}
                        zIndexOffset={1000}
                    >
                        <Popup>Lokasi tujuan</Popup>
                    </Marker>
                )}

                {isNavigating && currentPosition && (
                    <Marker
                        position={[currentPosition.lat, currentPosition.lng]}
                        icon={navigationIcon}
                        zIndexOffset={2000}
                    >
                        <Popup>
                            <div>
                                <p className="font-semibold">Posisi kamu</p>
                                {gpsAccuracy !== null && (
                                    <p className="text-sm">
                                        Akurasi GPS sekitar {Math.round(gpsAccuracy)} meter
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                )}

                {hazards.map((hazard) => {
                    const severity = hazard.severity?.toLowerCase() ?? "";
                    const color = severityColors[severity] ?? "#DC2626";

                    return (
                        <Marker
                            key={hazard.id}
                            position={[hazard.lat, hazard.lng]}
                            icon={createHazardIcon(color)}
                        >
                            <Popup minWidth={220} maxWidth={220} className="hazard-popup">
                                <div className="w-[220px] overflow-hidden">
                                    {hazard.images?.[0] && (
                                        <img
                                            src={hazard.images[0]}
                                            alt={hazard.title}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                            }}
                                            className="mb-3 h-28 w-full rounded-lg object-cover"
                                        />
                                    )}

                                    <h3 className="mb-2 text-sm font-semibold leading-snug text-slate-900">
                                        {hazard.title}
                                    </h3>

                                    <p className="mb-3 text-xs leading-relaxed text-slate-600">
                                        {hazard.address}
                                    </p>

                                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-slate-500">
                                                Tingkat kerusakan
                                            </span>

                                            <span
                                                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${hazard.severity === "berat"
                                                    ? "bg-red-100 text-red-700"
                                                    : hazard.severity === "sedang"
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-emerald-100 text-emerald-700"
                                                    }`}
                                            >
                                                {hazard.severity === "berat"
                                                    ? "Berat"
                                                    : hazard.severity === "sedang"
                                                        ? "Sedang"
                                                        : "Ringan"}
                                            </span>
                                        </div>

                                        {hazard.status && (
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs text-slate-500">
                                                    Status laporan
                                                </span>

                                                <span
                                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${hazard.status === "diproses"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : hazard.status === "diverifikasi"
                                                            ? "bg-violet-100 text-violet-700"
                                                            : hazard.status === "selesai"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-slate-100 text-slate-700"
                                                        }`}
                                                >
                                                    {hazard.status === "diproses"
                                                        ? "Sedang diproses"
                                                        : hazard.status === "diverifikasi"
                                                            ? "Terverifikasi"
                                                            : hazard.status === "selesai"
                                                                ? "Selesai"
                                                                : hazard.status.charAt(0).toUpperCase() +
                                                                hazard.status.slice(1)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                <HazardMarkers hazards={roadHazards} />
            </MapContainer>

            {pickTarget && (
                <div className="absolute left-4 right-4 top-4 z-[1000] flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-3 shadow-lg sm:right-auto sm:max-w-sm">
                    <p className="text-sm font-semibold text-slate-800">
                        Ketuk peta untuk memilih{" "}
                        {pickTarget === "origin" ? "lokasi awal" : "lokasi tujuan"}
                    </p>
                    <button
                        type="button"
                        onClick={onCancelPick}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Batal
                    </button>
                </div>
            )}

            {route && !pickTarget && (
                <div className="absolute left-4 right-4 top-4 z-[1000] rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:left-auto sm:right-4 sm:w-72">
                    {isNavigating ? (
                        <>
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                Navigasi aktif
                            </p>

                            <div className="mt-2 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Jarak tersisa
                                    </p>
                                    <p className="text-lg font-bold text-slate-900">
                                        {formatDistance(remainingDistance)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Estimasi waktu
                                    </p>
                                    <p className="text-lg font-bold text-slate-900">
                                        {formatDuration(remainingDuration)}
                                    </p>
                                </div>
                            </div>

                            {gpsError && (
                                <p role="alert" className="mt-3 text-xs text-red-600">
                                    {gpsError}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsNavigating(false)}
                                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Hentikan navigasi
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="font-semibold text-slate-900">
                                Rute aman siap digunakan
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {formatDistance(route.distance)} ·{" "}
                                {formatDuration(route.duration)}
                            </p>

                            {gpsError && (
                                <p role="alert" className="mt-2 text-xs text-red-600">
                                    {gpsError}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setGpsError("");
                                    if (!navigator.geolocation) {
                                        setGpsError("Browser tidak mendukung GPS.");
                                        return;
                                    }
                                    setIsNavigating(true);
                                }}
                                className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                Mulai navigasi
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-[500] flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-white/70 bg-white/95 px-3 py-2.5 text-xs shadow-lg backdrop-blur">
                <span className="flex items-center gap-2">
                    <span className="h-2.5 w-5 rounded-full bg-emerald-600" />
                    Rute aman
                </span>

                {baselinePoints.length > 0 && (
                    <span className="flex items-center gap-2">
                        <span className="h-2.5 w-5 rounded-full bg-slate-400" />
                        Rute pembanding
                    </span>
                )}

                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-600" />
                    Ringan
                </span>

                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
                    Sedang
                </span>

                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                    Berat
                </span>

                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                    Lokasi awal
                </span>

                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    Lokasi tujuan
                </span>
            </div>
        </div>
    );
}
