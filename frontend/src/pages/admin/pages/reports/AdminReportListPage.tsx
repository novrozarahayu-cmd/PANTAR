import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  FileText,
  LoaderCircle,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";
import {
  getAdminReports,
  getValidationStats,
  processValidationQueue,
  updateAdminReportValidation,
  type ValidationStatusStat,
} from "../../api/reports-admin.api";
import type {
  ReportItem,
  ReportStatus,
  ValidationStatus,
} from "../../../client/reports/types/reports.types";
import { getApiErrorMessage } from "../../../../utils/api-error";

const statusOptions: { value: "" | ReportStatus; label: string }[] = [
  { value: "", label: "Semua status" },
  { value: "menunggu", label: "Menunggu" },
  { value: "diverifikasi", label: "Diverifikasi" },
  { value: "diproses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak", label: "Ditolak" },
];

const validationConfig: Record<
  ValidationStatus,
  {
    label: string;
    style: string;
    icon: typeof ShieldCheck;
  }
> = {
  auto_verified: {
    label: "Terverifikasi Otomatis",
    style: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    icon: Sparkles,
  },
  approved: {
    label: "Disetujui",
    style: "bg-teal-50 text-teal-700 ring-teal-600/20",
    icon: CheckCircle2,
  },
  needs_review: {
    label: "Perlu Ditinjau",
    style: "bg-amber-50 text-amber-800 ring-amber-600/25",
    icon: AlertCircle,
  },
  flagged: {
    label: "Ditandai",
    style: "bg-rose-50 text-rose-700 ring-rose-600/20",
    icon: AlertTriangle,
  },
  duplicate: {
    label: "Duplikat",
    style: "bg-purple-50 text-purple-700 ring-purple-600/20",
    icon: Copy,
  },
  rejected: {
    label: "Ditolak",
    style: "bg-red-50 text-red-700 ring-red-600/20",
    icon: XCircle,
  },
  pending: {
    label: "Menunggu Validasi",
    style: "bg-slate-100 text-slate-600 ring-slate-500/20",
    icon: Clock,
  },
};

const validationOptions: { value: "" | ValidationStatus; label: string }[] = [
  { value: "", label: "Semua validasi" },
  { value: "auto_verified", label: validationConfig.auto_verified.label },
  { value: "needs_review", label: validationConfig.needs_review.label },
  { value: "flagged", label: validationConfig.flagged.label },
  { value: "duplicate", label: validationConfig.duplicate.label },
  { value: "approved", label: validationConfig.approved.label },
  { value: "rejected", label: validationConfig.rejected.label },
  { value: "pending", label: validationConfig.pending.label },
];

const validationStatKeys: ValidationStatus[] = [
  "pending",
  "needs_review",
  "flagged",
  "duplicate",
  "auto_verified",
  "approved",
  "rejected",
];

const statusStyles: Record<ReportStatus, string> = {
  menunggu: "bg-amber-50 text-amber-700 ring-amber-200",
  diverifikasi: "bg-sky-50 text-sky-700 ring-sky-200",
  diproses: "bg-blue-50 text-blue-700 ring-blue-200",
  selesai: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ditolak: "bg-rose-50 text-rose-700 ring-rose-200",
};
const severityStyles = {
  ringan: "bg-slate-100 text-slate-600",
  sedang: "bg-orange-50 text-orange-700",
  berat: "bg-rose-50 text-rose-700",
};
const statusLabels: Record<ReportStatus, string> = {
  menunggu: "Menunggu",
  diverifikasi: "Diverifikasi",
  diproses: "Diproses",
  selesai: "Selesai",
  ditolak: "Ditolak",
};
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

