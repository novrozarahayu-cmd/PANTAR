import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    AlertCircle,
    ArrowDownUp,
    ArrowUpRight,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    FilePlus2,
    FileText,
    MapPin,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";
import { getReports, getReportSummary } from "./api/reports.api.ts";
import type {
    ReportItem,
    ReportSeverity,
    ReportStatus,
    ReportSummaryItem,
} from "./types/reports.types.ts";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";


type StatusTab = "semua" | "menunggu" | "diproses" | "selesai";

const tabs: { label: string; value: StatusTab }[] = [
    { label: "Semua Laporan", value: "semua" },
    { label: "Menunggu Proses", value: "menunggu" },
    { label: "Sedang Diproses", value: "diproses" },
    { label: "Selesai", value: "selesai" },
];

const statusLabels: Record<ReportStatus, string> = {
    menunggu: "Menunggu",
    diverifikasi: "Diverifikasi",
    diproses: "Sedang diproses",
    selesai: "Selesai",
    ditolak: "Ditolak",
};

const statusStyles: Record<ReportStatus, string> = {
    menunggu: "bg-amber-50 text-amber-700 ring-amber-200",
    diverifikasi: "bg-teal-50 text-teal-700 ring-teal-200",
    diproses: "bg-lime-50 text-lime-700 ring-lime-200",
    selesai: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    ditolak: "bg-rose-50 text-rose-700 ring-rose-200",
};

const severityStyles = {
    ringan: "bg-slate-100 text-slate-600",
    sedang: "bg-orange-50 text-orange-700",
    berat: "bg-rose-50 text-rose-700",
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function formatSeverity(value: ReportItem["severity"]) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatReportType(type: string) {
    return type
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function ReportCard({ report }: { report: ReportItem }) {
    const { t } = useTranslation();

    const navigate = useNavigate();

    const firstImage = report.images?.[0];

    const image =
        firstImage?.resource_type === "image"
            ? firstImage.url
            : "/indonesia-city.jpg";

    return (
        <article
            onClick={() =>
                navigate(`/pengaduan/${report._id}/detail`, {
                    state: { report },
                })
            } className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-200/50">
            <div className="relative h-48 overflow-hidden bg-slate-100">
                {image ? (
                    <img
                        src={image}
                        alt={report.title}
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/indonesia-city.jpg";
                        }}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                        <FileText size={30} strokeWidth={1.5} />
                        <span className="text-xs">{t("reports.detail.photos", "Tidak ada foto")}</span>
                    </div>
                )}

                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                        {t(`type.${report.type}`, formatReportType(report.type))}
                    </span>

                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${severityStyles[report.severity] ?? severityStyles.sedang
                            }`}
                    >
                        {t("common.severity", "Kerusakan")} {t(`severity.${report.severity}`, formatSeverity(report.severity))}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-800">
                        {report.title}
                    </h3>

                    <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyles[report.status]
                            }`}
                    >
                        {t(`status.${report.status}`, statusLabels[report.status])}
                    </span>
                </div>

                <p className="mb-4 line-clamp-2 text-sm leading-5 text-slate-500">
                    {report.description}
                </p>

                <div className="mt-auto space-y-3 border-t border-slate-100 pt-3">
                    <div className="flex items-start gap-2 text-sm text-slate-500">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span className="line-clamp-2">{report.address}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <CalendarDays size={14} />
                        <span>{t("reports.detail.reportedAt", "Dilaporkan")} {formatDate(report.createdAt)}</span>
                    </div>
                </div>
            </div>
        </article>
    );
}

const MEDAN_DISTRICTS = [
    "Medan Amplas",
    "Medan Area",
    "Medan Barat",
    "Medan Baru",
    "Medan Belawan",
    "Medan Deli",
    "Medan Denai",
    "Medan Helvetia",
    "Medan Johor",
    "Medan Kota",
    "Medan Labuhan",
    "Medan Maimun",
    "Medan Marelan",
    "Medan Perjuangan",
    "Medan Petisah",
    "Medan Polonia",
    "Medan Selayang",
    "Medan Sunggal",
    "Medan Tembung",
    "Medan Timur",
    "Medan Tuntungan",
];

