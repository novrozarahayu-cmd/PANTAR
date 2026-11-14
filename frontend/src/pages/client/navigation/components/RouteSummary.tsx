
import { AlertTriangle, CarFront, Clock3, Route as RouteIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SafeRouteData } from "../types/routes.types";

interface RouteSummaryProps {
    data: SafeRouteData;
}

const formatDistance = (meters: number) =>
    meters >= 1000
        ? `${(meters / 1000).toLocaleString("id-ID", {
            maximumFractionDigits: 1,
        })} km`
        : `${Math.round(meters)} m`;

const formatDuration = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);

    if (minutes < 60) return `${minutes} menit`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes
        ? `${hours} jam ${remainingMinutes} menit`
        : `${hours} jam`;
};

export default function RouteSummary({ data }: RouteSummaryProps) {
    const { t } = useTranslation();
    const avoided = data.avoided ?? [];
    const isRedirected = data.status === "dialihkan";

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {t("navigation.routeSummary", "Ringkasan rute")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {formatDistance(data.route.distance)}
                        </h2>
                        <span className="text-sm text-slate-500">
                            {formatDuration(data.route.duration)}
                        </span>
                    </div>
                </div>

                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <RouteIcon size={22} />
                </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                    <CarFront size={18} className="text-slate-500" />
                    <p className="mt-2 text-xs text-slate-500">{t("navigation.vehicleLabel", "Kendaraan")}</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                        {t(`vehicle.${data.vehicle}`, data.vehicle.replace("_", " "))}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                    <Clock3 size={18} className="text-slate-500" />
                    <p className="mt-2 text-xs text-slate-500">{t("navigation.duration", "Estimasi waktu")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDuration(data.route.duration)}
                    </p>
                </div>
            </div>

            {isRedirected && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                    <span className="mt-0.5 text-emerald-700">
                        <RouteIcon size={18} />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-emerald-800">
                            {t("navigation.safeRoute", "Rute dialihkan")}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-emerald-700">
                            {data.message ||
                                "Rute disesuaikan untuk menghindari jalan rusak."}
                        </p>
                    </div>
                </div>
            )}

            {data.baseline && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="mb-3 text-sm font-semibold text-slate-800">
                        {t("navigation.baselineRoute", "Perbandingan rute")}
                    </p>

                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500">{t("navigation.baselineRoute", "Rute pembanding")}</span>
                        <span className="font-medium text-slate-700">
                            {formatDistance(data.baseline.distance)} ·{" "}
                            {formatDuration(data.baseline.duration)}
                        </span>
                    </div>
                </div>
            )}

            {avoided.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle size={17} className="text-red-500" />
                        <h3 className="text-sm font-semibold text-slate-800">
                            {t("navigation.hazardsAvoided", "Jalan yang dihindari")} ({avoided.length})
                        </h3>
                    </div>

                    <ul className="space-y-3">
                        {avoided.map((hazard) => (
                            <li key={hazard.id} className="flex items-start gap-3">
                                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800">
                                        {hazard.title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {hazard.address} · {t("common.severity", "Keparahan")} {t(`severity.${hazard.severity}`, hazard.severity)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
