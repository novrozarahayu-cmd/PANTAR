import { useEffect, useState } from "react";
import {
    Copy,
    Crosshair,
    LoaderCircle,
    MapPin,
    MousePointer2,
    Search,
    X,
} from "lucide-react";
import {
    CircleMarker,
    MapContainer,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";

interface ReportLocationProps {
    latitude: number | null;
    longitude: number | null;
    onCoordinatesChange: (latitude: number, longitude: number) => void;
    locationError?: string;
}

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    name?: string;
}

const defaultCenter: [number, number] = [3.587576, 98.642247];

function MapClickHandler({
    onCoordinatesChange,
}: {
    onCoordinatesChange: (latitude: number, longitude: number) => void;
}) {
    useMapEvents({
        click(event) {
            onCoordinatesChange(event.latlng.lat, event.latlng.lng);
        },
    });


    return null;
}

function RecenterMap({ position }: { position: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        map.setView(position, 17);
    }, [map, position[0], position[1]]);

    return null;
}

export default function ReportLocation({
    latitude,
    longitude,
    onCoordinatesChange,
    locationError,
}: ReportLocationProps) {
    const [locating, setLocating] = useState(
        () => typeof navigator !== "undefined" && Boolean(navigator.geolocation),
    );
    const [locationMessage, setLocationMessage] = useState(() =>
        typeof navigator !== "undefined" && !navigator.geolocation
            ? "Browser tidak mendukung akses lokasi perangkat."
            : "",
    );
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [selectedPlace, setSelectedPlace] = useState("");

    const position: [number, number] =
        latitude !== null && longitude !== null
            ? [latitude, longitude]
            : defaultCenter;


    useEffect(() => {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                onCoordinatesChange(
                    coords.latitude,
                    coords.longitude,
                );
                setLocationMessage("Lokasi perangkat berhasil ditemukan.");
                setLocating(false);
            },
            () => {
                setLocationMessage(
                    "Lokasi tidak dapat diakses. Pilih titik pada peta atau gunakan tombol Lokasi saya.",
                );
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
            },
        );
    }, []);

    useEffect(() => {
        const trimmedQuery = query.trim();

        if (
            trimmedQuery.length < 3 ||
            trimmedQuery === selectedPlace
        ) {
            return;
        }

        const controller = new AbortController();

        const timeout = window.setTimeout(async () => {
            setIsSearching(true);
            setSearchError("");

            try {
                const params = new URLSearchParams({
                    q: `${trimmedQuery}, Medan, Sumatera Utara, Indonesia`,
                    format: "jsonv2",
                    addressdetails: "1",
                    limit: "5",
                    countrycodes: "id",
                });

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?${params}`,
                    {
                        signal: controller.signal,
                        headers: {
                            Accept: "application/json",
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error("Pencarian lokasi gagal.");
                }

                const data: NominatimResult[] = await response.json();

                if (!controller.signal.aborted) {
                    setResults(data);
                    setIsSearchOpen(true);
                }
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.name !== "AbortError"
                ) {
                    setSearchError("Lokasi gagal dicari. Silakan coba kembali.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        }, 500);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [query, selectedPlace]);

    const handleMapCoordinatesChange = (
        nextLatitude: number,
        nextLongitude: number,
    ) => {
        onCoordinatesChange(nextLatitude, nextLongitude);
        setQuery("");
        setResults([]);
        setIsSearchOpen(false);
        setSearchError("");
        setSelectedPlace("Titik yang dipilih pada peta");
        setLocationMessage("");
    };

    const handleSelectPlace = (place: NominatimResult) => {
        const nextLatitude = Number(place.lat);
        const nextLongitude = Number(place.lon);

        if (
            !Number.isFinite(nextLatitude) ||
            !Number.isFinite(nextLongitude)
        ) {
            setSearchError("Koordinat lokasi tidak valid.");
            return;
        }

        setSelectedPlace(place.display_name);
        setQuery(place.display_name);
        setResults([]);
        setIsSearchOpen(false);
        setSearchError("");

        onCoordinatesChange(nextLatitude, nextLongitude);
        setLocationMessage("Lokasi berhasil dipilih.");
    };

    const getMyLocation = () => {
        if (!navigator.geolocation) {
            setLocationMessage(
                "Browser Anda tidak mendukung lokasi perangkat.",
            );
            return;
        }

        setLocating(true);
        setLocationMessage("");

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                handleMapCoordinatesChange(
                    coords.latitude,
                    coords.longitude,
                );
                setLocationMessage("Lokasi perangkat berhasil digunakan.");
                setLocating(false);
            },
            () => {
                setLocationMessage(
                    "Lokasi tidak dapat diakses. Izinkan akses lokasi atau pilih titik di peta.",
                );
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
            },
        );
    };

    const copyCoordinates = async () => {
        if (latitude === null || longitude === null) return;

        try {
            await navigator.clipboard.writeText(
                `${latitude}, ${longitude}`,
            );
            setLocationMessage("Koordinat berhasil disalin.");
        } catch {
            setLocationMessage(
                "Koordinat tidak dapat disalin dari browser ini.",
            );
        }
    };

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <MapPin size={20} />
                </span>

                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        Lokasi kerusakan
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        Cari nama jalan atau pilih titik kerusakan langsung
                        pada peta.
                    </p>
                </div>
            </div>

            <div className="relative z-[1000] mb-4">
                <label
                    htmlFor="report-location-search"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Cari nama jalan atau tempat
                </label>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50">
                    {isSearching ? (
                        <LoaderCircle
                            size={18}
                            className="shrink-0 animate-spin text-emerald-600"
                        />
                    ) : (
                        <Search
                            size={18}
                            className="shrink-0 text-slate-400"
                        />
                    )}

                    <input
                        id="report-location-search"
                        type="text"
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setSelectedPlace("");
                            setResults([]);
                            setSearchError("");
                            setIsSearchOpen(true);
                        }}
                        onFocus={() => setIsSearchOpen(true)}
                        onBlur={() => {
                            window.setTimeout(
                                () => setIsSearchOpen(false),
                                150,
                            );
                        }}
                        placeholder="Contoh: Jalan Gatot Subroto"
                        autoComplete="off"
                        className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />

                    {query && (
                        <button
                            type="button"
                            aria-label="Hapus pencarian"
                            onClick={() => {
                                setQuery("");
                                setResults([]);
                                setIsSearchOpen(false);
                                setSearchError("");
                                setSelectedPlace("");
                            }}
                            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {isSearchOpen && query.trim().length >= 3 && (
                    <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                        {isSearching && (
                            <p className="px-4 py-3 text-sm text-slate-500">
                                Mencari jalan atau tempat...
                            </p>
                        )}

                        {!isSearching &&
                            !searchError &&
                            results.length === 0 &&
                            query.trim().length >= 3 &&
                            query.trim() !== selectedPlace && (
                                <p className="px-4 py-3 text-sm text-slate-500">
                                    Tidak ada lokasi ditemukan. Coba nama jalan atau tempat lain.
                                </p>
                            )}

                        {!isSearching &&
                            results.map((place) => (
                                <button
                                    key={place.place_id}
                                    type="button"
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => handleSelectPlace(place)}
                                    className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                                >
                                    <MapPin
                                        size={17}
                                        className="mt-0.5 shrink-0 text-emerald-600"
                                    />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-slate-800">
                                            {place.name ||
                                                place.display_name.split(",")[0]}
                                        </span>
                                        <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                                            {place.display_name}
                                        </span>
                                    </span>
                                </button>
                            ))}

                        {searchError && (
                            <p className="px-4 py-3 text-sm text-red-600">
                                {searchError}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() =>
                        setLocationMessage(
                            "Klik titik lokasi kerusakan langsung pada peta.",
                        )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                    <MousePointer2 size={17} />
                    Pilih titik di peta
                </button>

                <button
                    type="button"
                    onClick={getMyLocation}
                    disabled={locating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                >
                    {locating ? (
                        <LoaderCircle
                            className="animate-spin"
                            size={17}
                        />
                    ) : (
                        <Crosshair size={17} />
                    )}
                    {locating ? "Mencari lokasi..." : "Lokasi saya"}
                </button>
            </div>

            <div className="relative z-0 h-[280px] overflow-hidden rounded-xl border border-slate-200 sm:h-[350px]">
                <MapContainer
                    center={position}
                    zoom={14}
                    scrollWheelZoom
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapClickHandler
                        onCoordinatesChange={handleMapCoordinatesChange}
                    />

                    <RecenterMap position={position} />

                    {latitude !== null && longitude !== null && (
                        <>
                            <CircleMarker
                                center={position}
                                radius={17}
                                pathOptions={{
                                    color: "#059669",
                                    weight: 2,
                                    fillColor: "#059669",
                                    fillOpacity: 0.2,
                                }}
                            />
                            <CircleMarker
                                center={position}
                                radius={7}
                                pathOptions={{
                                    color: "#059669",
                                    weight: 3,
                                    fillColor: "#059669",
                                    fillOpacity: 1,
                                }}
                            />
                        </>
                    )}
                </MapContainer>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Pilih hasil pencarian untuk memindahkan peta ke lokasi tersebut,
                atau klik langsung pada peta untuk menentukan koordinat yang lebih
                tepat.
            </p>

            {selectedPlace && (
                <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                    <span className="font-semibold">Lokasi dipilih: </span>
                    {selectedPlace}
                </div>
            )}

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">
                        Koordinat lokasi
                    </p>

                    <button
                        type="button"
                        onClick={copyCoordinates}
                        disabled={latitude === null || longitude === null}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-40"
                    >
                        <Copy size={14} />
                        Salin
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="latitude"
                            className="mb-1.5 block text-xs text-slate-500"
                        >
                            Latitude
                        </label>
                        <input
                            id="latitude"
                            type="number"
                            step="any"
                            value={latitude ?? ""}
                            onChange={(event) => {
                                const rawValue = event.target.value;
                                if (rawValue === "") return;

                                const nextLatitude = Number(rawValue);

                                if (
                                    Number.isFinite(nextLatitude) &&
                                    nextLatitude >= -90 &&
                                    nextLatitude <= 90
                                ) {
                                    handleMapCoordinatesChange(
                                        nextLatitude,
                                        longitude ?? defaultCenter[1],
                                    );
                                }
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="longitude"
                            className="mb-1.5 block text-xs text-slate-500"
                        >
                            Longitude
                        </label>
                        <input
                            id="longitude"
                            type="number"
                            step="any"
                            value={longitude ?? ""}
                            onChange={(event) => {
                                const rawValue = event.target.value;
                                if (rawValue === "") return;

                                const nextLongitude = Number(rawValue);

                                if (
                                    Number.isFinite(nextLongitude) &&
                                    nextLongitude >= -180 &&
                                    nextLongitude <= 180
                                ) {
                                    handleMapCoordinatesChange(
                                        latitude ?? defaultCenter[0],
                                        nextLongitude,
                                    );
                                }
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />
                    </div>
                </div>

                {locationError && (
                    <p className="mt-2 text-sm text-red-600">
                        {locationError}
                    </p>
                )}

                {locationMessage && (
                    <p
                        aria-live="polite"
                        className="mt-3 text-xs text-slate-500"
                    >
                        {locationMessage}
                    </p>
                )}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs leading-relaxed text-emerald-800">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <p>
                    Koordinat digunakan untuk membantu petugas menemukan lokasi
                    laporan. Pastikan titik yang dipilih benar.
                </p>
            </div>
        </section>
    );
}