function DistrictChart({ districts }: { districts: ReportSummaryItem[] }) {
    const districtTotals = MEDAN_DISTRICTS.map((name) => ({
        name,
        total:
            districts.find(
                (district) =>
                    district.name.trim().toLowerCase() === name.toLowerCase(),
            )?.total ?? 0,
    }));

    const chartWidth = 1050;
    const chartHeight = 310;
    const chartTop = 20;
    const chartBottom = 205;
    const chartHeightValue = chartBottom - chartTop;
    const chartLeft = 30;
    const maxValue = Math.max(
        ...districtTotals.map((district) => district.total),
        1,
    );
    const maxScale = Math.ceil(maxValue / 5) * 5 || 1;
    const slotWidth = (chartWidth - chartLeft - 15) / districtTotals.length;
    const barWidth = Math.min(24, slotWidth * 0.58);

    return (
        <div className="w-full">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-500">
                    Jumlah laporan pada setiap kecamatan
                </p>

                <p className="text-xs text-slate-400">
                    {districtTotals.filter((item) => item.total > 0).length}
                    {" "}dari 21 kecamatan memiliki laporan
                </p>
            </div>

            <div className="w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="block w-full min-w-[760px]"
                    role="img"
                    aria-label="Grafik jumlah pengaduan pada 21 kecamatan Kota Medan"
                >
                    {/* Garis bantu dan skala vertikal */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y =
                            chartBottom - ratio * chartHeightValue;

                        return (
                            <g key={ratio}>
                                <line
                                    x1={chartLeft}
                                    y1={y}
                                    x2={chartWidth - 10}
                                    y2={y}
                                    stroke="#E2E8F0"
                                    strokeDasharray={ratio === 0 ? "0" : "4 4"}
                                />
                                <text
                                    x={chartLeft - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#94A3B8"
                                >
                                    {Math.round(maxScale * ratio)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Batang vertikal untuk setiap kecamatan */}
                    {districtTotals.map((district, index) => {
                        const x =
                            chartLeft +
                            index * slotWidth +
                            (slotWidth - barWidth) / 2;

                        const barHeight =
                            (district.total / maxScale) * chartHeightValue;

                        const y = chartBottom - barHeight;

                        return (
                            <g key={district.name}>
                                <title>
                                    {district.name}: {district.total} laporan
                                </title>

                                <rect
                                    x={x}
                                    y={district.total > 0 ? y : chartBottom - 2}
                                    width={barWidth}
                                    height={district.total > 0 ? barHeight : 2}
                                    rx={4}
                                    fill={
                                        district.total > 0
                                            ? "#059669"
                                            : "#CBD5E1"
                                    }
                                    className="transition-colors hover:fill-emerald-400"
                                />

                                {district.total > 0 && (
                                    <text
                                        x={x + barWidth / 2}
                                        y={y - 6}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fontWeight="600"
                                        fill="#334155"
                                    >
                                        {district.total}
                                    </text>
                                )}

                                <text
                                    transform={`translate(${x + barWidth / 2}, ${chartBottom + 10}) rotate(-50)`}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#64748B"
                                >
                                    {district.name.replace("Medan ", "")}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                Ada laporan
                <span className="ml-3 h-2.5 w-2.5 rounded-sm bg-slate-300" />
                Belum ada laporan
            </div>
        </div>
    );
}

const SEVERITIES: { key: ReportSeverity; label: string; color: string }[] = [
    { key: "ringan", label: "Ringan", color: "#10B981" },
    { key: "sedang", label: "Sedang", color: "#EAB308" },
    { key: "berat", label: "Berat", color: "#EF4444" },
];

function SeverityChart({
    data,
}: {
    data: { total: number; severity: ReportSeverity }[];
}) {
    const { t } = useTranslation();

    const counts = SEVERITIES.map((item) => ({
        ...item,
        value:
            data.find((d) => String(d.severity).toLowerCase() === item.key)
                ?.total ?? 0,
    }));
    const sum = counts.reduce((acc, item) => acc + item.value, 0);

    if (sum === 0) {
        return (
            <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-slate-400">
                <FileText size={26} strokeWidth={1.5} />
                <span className="text-sm">Belum ada data tingkat kerusakan</span>
            </div>
        );
    }

    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    const visible = counts.filter((item) => item.value > 0);
    const gap = visible.length > 1 ? 3 : 0;

    let offset = 0;
    const segments = visible.map((item) => {
        const length = (item.value / sum) * circumference;
        const segment = { ...item, length: Math.max(length - gap, 0), offset };
        offset += length;
        return segment;
    });

    return (
        <div className="flex h-full flex-col">
            <div className="relative mx-auto mb-6 h-44 w-44">
                <svg
                    viewBox="0 0 180 180"
                    className="h-full w-full -rotate-90"
                    role="img"
                    aria-label={`Tingkat kerusakan, total ${sum} laporan`}
                >
                    <circle
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="none"
                        stroke="#EEF3F0"
                        strokeWidth="18"
                    />
                    {segments.map((segment) => (
                        <circle
                            key={segment.key}
                            cx="90"
                            cy="90"
                            r={radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="18"
                            strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                            strokeDashoffset={-segment.offset}
                        >
                            <title>{`${segment.label}: ${segment.value}`}</title>
                        </circle>
                    ))}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight text-slate-900">
                        {sum.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-slate-500">laporan</span>
                </div>
            </div>

            <ul className="space-y-2.5">
                {counts.map((item) => {
                    const percent = Math.round((item.value / sum) * 100);
                    return (
                        <li key={item.key} className="flex items-center gap-3 text-sm">
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="flex-1 text-slate-600">
                                {t(`severity.${item.key}`, item.label)}
                            </span>
                            <span className="font-semibold tabular-nums text-slate-800">
                                {item.value.toLocaleString("id-ID")}
                            </span>
                            <span className="w-10 text-right text-xs tabular-nums text-slate-400">
                                {percent}%
                            </span>
                        </li>
                    );
                })}
            </ul>

        </div>
    );
}

const DISMISS_KEY = "report-cta-bubble-dismissed";

function Mascot() {
    return (
        <svg
            viewBox="0 0 100 75"
            className="h-14 w-14 drop-shadow-md sm:h-16 sm:w-16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M23 34C15 18 27 7 41 10C51 0 67 7 71 15C86 17 86 31 77 42L70 48H30L23 34Z"
                fill="#047857"
            />
            <path
                d="M29 29C29 17 38 14 49 15C62 13 74 21 73 32L69 44H32L29 29Z"
                fill="#F8FAFC"
            />
            <ellipse cx="42" cy="29" rx="4" ry="5" fill="#1E293B" />
            <ellipse cx="60" cy="29" rx="4" ry="5" fill="#1E293B" />
            <circle cx="43" cy="27.5" r="1.3" fill="white" />
            <circle cx="61" cy="27.5" r="1.3" fill="white" />
            <circle cx="32" cy="37" r="4" fill="#FDBA74" />
            <circle cx="70" cy="37" r="4" fill="#FDBA74" />
            <path
                d="M45 36C49 41 55 41 59 36"
                stroke="#047857"
                strokeWidth="2.8"
                strokeLinecap="round"
            />
            <path
                d="M30 46C39 41 62 41 71 46L77 61C62 69 39 69 24 61L30 46Z"
                fill="#10B981"
            />
            <path
                d="M40 49L51 57L62 49"
                stroke="#D1FAE5"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M28 51L19 59M73 51L82 57"
                stroke="#047857"
                strokeWidth="6"
                strokeLinecap="round"
            />
            <path
                d="M39 64L36 70M63 64L66 70"
                stroke="#047857"
                strokeWidth="6"
                strokeLinecap="round"
            />
            <path
                d="M85 8L88 15L95 18L88 21L85 28L82 21L75 18L82 15L85 8Z"
                fill="#F59E0B"
            />
        </svg>
    );
}

function AddReportFloatingButton() {
    const { t } = useTranslation();
    const reduceMotion = useReducedMotion();
    const [showBubble, setShowBubble] = useState(false);

    // Bubble muncul setelah jeda singkat, dan tidak muncul lagi
    // pada sesi yang sama setelah ditutup.
    useEffect(() => {
        let dismissed = false;
        try {
            dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
        } catch {
            /* storage tidak tersedia */
        }
        if (dismissed) return;

        const timer = window.setTimeout(() => setShowBubble(true), 1800);
        return () => window.clearTimeout(timer);
    }, []);

    const dismissBubble = () => {
        setShowBubble(false);
        try {
            sessionStorage.setItem(DISMISS_KEY, "1");
        } catch {
            /* abaikan */
        }
    };

    return (
        <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-10 sm:bottom-8 sm:right-8">
            {/* Bubble ajakan: hanya di layar sm ke atas agar tidak menutupi konten di HP */}
            <AnimatePresence>
                {showBubble && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        role="status"
                        className="relative hidden max-w-[240px] rounded-2xl border border-emerald-100 bg-white py-3 pl-4 pr-9 shadow-lg shadow-emerald-900/10 sm:block"
                    >
                        <p className="text-xs text-slate-500">{t("home.finalCta.bubbleQuestion", "Ada pengaduan?")}</p>
                        <p className="text-sm font-semibold text-slate-800">
                            {t("home.finalCta.bubbleAction", "Yuk, sampaikan di sini.")}
                        </p>

                        <button
                            type="button"
                            onClick={dismissBubble}
                            aria-label="Tutup ajakan"
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            <X size={14} />
                        </button>

                        {/* Ekor bubble mengarah ke maskot */}
                        <span
                            aria-hidden="true"
                            className="absolute -bottom-1.5 right-9 h-3 w-3 rotate-45 border-b border-r border-emerald-100 bg-white"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative pt-2">
                {/* Maskot mengintip di atas tombol */}
                <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-1 -top-9 z-10"
                    animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
                    transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <Mascot />
                </motion.div>

                <Link
                    to="/form-pengaduan"
                    aria-label="Buat laporan pengaduan baru"
                    className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-emerald-700 to-emerald-600 py-2.5 pl-3 pr-4 text-white shadow-lg shadow-emerald-900/25 ring-1 ring-white/10 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40"
                >
                    {/* Kilau saat hover */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100 motion-reduce:hidden"
                    />

                    {/* Ikon dengan denyut halus */}
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                        <span
                            aria-hidden="true"
                            className="absolute inset-0 rounded-full bg-white/40 animate-ping [animation-duration:2.4s] motion-reduce:hidden"
                        />
                        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-700 transition-transform duration-200 group-hover:rotate-6">
                            <FilePlus2 size={22} strokeWidth={2.2} />
                        </span>
                    </span>

                    <span className="relative flex flex-col gap-0.5">
                        <span className="whitespace-nowrap text-sm font-bold sm:text-base">
                            {t("nav.reportNow", "Buat Laporan")}
                        </span>
                        <span className="hidden whitespace-nowrap text-xs text-emerald-100 sm:block">
                            {t("reports.subtitle", "Sampaikan pengaduanmu")}
                        </span>
                    </span>

                    <ArrowUpRight
                        size={19}
                        className="relative ml-1 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                </Link>
            </div>
        </div>
    );
}


export default function ReportListPage() {
    const { t } = useTranslation();
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [districts, setDistricts] = useState<ReportSummaryItem[]>([]);
    const [totalReports, setTotalReports] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<StatusTab>("semua");
    const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "">("");

    const [selectedSeverity, setSelectedSeverity] = useState("");
    const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">("terbaru");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusSummary, setStatusSummary] = useState<
        { total: number; status: ReportStatus }[]
    >([]);

    const [severitySummary, setSeveritySummary] = useState<
        { total: number; severity: ReportSeverity }[]
    >([]);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timeout);
    }, [search]);

    const visibleStatuses: ReportStatus[] = [
        "menunggu",
        "diproses",
        "selesai",
    ];

    const totalLaporan = visibleStatuses.reduce((total, status) => {
        return (
            total +
            (statusSummary.find((item) => item.status === status)?.total ?? 0)
        );
    }, 0);

    const pageSize = 9;

    const pageStart =
        totalReports === 0 ? 0 : (currentPage - 1) * pageSize + 1;

    const pageEnd = Math.min(currentPage * pageSize, totalReports);

    useEffect(() => {
        let cancelled = false;

        async function loadReports() {
            setIsLoading(true);
            setError("");

            try {
                const status =
                    selectedStatus ||
                    (activeTab === "semua" ? undefined : activeTab);

                const [listResponse, summaryResponse] = await Promise.all([
                    getReports({
                        page: currentPage,
                        limit: pageSize,
                        search: debouncedSearch,
                        status,
                    }),
                    getReportSummary(),
                ]);

                if (cancelled) return;

                setReports(listResponse.data);

                setTotalReports(listResponse.meta.totalItems);
                setTotalPages(Math.max(listResponse.meta.totalPages, 1));

                const summary = summaryResponse.data;
                setStatusSummary(summary.statusSummary ?? []);
                setSeveritySummary(summary.severitySummary ?? []);
                console.log(summary.severitySummary)
                setDistricts(
                    summary.district?.length
                        ? summary.district
                        : summary.village ?? [],
                );
            } catch (err) {
                if (cancelled) return;

                console.error("Gagal mengambil data pengaduan:", err);
                setError("Data pengaduan gagal dimuat. Silakan coba kembali.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        void loadReports();

        return () => {
            cancelled = true;
        };
    }, [currentPage, activeTab, selectedStatus, debouncedSearch]);

    const filteredReports = useMemo(() => {
        return reports
            .filter((report) => {
                return (
                    !selectedSeverity ||
                    report.severity === selectedSeverity
                );
            })
            .sort((a, b) => {
                const difference =
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime();

                return sortOrder === "terbaru"
                    ? -difference
                    : difference;
            });
    }, [reports, selectedSeverity, sortOrder]);

    const changeTab = (tab: StatusTab) => {
        setActiveTab(tab);
        setSelectedStatus("");
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedSeverity("");
        setSelectedStatus("");
        setActiveTab("semua");
        setCurrentPage(1);
        setSortOrder("terbaru");
    };

    return (
        <>
            <main className="min-h-screen bg-[#f6faf7] pt-20">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#10b981] px-6 py-8 text-white sm:px-9 sm:py-10">
                        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[36px] border-white/5" />
                        <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-lime-300/10 blur-2xl" />

                        <div className="relative max-w-2xl">
                            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                Transparansi untuk lingkungan yang lebih baik
                            </span>

                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Pengaduan Masyarakat
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100 sm:text-base">
                                Pantau laporan kerusakan infrastruktur di sekitar Anda dan
                                ikuti perkembangan penanganannya secara terbuka.
                            </p>
                        </div>
                    </section>

                    <section className="mb-7 space-y-5">
                        {/* Ringkasan Status */}
                        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                            {[
                                {
                                    label: t("reports.totalReports", "Total Laporan"),
                                    value: totalLaporan,
                                    description: "Menunggu, diproses, dan selesai",
                                    color: "indigo",
                                    icon: FileText,
                                },
                                {
                                    label: t("status.menunggu", "Menunggu"),
                                    value:
                                        statusSummary.find(
                                            (item) => item.status === "menunggu",
                                        )?.total ?? 0,
                                    description: "Menanti penanganan",
                                    color: "amber",
                                    icon: Clock3,
                                },
                                {
                                    label: t("status.diproses", "Sedang Diproses"),
                                    value:
                                        statusSummary.find(
                                            (item) => item.status === "diproses",
                                        )?.total ?? 0,
                                    description: "Dalam penanganan",
                                    color: "blue",
                                    icon: SlidersHorizontal,
                                },
                                {
                                    label: t("status.selesai", "Selesai"),
                                    value:
                                        statusSummary.find(
                                            (item) => item.status === "selesai",
                                        )?.total ?? 0,
                                    description: "Penanganan selesai",
                                    color: "emerald",
                                    icon: FileText,
                                },
                            ].map((item) => {
                                const styles = {
                                    indigo: {
                                        icon: "bg-green-50 text-green-600",
                                        number: "text-green-700",
                                    },
                                    amber: {
                                        icon: "bg-amber-50 text-amber-600",
                                        number: "text-amber-700",
                                    },
                                    blue: {
                                        icon: "bg-lime-50 text-lime-600",
                                        number: "text-lime-700",
                                    },
                                    emerald: {
                                        icon: "bg-emerald-50 text-emerald-600",
                                        number: "text-emerald-700",
                                    },
                                }[item.color];

                                const Icon = item.icon;

                                return (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium text-slate-500">
                                                {item.label}
                                            </p>

                                            <div
                                                className={`rounded-xl p-2.5 ${styles?.icon}`}
                                            >
                                                <Icon size={19} />
                                            </div>
                                        </div>

                                        <p
                                            className={`mt-3 text-3xl font-bold tracking-tight ${styles?.number}`}
                                        >
                                            {item.value.toLocaleString("id-ID")}
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-400">
                                            {item.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grafik */}
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                            {/* Distribusi Kecamatan */}
                            <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                                <div className="mb-4">
                                    <h2 className="text-base font-bold text-slate-800">
                                        Kerusakan per Kecamatan
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Distribusi pengaduan di Kota Medan
                                    </p>
                                </div>

                                <DistrictChart districts={districts} />
                            </div>

                            {/* Tingkat Kerusakan */}
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                                <div className="mb-5">
                                    <h2 className="text-base font-bold text-slate-800">
                                        Tingkat Kerusakan
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Jumlah laporan berdasarkan tingkat keparahan
                                    </p>
                                </div>

                                <SeverityChart data={severitySummary} />
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="mb-4">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                {t("reports.listTitle", "Daftar Pengaduan")}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {t("reports.listSubtitle", "Temukan laporan dan lihat status penanganannya.")}
                            </p>
                        </div>

                        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                            <div className="relative min-w-0 flex-1">
                                <Search
                                    size={18}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={t("reports.searchPlaceholder", "Cari judul, lokasi, atau kata kunci...")}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        aria-label="Hapus pencarian"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFilterOpen((value) => !value)}
                                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${isFilterOpen || selectedSeverity || selectedStatus
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <SlidersHorizontal size={17} />
                                    Filter
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSortOrder((value) =>
                                            value === "terbaru" ? "terlama" : "terbaru",
                                        )
                                    }
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    <ArrowDownUp size={16} />
                                    {sortOrder === "terbaru" ? "Terbaru" : "Terlama"}
                                </button>
                            </div>
                        </div>

                        {isFilterOpen && (
                            <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Tingkat kerusakan
                                    <select
                                        value={selectedSeverity}
                                        onChange={(event) => setSelectedSeverity(event.target.value)}
                                        className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-normal outline-none focus:border-emerald-400"
                                    >
                                        <option value="">Semua tingkat</option>
                                        <option value="ringan">Ringan</option>
                                        <option value="sedang">Sedang</option>
                                        <option value="berat">Berat</option>
                                    </select>
                                </label>

                                <label className="text-sm font-medium text-slate-700">
                                    Status laporan
                                    <select
                                        value={selectedStatus}
                                        onChange={(event) => {
                                            setSelectedStatus(event.target.value as ReportStatus | "");
                                            setActiveTab("semua");
                                            setCurrentPage(1);
                                        }}
                                        className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-normal outline-none focus:border-emerald-400"
                                    >
                                        <option value="">Semua status</option>
                                        <option value="menunggu">Menunggu</option>
                                        <option value="diverifikasi">Diverifikasi</option>
                                        <option value="diproses">Sedang diproses</option>
                                        <option value="selesai">Selesai</option>
                                        <option value="ditolak">Ditolak</option>
                                    </select>
                                </label>

                                <div className="sm:col-span-2">
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                                    >
                                        Reset semua filter
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => changeTab(tab.value)}
                                    className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${activeTab === tab.value && !selectedStatus
                                        ? "border-emerald-600 text-emerald-700"
                                        : "border-transparent text-slate-500 hover:text-slate-800"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                                <AlertCircle size={19} className="shrink-0" />
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => page)}
                                    className="ml-auto font-semibold underline"
                                >
                                    Tutup
                                </button>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {Array.from({ length: 6 }, (_, index) => (
                                    <div
                                        key={index}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                                    >
                                        <div className="h-48 animate-pulse bg-slate-100" />
                                        <div className="space-y-3 p-4">
                                            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                                            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                                            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredReports.length ? (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredReports.map((report) => (
                                    <ReportCard key={report._id} report={report} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                    <Search size={22} />
                                </div>
                                <h3 className="font-semibold text-slate-800">
                                    Pengaduan tidak ditemukan
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Coba gunakan kata kunci atau filter yang berbeda.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                                >
                                    Hapus filter
                                </button>
                            </div>
                        )}

                        {!isLoading && totalReports > 0 && (
                            <div className="mt-7 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500">
                                    Menampilkan{" "}
                                    <span className="font-semibold text-slate-700">
                                        {pageStart}–{pageEnd}
                                    </span>{" "}
                                    dari{" "}
                                    <span className="font-semibold text-slate-700">
                                        {totalReports}
                                    </span>{" "}
                                    laporan
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage((page) => page - 1)}
                                        aria-label="Halaman sebelumnya"
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <span className="min-w-24 text-center text-sm font-medium text-slate-600">
                                        Halaman {currentPage} dari {totalPages}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage((page) => page + 1)}
                                        aria-label="Halaman berikutnya"
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <AddReportFloatingButton />
        </>
    );
}
