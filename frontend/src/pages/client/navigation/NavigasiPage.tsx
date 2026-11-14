
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    CarFront,
    Footprints,
    LoaderCircle,
    Route as RouteIcon,
    ShieldCheck,
    Bike,
} from "lucide-react";
import { getSafeRoute } from "./api/routes.api";
import LocationSearch from "./components/LocationSearch";
import NavigationMap from "./components/NavigationMap";
import RouteSummary from "./components/RouteSummary";
import type {
    Coordinates,
    LocationSuggestion,
    RouteRequest,
    SafeRouteData,
    VehicleType,
} from "./types/routes.types";
import { getApiErrorMessage } from "../../../utils/api-error";
import { isInsideRegion, REGION } from "./config/region";
import type { RoadHazardFeature } from "./types/hazards.types";
import { getRoadHazards } from "./api/hazards.api";

interface NavigationForm {
    origin: LocationSuggestion | null;
    destination: LocationSuggestion | null;
    vehicle: VehicleType;
}

const initialForm: NavigationForm = {
    origin: null,
    destination: null,
    vehicle: "mobil",
};

async function getRoadName({ lat, lng }: Coordinates): Promise<string> {
    const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "jsonv2",
        addressdetails: "1",
        zoom: "18",
    });

    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        {
            headers: {
                Accept: "application/json",
            },
        },
    );

    if (!response.ok) {
        throw new Error("Gagal mendapatkan nama jalan.");
    }

    const data = await response.json();
    const address = data.address ?? {};

    return (
        address.road ||
        address.pedestrian ||
        address.residential ||
        address.footway ||
        address.path ||
        address.neighbourhood ||
        address.suburb ||
        data.name ||
        data.display_name ||
        "Lokasi terpilih"
    );
}

const vehicles: {
    value: VehicleType;
    label: string;
    icon: typeof CarFront;
}[] = [
        { value: "mobil", label: "Mobil", icon: CarFront },
        { value: "motor", label: "Motor", icon: Bike },
        { value: "jalan_kaki", label: "Jalan kaki", icon: Footprints },
    ];

