
import { useEffect, useState } from "react";
import { Crosshair, LoaderCircle, MapPin, Search, X } from "lucide-react";
import type { LocationSuggestion } from "../types/routes.types";
import { REGION } from "../config/region";

interface LocationSearchProps {
    label: string;
    placeholder: string;
    value: LocationSuggestion | null;
    onSelect: (location: LocationSuggestion | null) => void;
    onUseCurrentLocation?: () => void;
    onPickFromMap?: () => void;
    isGettingLocation?: boolean;
}

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    name?: string;
}

export default function LocationSearch({
    label,
    placeholder,
    value,
    onSelect,
    onUseCurrentLocation,
    onPickFromMap,
    isGettingLocation = false,
}: LocationSearchProps) {
    const [query, setQuery] = useState(value?.displayName ?? "");
    const [results, setResults] = useState<LocationSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");

    const [previousValue, setPreviousValue] = useState({
        id: value?.id,
        displayName: value?.displayName,
    });

    if (
        previousValue.id !== value?.id ||
        previousValue.displayName !== value?.displayName
    ) {
        setPreviousValue({ id: value?.id, displayName: value?.displayName });
        if (value) setQuery(value.displayName);
    }

    useEffect(() => {
        if (!query.trim() || query.trim() === value?.displayName) return;

        const controller = new AbortController();

        const timeout = window.setTimeout(async () => {
            setIsLoading(true);
            setError("");

            try {

                const params = new URLSearchParams({
                    q: `${query}, ${REGION.name}, ${REGION.state}, Indonesia`,
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

                if (controller.signal.aborted) return;
                setResults(
                    data.map((item) => ({
                        id: String(item.place_id),
                        name: item.name || item.display_name.split(",")[0],
                        displayName: item.display_name,
                        lat: Number(item.lat),
                        lng: Number(item.lon),
                    })),
                );

                setIsOpen(true);
            } catch (error) {
                if (error instanceof Error && error.name !== "AbortError") {
                    setError("Lokasi gagal dicari. Silakan coba kembali.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, 500);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [query, value?.displayName]);

    const shouldSearch = query.trim() !== "" && query.trim() !== value?.displayName;
    const visibleResults = shouldSearch ? results : [];
    const isSearchLoading = shouldSearch && isLoading;

    const handleSelect = (location: LocationSuggestion) => {
        setQuery(location.displayName);
        setResults([]);
        setIsOpen(false);
        setError("");
        onSelect(location);
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
        setError("");
        onSelect(null);
    };

    return (
        <div className="relative">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </label>

            <div
                className={`flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 transition ${isOpen
                    ? "border-emerald-400 ring-4 ring-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                    }`}
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <MapPin size={18} />
                </span>

                <input
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setResults([]);
                        setError("");

                        if (value) onSelect(null);

                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => {
                        window.setTimeout(() => setIsOpen(false), 150);
                    }}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />

                {isSearchLoading ? (
                    <LoaderCircle size={17} className="shrink-0 animate-spin text-emerald-600" />
                ) : value ? (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Hapus lokasi"
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={16} />
                    </button>
                ) : (
                    <Search size={17} className="shrink-0 text-slate-400" />
                )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
                {onUseCurrentLocation && (
                    <button
                        type="button"
                        onClick={onUseCurrentLocation}
                        disabled={isGettingLocation}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                    >
                        <Crosshair size={14} />
                        {isGettingLocation ? "Mencari lokasi..." : "Gunakan lokasi saat ini"}
                    </button>
                )}

                {onPickFromMap && (
                    <button
                        type="button"
                        onClick={onPickFromMap}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700"
                    >
                        <MapPin size={14} />
                        Pilih dari peta
                    </button>
                )}
            </div>


            {isOpen && shouldSearch && (
                <div className="absolute inset-x-0 top-full z-[1000] mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    {isSearchLoading && (
                        <p className="px-4 py-3 text-sm text-slate-500">
                            Mencari lokasi...
                        </p>
                    )}

                    {!isSearchLoading && visibleResults.length > 0 && (
                        <ul>
                            {visibleResults.map((location) => (
                                <li key={location.id}>
                                    <button
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => handleSelect(location)}
                                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-emerald-50"
                                    >
                                        <MapPin
                                            size={17}
                                            className="mt-0.5 shrink-0 text-slate-400"
                                        />
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-slate-800">
                                                {location.name}
                                            </span>
                                            <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                                                {location.displayName}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {!isSearchLoading && !error && visibleResults.length === 0 && (
                        <p className="px-4 py-3 text-sm text-slate-500">
                            Tidak ada lokasi ditemukan. Coba nama jalan atau tempat lain.
                        </p>
                    )}

                    {error && (
                        <p className="px-4 py-3 text-sm text-red-600">{error}</p>
                    )}
                </div>
            )}
        </div>
    );
}