function formatReportType(type: string) {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AdminReportListPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"" | ReportStatus>("");
  const [validation, setValidation] = useState<"" | ValidationStatus>("");
  const [severity, setSeverity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [validationStats, setValidationStats] = useState<ValidationStatusStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isInitialProcessing, setIsInitialProcessing] = useState(true);

  // State untuk modal update validasi
  const [validationModalReport, setValidationModalReport] = useState<ReportItem | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | "duplicate">("approved");
  const [decisionNote, setDecisionNote] = useState("");
  const [duplicateOfId, setDuplicateOfId] = useState("");
  const [isSubmittingValidation, setIsSubmittingValidation] = useState(false);

  // Jalankan pemrosesan AI validasi antrean pertama kali sebelum menampilkan konten
  useEffect(() => {
    let cancelled = false;

    async function processAiQueue() {
      try {
        await processValidationQueue(5);
      } catch (err) {
        console.warn("Proses antrean validasi AI dilewati atau gagal:", err);
      } finally {
        if (!cancelled) {
          setIsInitialProcessing(false);
        }
      }
    }

    void processAiQueue();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenValidationModal = (report: ReportItem) => {
    setValidationModalReport(report);
    const existingDecision = (report.validation?.review?.decision as "approved" | "rejected" | "duplicate") || "approved";
    setDecision(existingDecision);
    setDecisionNote(report.validation?.review?.note || "");
    setDuplicateOfId(report.validation?.duplicateOf || "");
  };

  const handleCloseValidationModal = () => {
    if (isSubmittingValidation) return;
    setValidationModalReport(null);
    setDecisionNote("");
    setDuplicateOfId("");
  };

  const handleSubmitValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationModalReport) return;

    if (decision === "duplicate" && !duplicateOfId.trim()) {
      void Swal.fire({
        title: "ID Laporan Wajib",
        text: "Silakan masukkan ID laporan asal untuk status duplikat.",
        icon: "warning",
        confirmButtonColor: "#047857",
      });
      return;
    }

    setIsSubmittingValidation(true);
    try {
      const response = await updateAdminReportValidation(validationModalReport._id, {
        decision,
        note: decisionNote.trim() || undefined,
        duplicateOf: decision === "duplicate" ? duplicateOfId.trim() : undefined,
      });

      // Update data di state lokal
      const updatedReport = response?.data;
      if (updatedReport) {
        setReports((prev) =>
          prev.map((r) =>
            r._id === validationModalReport._id ? { ...r, ...updatedReport } : r,
          ),
        );
      } else {
        setReloadKey((k) => k + 1);
      }

      // Refresh statistik validasi
      try {
        const statsRes = await getValidationStats();
        if (statsRes.data?.byStatus) {
          setValidationStats(statsRes.data.byStatus);
        }
      } catch {
        // Biarkan jika gagal refresh stats
      }

      setValidationModalReport(null);

      void Swal.fire({
        title: "Validasi Diperbarui",
        text: "Keputusan validasi berhasil disimpan.",
        icon: "success",
        confirmButtonColor: "#047857",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, "Gagal memperbarui validasi.");
      void Swal.fire({
        title: "Gagal Menyimpan",
        text: errorMsg,
        icon: "error",
        confirmButtonColor: "#047857",
      });
    } finally {
      setIsSubmittingValidation(false);
    }
  };

  useEffect(() => {
    if (isInitialProcessing) return;
    let cancelled = false;
    async function loadStats() {
      setStatsLoading(true);
      try {
        const response = await getValidationStats();
        if (!cancelled && response.data?.byStatus) {
          setValidationStats(response.data.byStatus);
        }
      } catch {
        if (!cancelled) setValidationStats([]);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [isInitialProcessing, reloadKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (isInitialProcessing) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await getAdminReports({
          page,
          limit: 10,
          search: debouncedSearch,
          status: status || undefined,
          severity: severity || undefined,
          validation: validation || undefined,
        });
        if (cancelled) return;
        setReports(response.data);
        setTotalPages(response.meta.totalPages);
        setTotalItems(response.meta.totalItems);
      } catch {
        if (!cancelled)
          setError("Daftar laporan gagal dimuat. Silakan periksa koneksi API.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [isInitialProcessing, page, debouncedSearch, status, severity, validation, reloadKey]);

  if (isInitialProcessing) {
    return (
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Pusat pengelolaan
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Laporan Pengaduan
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tinjau laporan masyarakat, periksa tingkat kerusakan, dan kelola
              progres penanganan.
            </p>
          </div>
        </section>

        <section className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-8 ring-emerald-50/50">
            <Sparkles size={28} className="animate-pulse text-emerald-600" />
          </div>
          <h3 className="mt-5 text-base font-bold text-slate-900">
            Memproses Validasi AI...
          </h3>
          <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
            Sistem sedang memeriksa dan memproses antrean validasi otomatis serta analisis foto sebelum memuat konten laporan.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-4 py-2 text-xs font-semibold text-emerald-800">
            <LoaderCircle size={15} className="animate-spin text-emerald-700" />
            <span>Mohon tunggu sebentar...</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Pusat pengelolaan
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Laporan Pengaduan
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Tinjau laporan masyarakat, periksa tingkat kerusakan, dan kelola
            progres penanganan.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm text-slate-600">
          <FileText size={17} className="text-emerald-700" />
          <span>
            <strong className="text-slate-900">
              {totalItems.toLocaleString("id-ID")}
            </strong>{" "}
            laporan
          </span>
        </div>
      </section>

      {/* Statistik Status Validasi */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Statistik Validasi Laporan
            </h3>
          </div>
          {validation && (
            <button
              type="button"
              onClick={() => {
                setValidation("");
                setPage(1);
              }}
              className="text-xs font-semibold text-emerald-700 transition hover:underline"
            >
              Reset filter ({validationConfig[validation]?.label || validation})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {statsLoading
            ? Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-xl border border-slate-100 bg-white p-3.5 shadow-xs"
                />
              ))
            : validationStatKeys.map((key) => {
                const config = validationConfig[key];
                const Icon = config.icon;
                const count =
                  validationStats.find((item) => item.status === key)?.total ?? 0;
                const isActive = validation === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setValidation((prev) => (prev === key ? "" : key));
                      setPage(1);
                    }}
                    className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                      isActive
                        ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset ${config.style}`}
                      >
                        <Icon size={14} />
                      </span>
                      {isActive && (
                        <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-xl font-bold tracking-tight text-slate-900">
                        {count.toLocaleString("id-ID")}
                      </p>
                      <p
                        className="mt-0.5 truncate text-xs font-medium text-slate-500"
                        title={config.label}
                      >
                        {config.label}
                      </p>
                    </div>
                  </button>
                );
              })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Daftar laporan masyarakat
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Pilih laporan untuk melihat detail dan memperbarui
                penanganannya.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(200px,1fr)_160px_160px_150px] xl:min-w-[720px]">
              <label className="relative block sm:col-span-2 lg:col-span-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari judul atau lokasi..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>
              <label className="relative">
                <SlidersHorizontal
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as "" | ReportStatus);
                    setPage(1);
                  }}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-emerald-500"
                >
                  {statusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="relative">
                <ShieldCheck
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={validation}
                  onChange={(event) => {
                    setValidation(event.target.value as "" | ValidationStatus);
                    setPage(1);
                  }}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-emerald-500"
                >
                  {validationOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <select
                value={severity}
                onChange={(event) => {
                  setSeverity(event.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-emerald-500"
              >
                <option value="">Semua kerusakan</option>
                <option value="ringan">Ringan</option>
                <option value="sedang">Sedang</option>
                <option value="berat">Berat</option>
              </select>
            </div>
          </div>
        </div>
        {error && (
          <div
            role="alert"
            className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
            <button
              onClick={() => setReloadKey((current) => current + 1)}
              className="ml-2 font-semibold underline"
            >
              Muat ulang
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3.5">Laporan</th>
                <th className="px-4 py-3.5">Lokasi</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Kerusakan</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Tipe</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Validasi</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Tanggal</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={8} className="px-5 py-5">
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

                            <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
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
                            </div>

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
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${severityStyles[report.severity] || severityStyles.sedang}`}
                      >
                        {report.severity}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${severityStyles[report.severity] ?? severityStyles.sedang
                          }`}
                      >
                        {formatReportType(report.type)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyles[report.status]}`}
                      >
                        {statusLabels[report.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {report.validation?.status ? (() => {
                        const config = validationConfig[report.validation.status];
                        const Icon = config?.icon || ShieldCheck;
                        const label = config?.label || report.validation.status;
                        const style = config?.style || "bg-slate-100 text-slate-600 ring-slate-200";

                        return (
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${style}`}
                            >
                              <Icon size={12} className="shrink-0" />
                              <span>{label}</span>
                            </span>
                            {typeof report.validation.trustScore === "number" && (
                              <span
                                title="Skor kepercayaan validasi"
                                className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200/80 whitespace-nowrap"
                              >
                                {report.validation.trustScore}%
                              </span>
                            )}
                          </div>
                        );
                      })() : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-start gap-2 text-xs text-slate-500">
                        <CalendarDays
                          size={14}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />
                        <span>{dateLabel(report.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenValidationModal(report)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800"
                          title="Update Status Validasi"
                        >
                          <ShieldCheck size={14} className="text-emerald-600" />
                          <span>Validasi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/reports/${report._id}`, {
                              state: { report },
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-2xs transition hover:border-emerald-600 hover:bg-emerald-700 hover:text-white"
                        >
                          <Eye size={14} /> Kelola
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && !reports.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <FileText size={22} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Laporan tidak ditemukan
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Coba ubah kata kunci atau filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Menampilkan {reports.length ? (page - 1) * 10 + 1 : 0}–
            {Math.min(page * 10, totalItems)} dari{" "}
            {totalItems.toLocaleString("id-ID")} laporan
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="min-w-20 text-center text-xs font-medium text-slate-600">
              Halaman {page} / {Math.max(1, totalPages)}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Modal Update Status Validasi */}
      {validationModalReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <ShieldCheck size={18} />
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Update Status Validasi
                  </h3>
                </div>
                <p className="mt-1.5 line-clamp-1 text-xs text-slate-500">
                  Laporan: <strong className="text-slate-700">{validationModalReport.title}</strong> (ID: {validationModalReport._id.slice(-8)})
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseValidationModal}
                disabled={isSubmittingValidation}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitValidation} className="mt-5 space-y-4">
              {/* Pilihan Keputusan */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Keputusan Validasi <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDecision("approved")}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                      decision === "approved"
                        ? "border-teal-500 bg-teal-50/50 text-teal-800 ring-2 ring-teal-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <CheckCircle2
                      size={20}
                      className={decision === "approved" ? "text-teal-600" : "text-slate-400"}
                    />
                    <span className="mt-1.5 text-xs font-semibold">Disetujui</span>
                    <span className="text-[10px] text-slate-400">Kerusakan nyata</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision("rejected")}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                      decision === "rejected"
                        ? "border-rose-500 bg-rose-50/50 text-rose-800 ring-2 ring-rose-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <XCircle
                      size={20}
                      className={decision === "rejected" ? "text-rose-600" : "text-slate-400"}
                    />
                    <span className="mt-1.5 text-xs font-semibold">Ditolak</span>
                    <span className="text-[10px] text-slate-400">Tidak valid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision("duplicate")}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                      decision === "duplicate"
                        ? "border-purple-500 bg-purple-50/50 text-purple-800 ring-2 ring-purple-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Copy
                      size={20}
                      className={decision === "duplicate" ? "text-purple-600" : "text-slate-400"}
                    />
                    <span className="mt-1.5 text-xs font-semibold">Duplikat</span>
                    <span className="text-[10px] text-slate-400">Laporan serupa</span>
                  </button>
                </div>
              </div>

              {/* Input ID Laporan Duplikat jika duplicate */}
              {decision === "duplicate" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    ID Laporan Asal (duplicateOf) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={duplicateOfId}
                    onChange={(e) => setDuplicateOfId(e.target.value)}
                    placeholder="Contoh: 6af2fc2afda7153c2f5aab4b"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Masukkan ID lengkap laporan asli yang menjadi rujukan duplikat.
                  </p>
                </div>
              )}

              {/* Input Catatan (Review Note) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Catatan Tinjauan (Review Note)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Contoh: Sudah dicek ke lokasi, kerusakan nyata..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>Catatan akan ditampilkan pada detail laporan.</span>
                  <span>{decisionNote.length}/500</span>
                </div>
              </div>

              {/* Info Tambahan bila ada analisis AI */}
              {validationModalReport.validation?.ai?.reason && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Catatan AI:</span>{" "}
                  {validationModalReport.validation.ai.reason}
                </div>
              )}

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseValidationModal}
                  disabled={isSubmittingValidation}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingValidation}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                >
                  {isSubmittingValidation ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Keputusan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
