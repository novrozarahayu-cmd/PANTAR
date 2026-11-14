
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    MapPin,
    RefreshCw,
    UserRound,
} from "lucide-react";
import { getReportProgress } from "./api/reports.api";
import type { ReportItem, ReportStatus } from "./types/reports.types";
import { useLocation, useNavigate, useParams } from "react-router";
import { getReportImages } from "../../../utils/get-default-image";

type ReportProgress = {
    _id: string;
    report: string;
    title: string;
    description: string;
    status: string;
    cost: string;
    images: string[];
    createdBy: string;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
};

type ReportProgressResponse = {
    data: ReportProgress[];
    meta: {
        reportStatus: ReportStatus;
        totalItems: number;
    };
};

const statusStyles: Record<ReportStatus, string> = {
    menunggu: "bg-amber-50 text-amber-700 ring-amber-200",
    diverifikasi: "bg-teal-50 text-teal-700 ring-teal-200",
    diproses: "bg-lime-50 text-lime-700 ring-lime-200",
    selesai: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    ditolak: "bg-rose-50 text-rose-700 ring-rose-200",
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatStatus(status: string) {
    const labels: Record<string, string> = {
        menunggu: "Menunggu",
        diverifikasi: "Diverifikasi",
        diproses: "Sedang Diproses",
        dikerjakan: "Sedang Dikerjakan",
        selesai: "Selesai",
        ditolak: "Ditolak",
    };

    return labels[status.toLowerCase()] ?? status;
}

const formatRupiah = (value: number | undefined) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value ?? 0);

function formatReportType(type: string) {
    return type
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function isReportStatus(status: string): status is ReportStatus {
    return [
        "menunggu",
        "diverifikasi",
        "diproses",
        "selesai",
        "ditolak",
    ].includes(status);
}

function ReportStatusBadge({ status }: { status: string }) {
    const { t } = useTranslation();
    const normalizedStatus = status.toLowerCase();

    const className = isReportStatus(normalizedStatus)
        ? statusStyles[normalizedStatus]
        : "bg-slate-100 text-slate-700 ring-slate-200";

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}
        >
            {t(`status.${normalizedStatus}`, formatStatus(status))}
        </span>
    );
}