export default function NavigasiPage() {
    const { t } = useTranslation();
    const [form, setForm] = useState<NavigationForm>(initialForm);
    const [routeData, setRouteData] = useState<SafeRouteData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [mapTarget, setMapTarget] = useState<
        "origin" | "destination" | null
    >(null);

    const [locationError, setLocationError] = useState("");
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [roadHazards, setRoadHazards] = useState<RoadHazardFeature[]>([]);
    const [isRerouting, setIsRerouting] = useState(false);


    const updateForm = <K extends keyof NavigationForm>(
        field: K,
        value: NavigationForm[K],
    ) => {
        setForm((current) => ({ ...current, [field]: value }));
        setError("");
        setRouteData(null);
    };

    const handleFindRoute = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setRouteData(null);

        if (!form.origin || !form.destination) {
            setError("Pilih lokasi awal dan lokasi tujuan dari hasil pencarian.");
            return;
        }

        if (
            !isInsideRegion(form.origin.lat, form.origin.lng) ||
            !isInsideRegion(form.destination.lat, form.destination.lng)
        ) {
            setError(
                `Lokasi awal dan tujuan harus berada di wilayah ${REGION.name}.`,
            );
            return;
        }

        const payload: RouteRequest = {
            origin: {
                lat: form.origin.lat,
                lng: form.origin.lng,
            },
            destination: {
                lat: form.destination.lat,
                lng: form.destination.lng,
            },
            vehicle: form.vehicle,
        };

        setIsLoading(true);

        try {
            const response = await getSafeRoute(payload);

            if (!response.success || !response.data?.route?.geometry?.coordinates?.length) {
                throw new Error(
                    response.message || "Backend tidak mengembalikan rute yang valid.",
                );
            }

            setRouteData(response.data);
        } catch (requestError: unknown) {
            setError(getApiErrorMessage(requestError, "Rute gagal ditemukan."));
        } finally {
            setIsLoading(false);
        }
    };

    const createLocationFromCoordinates = (
        coordinates: Coordinates,
        label: string,
    ): LocationSuggestion => ({
        id: `custom-${coordinates.lat}-${coordinates.lng}`,
        name: label,
        displayName: label,
        lat: coordinates.lat,
        lng: coordinates.lng,
    });

    const handlePickFromMap = async (coordinates: Coordinates) => {
        if (!mapTarget) return;

        try {
            const roadName = await getRoadName(coordinates);

            updateForm(
                mapTarget,
                {
                    id: `custom-${coordinates.lat}-${coordinates.lng}`,
                    name: roadName,
                    displayName: roadName,
                    lat: coordinates.lat,
                    lng: coordinates.lng,
                },
            );

            setMapTarget(null);
        } catch (error) {
            console.error("Gagal mendapatkan nama jalan:", error);

            updateForm(
                mapTarget,
                {
                    id: `custom-${coordinates.lat}-${coordinates.lng}`,
                    name: "Lokasi terpilih",
                    displayName: "Lokasi terpilih",
                    lat: coordinates.lat,
                    lng: coordinates.lng,
                },
            );

            setMapTarget(null);
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Browser tidak mendukung akses lokasi.");
            return;
        }

        setIsGettingLocation(true);
        setLocationError("");

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const coordinates = {
                    lat: coords.latitude,
                    lng: coords.longitude,
                };

                updateForm(
                    "origin",
                    createLocationFromCoordinates(coordinates, "Lokasi saat ini"),
                );

                setIsGettingLocation(false);
            },
            () => {
                setLocationError(
                    "Lokasi saat ini tidak dapat diakses. Periksa izin lokasi perangkat.",
                );
                setIsGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
            },
        );
    };

    const mapRef = useRef<HTMLElement>(null);

    const handleOpenMapPicker = (target: "origin" | "destination") => {
        setMapTarget(target);
        // di mobile, peta ada di bawah form
        mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const handleReroute = async (position: Coordinates) => {
        if (!form.destination || isRerouting) return;

        setIsRerouting(true);

        try {
            const response = await getSafeRoute({
                origin: position,
                destination: {
                    lat: form.destination.lat,
                    lng: form.destination.lng,
                },
                vehicle: form.vehicle,
            });

            if (
                !response.success ||
                !response.data?.route?.geometry?.coordinates?.length
            ) {
                throw new Error(
                    response.message || "Gagal menghitung ulang rute aman.",
                );
            }

            setRouteData(response.data);
        } catch (error: unknown) {
            console.error("Gagal menghitung ulang rute:", error);
        } finally {
            setIsRerouting(false);
        }
    };

    useEffect(() => {
        async function fetchRoadHazards() {
            try {
                const response = await getRoadHazards();
                setRoadHazards(response.data.features);
            } catch (error) {
                console.error("Gagal mengambil data jalan rusak:", error);
            }
        }

        fetchRoadHazards();
    }, []);

    const hazards = routeData
        ? Array.from(
            new Map(
                [
                    ...(routeData.avoided ?? []),
                    ...(routeData.baseline?.hazards ?? []),
                    ...(routeData.baseline?.passableHazards ?? []),
                    ...(routeData.route.hazards ?? []),
                    ...(routeData.route.passableHazards ?? []),
                ].map((hazard) => [hazard.id, hazard]),
            ).values(),
        )
        : [];

    const originCoordinates = form.origin
        ? { lat: form.origin.lat, lng: form.origin.lng }
        : null;

    const destinationCoordinates = form.destination
        ? { lat: form.destination.lat, lng: form.destination.lng }
        : null;

    return (
        <main className="min-h-screen text-slate-900 lg:mx-20 pt-20">
            <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
                <div className="mb-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                        <ShieldCheck size={15} />
                        {t("navigation.title", "Navigasi berbasis laporan kerusakan")}
                    </div>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                        {t("navigation.title", "Navigasi Pintar")}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                        {t("navigation.subtitle", "Temukan rute perjalanan dan lihat informasi jalan rusak agar perjalananmu lebih aman.")}
                    </p>
                </div>

                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[350px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
                    <aside className="space-y-5">
                        <form
                            onSubmit={handleFindRoute}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="text-base font-bold">{t("navigation.title", "Rencanakan perjalanan")}</h2>
                                <RouteIcon size={19} className="text-emerald-600" />
                            </div>

                            <div className="relative space-y-4">

                                <LocationSearch
                                    label={t("navigation.originLabel", "Lokasi awal")}
                                    placeholder={t("navigation.originPlaceholder", "Cari alamat atau nama tempat")}
                                    value={form.origin}
                                    onSelect={(location) => updateForm("origin", location)}
                                    onUseCurrentLocation={handleUseCurrentLocation}
                                    onPickFromMap={() => handleOpenMapPicker("origin")}
                                    isGettingLocation={isGettingLocation}
                                />

                                <LocationSearch
                                    label={t("navigation.destinationLabel", "Lokasi tujuan")}
                                    placeholder={t("navigation.destinationPlaceholder", "Cari jalan atau tempat tujuan")}
                                    value={form.destination}
                                    onSelect={(location) => updateForm("destination", location)}
                                    onPickFromMap={() => handleOpenMapPicker("destination")}
                                    isGettingLocation={isGettingLocation}
                                />

                                {locationError && (
                                    <p role="alert" className="mt-3 text-sm text-red-600">
                                        {locationError}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {t("navigation.vehicleLabel", "Jenis kendaraan")}
                                </p>

                                <div className="grid grid-cols-3 gap-2">
                                    {vehicles.map((vehicle) => {
                                        const Icon = vehicle.icon;
                                        const selected = form.vehicle === vehicle.value;

                                        return (
                                            <button
                                                key={vehicle.value}
                                                type="button"
                                                aria-pressed={selected}
                                                onClick={() => updateForm("vehicle", vehicle.value)}
                                                className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-semibold transition ${selected
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100"
                                                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <Icon size={20} />
                                                {t(`vehicle.${vehicle.value}`, vehicle.label)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {error && (
                                <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-relaxed text-red-700">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <>
                                        <LoaderCircle className="animate-spin" size={17} />
                                        {t("navigation.calculatingBtn", "Mencari rute...")}
                                    </>
                                ) : (
                                    <>
                                        <RouteIcon size={17} />
                                        {t("navigation.findRouteBtn", "Cari Rute Aman")}
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>

                            <p className="mt-3 text-xs leading-relaxed text-slate-400">
                                Pilih lokasi dari saran pencarian agar koordinat dapat
                                digunakan untuk menghitung rute.
                            </p>
                        </form>

                        {routeData && <RouteSummary data={routeData} />}
                    </aside>

                    <section className="min-w-0">
                        <NavigationMap
                            route={routeData?.route ?? null}
                            baseline={routeData?.baseline ?? null}
                            hazards={hazards}
                            roadHazards={roadHazards}
                            origin={originCoordinates}
                            destination={destinationCoordinates}
                            onReroute={handleReroute}
                            onPickLocation={handlePickFromMap}
                            pickTarget={mapTarget}
                            onCancelPick={() => setMapTarget(null)}
                        />

                        {isRerouting && (
                            <p className="mt-2 text-sm font-medium text-emerald-600">
                                Menghitung ulang rute aman...
                            </p>
                        )}

                        {!routeData && (
                            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white p-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <ShieldCheck size={20} />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        Rencanakan rute yang lebih aman
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                        Cari lokasi awal dan tujuan, kemudian sistem akan menghitung rute berdasarkan data
                                        kerusakan yang tersedia.
                                    </p>
                                </div>
                            </div>
                        )}

                        {routeData && (
                            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                <ShieldCheck
                                    size={20}
                                    className="mt-0.5 shrink-0 text-emerald-600"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-900">
                                        Rute berhasil ditemukan
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                                        {routeData.message ||
                                            "Rute ditampilkan berdasarkan hasil perhitungan backend."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

        </main>
    );
}
