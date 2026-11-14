import { useEffect, useState } from "react";
import {
    ArrowUpRight,
    Clock3,
    Eye,
    FileText,
    MapPin,
    RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import type { ReportImage } from "../../../../client/reports/types/reports.types";

type TodayReport = {
    _id: string;
    title: string;
    description?: string;
    address?: string;
    severity: string;
    status: string;
    type: string;
    images?: ReportImage[];
    createdAt: string;
};

type TodayResponse = {
    data: TodayReport[];
    meta: { totalItems: number };
};

const statusStyles: Record<string, string> = {
    menunggu: "bg-amber-50 text-amber-700 ring-amber-200",
    diverifikasi: "bg-teal-50 text-teal-700 ring-teal-200",
    diproses: "bg-lime-50 text-lime-700 ring-lime-200",
    selesai: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    ditolak: "bg-rose-50 text-rose-700 ring-rose-200",
};

const statusLabels: Record<string, string> = {
    menunggu: "Menunggu",
    diverifikasi: "Diverifikasi",
    diproses: "Diproses",
    selesai: "Selesai",
    ditolak: "Ditolak",
};

const severityStyles: Record<string, string> = {
    ringan: "bg-slate-100 text-slate-600",
    sedang: "bg-orange-50 text-orange-700",
    berat: "bg-rose-50 text-rose-700",
};

const timeLabel = (value: string) =>
    new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));

const todayLabel = () =>
    new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date());

function formatReportType(type: string) {
    return type
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export default function TodayReportsTable({
    load,
}: {
    /** Fungsi pengambil data, mis. () => getAdminReports({ page: 1, limit: 10, today: true }) */
    load: () => Promise<TodayResponse>;
}) {
    const navigate = useNavigate();
    const [reports, setReports] = useState<TodayReport[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            setLoading(true);
            setError("");
            try {
                const response = await load();
                if (cancelled) return;
                setReports(response.data);
                setTotalItems(response.meta.totalItems);
            } catch {
                if (!cancelled) setError("Laporan hari ini gagal dimuat.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void run();
        return () => {
            cancelled = true;
        };
    }, [load, reloadKey]);

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">Laporan hari ini</h3>
                        {!loading && !error && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                {totalItems.toLocaleString("id-ID")}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{todayLabel()}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setReloadKey((key) => key + 1)}
                        disabled={loading}
                        aria-label="Muat ulang laporan hari ini"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-700 disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>
                    <Link
                        to="/admin/reports"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                        Lihat semua <ArrowUpRight size={15} />
                    </Link>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                >
                    {error}
                    <button
                        onClick={() => setReloadKey((key) => key + 1)}
                        className="ml-2 font-semibold underline"
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                        <tr className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-5 py-3.5">Laporan</th>
                            <th className="px-4 py-3.5">Lokasi</th>
                            <th className="px-4 py-3.5">Kerusakan</th>
                            <th className="px-4 py-3.5">Tipe</th>
                            <th className="px-4 py-3.5">Status</th>
                            <th className="px-4 py-3.5">Waktu</th>
                            <th className="px-5 py-3.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading
                            ? Array.from({ length: 3 }).map((_, index) => (
                                <tr key={index}>
                                    <td colSpan={6} className="px-5 py-5">
                                        <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
                                    </td>
                                </tr>
                            ))
                            : reports.map((report) => (
                                <tr
                                    key={report._id}
                                    className="group transition hover:bg-emerald-50/30"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex min-w-[250px] items-center gap-3">
                                            <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                                {report.images?.[0] ? (
                                                    <img
                                                        src={
                                                            report.images?.[0]?.resource_type === "image" &&
                                                                report.images[0].url
                                                                ? report.images[0].url
                                                                : "/indonesia-city.jpg"
                                                        }
                                                        alt={report.title}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                        onError={(event) => {
                                                            event.currentTarget.onerror = null;
                                                            event.currentTarget.src = "/indonesia-city.jpg";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-slate-400">
                                                        <FileText size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="line-clamp-1 text-sm font-semibold text-slate-800">
                                                    {report.title}
                                                </p>
                                                <p className="mt-1 line-clamp-1 max-w-[250px] text-xs text-slate-400">
                                                    {report.description}
                                                </p>
                                                <p className="mt-1 text-[10px] text-slate-400">
                                                    ID: {report._id.slice(-8)}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex max-w-[230px] items-start gap-2 text-xs leading-5 text-slate-500">
                                            <MapPin
                                                size={15}
                                                className="mt-0.5 shrink-0 text-emerald-700"
                                            />
                                            <span className="line-clamp-2">
                                                {report.address || "Lokasi belum tersedia"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${severityStyles[report.severity] ?? severityStyles.sedang
                                                }`}
                                        >
                                            {report.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${severityStyles[report.severity] ?? severityStyles.sedang
                                                }`}
                                        >
                                            {formatReportType(report.type)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyles[report.status] ??
                                                "bg-slate-100 text-slate-600 ring-slate-200"
                                                }`}
                                        >
                                            {statusLabels[report.status] ?? report.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock3 size={14} className="shrink-0 text-slate-400" />
                                            <span>{timeLabel(report.createdAt)}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() =>
                                                navigate(`/admin/reports/${report._id}`, {
                                                    state: { report },
                                                })
                                            }
                                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-600 hover:bg-emerald-700 hover:text-white"
                                        >
                                            <Eye size={14} /> Kelola
                                        </button>
                                    </td>
                                </tr>
                            ))}

                        {!loading && !error && reports.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-5 py-14 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                        <FileText size={22} />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-slate-700">
                                        Belum ada laporan hari ini
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Laporan baru dari masyarakat akan muncul di sini.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && !error && totalItems > reports.length && (
                <div className="border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500">
                    Menampilkan {reports.length} dari {totalItems.toLocaleString("id-ID")}{" "}
                    laporan hari ini.{" "}
                    <Link
                        to="/admin/reports"
                        className="font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                        Lihat sisanya
                    </Link>
                </div>
            )}
        </section>
    );
}