export default function ReportDetailPage() {
    const { t } = useTranslation();
    const { reportId } = useParams<{ reportId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const report = (location.state as { report?: ReportItem } | null)?.report;

    const [progress, setProgress] = useState<ReportProgressResponse | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const displayLoading = Boolean(reportId) && isLoading;
    const displayError = reportId
        ? error
        : "ID pengaduan tidak ditemukan.";

    const reportImages = getReportImages(report?.images);

    useEffect(() => {
        if (!reportId) {
            return;
        }

        let cancelled = false;

        async function loadProgress() {
            setIsLoading(true);
            setError("");

            try {
                const response = await getReportProgress(reportId!);

                if (cancelled) return;

                setProgress(response);
            } catch (err) {
                if (cancelled) return;

                console.error("Gagal mengambil progres pengaduan:", err);
                setError(
                    "Progres pengaduan gagal dimuat. Silakan coba kembali.",
                );
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        void loadProgress();

        return () => {
            cancelled = true;
        };
    }, [reportId]);

    const reportStatus = progress?.meta.reportStatus ?? report?.status;
    const progressItems = [...(progress?.data ?? [])].sort(
        (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
    );

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant",
        });
    }, []);

    return (
        <main className="min-h-screen bg-[#f6faf7] pt-20">
            <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-700"
                >
                    <ArrowLeft size={18} />
                    {t("reports.detail.backToList", "Kembali ke daftar pengaduan")}
                </button>

                <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#10b981] px-6 py-7 text-white sm:px-8">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-100">
                        {t("reports.detail.title", "Detail Pengaduan")}
                    </p>

                    <h1 className="max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                        {report?.title ?? t("reports.detail.title", "Informasi Pengaduan")}
                    </h1>

                    <p className="mt-3 break-all text-xs text-emerald-100 sm:text-sm">
                        ID Pengaduan: {reportId}
                    </p>

                    {reportStatus && (
                        <div className="mt-4">
                            <ReportStatusBadge status={reportStatus} />
                        </div>
                    )}
                </section>

                <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">
                                    Informasi Pengaduan
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Rincian laporan masyarakat
                                </p>
                            </div>
                        </div>

                        {report ? (
                            <div className="space-y-5">

                                {reportImages.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {reportImages.map((image, index) => (
                                            <a
                                                key={image._id ?? `${image.public_id}-${index}`}
                                                href={image.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="overflow-hidden rounded-xl bg-slate-100"
                                            >
                                                <img
                                                    src={image.url}
                                                    alt={`Foto pengaduan ${index + 1}`}
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = "/indonesia-city.jpg";
                                                    }}
                                                    className="h-36 w-full object-cover transition duration-300 hover:scale-105"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl bg-slate-100">
                                        <img
                                            src={"/indonesia-city.jpg"}
                                            alt="Tidak ada foto pengaduan"
                                            className="h-36 w-full object-cover"
                                        />
                                    </div>
                                )}


                                <div>
                                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Deskripsi
                                    </p>
                                    <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                                        {report.description}
                                    </p>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin
                                            size={18}
                                            className="mt-0.5 shrink-0 text-emerald-600"
                                        />
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Lokasi pengaduan
                                            </p>
                                            <p className="mt-1 text-sm leading-5 text-slate-700">
                                                {report.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <div className="flex items-start gap-3">
                                        <CalendarDays
                                            size={18}
                                            className="mt-0.5 shrink-0 text-emerald-600"
                                        />
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Tanggal pengaduan
                                            </p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {formatDate(report.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <div className="flex items-start gap-3">
                                        <FileText
                                            size={18}
                                            className="mt-0.5 shrink-0 text-emerald-600"
                                        />

                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Tipe pelaporan
                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">
                                                {report.type ? formatReportType(report.type) : "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <div className="flex items-start gap-3">
                                        <Clock3
                                            size={18}
                                            className="mt-0.5 shrink-0 text-emerald-600"
                                        />
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Tingkat kerusakan
                                            </p>
                                            <p className="mt-1 text-sm capitalize text-slate-700">
                                                {report.severity}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-sm leading-6 text-slate-600">
                                    Rincian lengkap pengaduan tidak tersedia
                                    pada navigasi ini. Riwayat progres tetap
                                    dapat dilihat di sebelah kanan.
                                </p>
                            </div>
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="font-bold text-slate-800">
                                    Progres Perbaikan
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Riwayat penanganan pengaduan
                                </p>
                            </div>

                            {!displayLoading && (
                                <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {progressItems.length} progres
                                </span>
                            )}
                        </div>

                        {displayLoading ? (
                            <div className="space-y-5">
                                {[1, 2].map((item) => (
                                    <div
                                        key={item}
                                        className="animate-pulse space-y-3"
                                    >
                                        <div className="h-3 w-32 rounded bg-slate-100" />
                                        <div className="h-5 w-3/4 rounded bg-slate-100" />
                                        <div className="h-16 rounded-xl bg-slate-100" />
                                    </div>
                                ))}
                            </div>
                        ) : displayError ? (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center">
                                <p className="text-sm text-rose-700">{displayError}</p>
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-rose-700 hover:text-rose-900"
                                >
                                    <RefreshCw size={15} />
                                    Coba lagi
                                </button>
                            </div>
                        ) : progressItems.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <Clock3 size={26} />
                                </div>

                                <h3 className="font-semibold text-slate-800">
                                    Belum Ada Progres Perbaikan
                                </h3>

                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                    Pengaduan telah tercatat. Informasi
                                    perkembangan penanganan akan ditampilkan
                                    di sini setelah petugas menambahkan
                                    progres perbaikan.
                                </p>

                                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-50 p-3 text-left">
                                    <Clock3
                                        size={18}
                                        className="shrink-0 text-slate-400"
                                    />
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700">
                                            Menunggu pembaruan
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Belum ada aktivitas perbaikan
                                            yang dilaporkan.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                {progressItems.map((item, index) => (
                                    <article
                                        key={item._id}
                                        className="relative pb-8 last:pb-0"
                                    >
                                        {index < progressItems.length - 1 && (
                                            <div className="absolute bottom-0 left-[15px] top-8 w-0.5 bg-emerald-100" />
                                        )}

                                        <div className="relative flex items-start gap-4">
                                            <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-white shadow-sm">
                                                <CheckCircle2 size={15} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-slate-400">
                                                    {formatDate(item.createdAt)}
                                                </p>

                                                <h3 className="mt-2 text-base font-semibold leading-6 text-slate-800">
                                                    {item.title}
                                                </h3>

                                                <div className="mt-2">
                                                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                        {formatStatus(item.status)}
                                                    </span>
                                                </div>

                                                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                                                    {item.description}
                                                </p>

                                                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                                                    <span className="text-xs font-medium text-slate-500">
                                                        Biaya penanganan
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-800">
                                                        {formatRupiah(Number(item.cost ?? 0))}
                                                    </span>
                                                </div>

                                                {item.images?.length > 0 && (
                                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                                        {item.images.map(
                                                            (image, imageIndex) => (
                                                                <a
                                                                    key={`${image}-${imageIndex}`}
                                                                    href={image}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
                                                                >
                                                                    <img
                                                                        src={image}
                                                                        alt={`Foto progres ${imageIndex + 1}`}
                                                                        loading="lazy"
                                                                        className="h-32 w-full object-cover transition hover:scale-105 sm:h-40"
                                                                    />
                                                                </a>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
                                                    <UserRound size={14} />
                                                    <span>
                                                        Diperbarui oleh{" "}
                                                        <span className="font-medium text-slate-600">
                                                            {item.createdByName || "Petugas"}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
