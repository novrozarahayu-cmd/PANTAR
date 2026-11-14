import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  createAdminProgress,
  deleteAdminProgress,
  deleteAdminReport,
  getAdminReportById,
  getAdminReportProgress,
  updateAdminProgress,
  updateAdminReport,
  type AdminProgress,
  type ProgressPayload,
} from "../../api/reports-admin.api";
import type {
  ReportItem,
  ReportSeverity,
  ReportStatus,
} from "../../../client/reports/types/reports.types";
import LocationPickerMap from "../../../client/navigation/components/LocationPickerMap";
import ImageUploadPreview from "../../components/ImageUploadPreview";
import Swal from "sweetalert2";
import type { LocationSuggestion } from "../../../client/navigation/types/routes.types";
import LocationSearch from "../../../client/navigation/components/LocationSearch";
import { getReportImages } from "../../../../utils/get-default-image";

const statuses: { value: ReportStatus; label: string }[] = [
  { value: "menunggu", label: "Menunggu" },
  { value: "diverifikasi", label: "Diverifikasi" },
  { value: "diproses", label: "Diproses" },
  { value: "ditolak", label: "Ditolak" },
];
const progressStatuses = [
  { value: "dikerjakan", label: "Dikerjakan" },
  { value: "diproses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
];
const statusClass: Record<string, string> = {
  menunggu: "bg-amber-50 text-amber-700",
  diverifikasi: "bg-sky-50 text-sky-700",
  diproses: "bg-blue-50 text-blue-700",
  dikerjakan: "bg-blue-50 text-blue-700",
  selesai: "bg-emerald-50 text-emerald-700",
  ditolak: "bg-rose-50 text-rose-700",
};

const reportTypes = [
  { value: "jalan", label: "Jalan" },
  { value: "lampu-jalan", label: "Lampu Jalan" },
  { value: "trotoar", label: "Trotoar" },
  { value: "halte", label: "Halte" },
  { value: "taman", label: "Taman" },
  { value: "lainnya", label: "Lainnya" },
] as const;

const dateLabel = (value: string | Date | null | undefined) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    console.warn("Tanggal tidak valid:", value);
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatThousands = (value: string | number) => {
  const digits = String(value).replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("id-ID") : "";
};

const formatRupiah = (value: number | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const initialProgress = {
  title: "",
  description: "",
  status: "dikerjakan",
  cost: "",
  images: [] as File[],
};

export default function AdminReportDetailPage() {
  const { reportId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialReport = (location.state as { report?: ReportItem } | null)
    ?.report;
  const [report, setReport] = useState<ReportItem | null>(
    initialReport ?? null,
  );
  const [progress, setProgress] = useState<AdminProgress[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [editingReport, setEditingReport] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressFormOpen, setProgressFormOpen] = useState(false);
  const [editingProgressId, setEditingProgressId] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reportForm, setReportForm] = useState({
    title: initialReport?.title ?? "",
    description: initialReport?.description ?? "",
    severity: (initialReport?.severity ?? "sedang") as ReportSeverity,
    status: (initialReport?.status ?? "menunggu") as ReportStatus,
    type: initialReport?.type ?? "lainnya",
    cost: initialReport?.cost,
    latitude: initialReport?.location.coordinates[1] ?? 0,
    longitude: initialReport?.location.coordinates[0] ?? 0,
    images: [] as File[],
  });
  const [progressForm, setProgressForm] = useState(initialProgress);

  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  const [locationSuggestion, setLocationSuggestion] = useState<LocationSuggestion | null>(null);
  const [locationDisplayName, setLocationDisplayName] = useState("");

  const [removeImages, setRemoveImages] = useState<string[]>([]);

  const loadProgress = useCallback(async () => {
    setLoadingProgress(true);
    try {
      const response = await getAdminReportProgress(reportId);
      setProgress(response.data ?? []);
    } catch {
      setError("Progres laporan gagal dimuat. Coba muat ulang halaman.");
    } finally {
      setLoadingProgress(false);
    }
  }, [reportId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProgress();
  }, [loadProgress]);

  const startEditReport = () => {
    if (!report) return;

    setReportForm({
      title: report.title,
      description: report.description,
      severity: report.severity,
      type: report.type ?? "lainnya",
      status: report.status,
      cost: report.cost,
      latitude: report.location.coordinates[1],
      longitude: report.location.coordinates[0],
      images: [],
    });

    setRemoveImages([]);
    setLocationSuggestion(null);
    setLocationDisplayName("");
    setEditingReport(true);
  };

  const saveReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!report) return;

    setSavingReport(true);

    try {
      const payload = {
        ...reportForm,
        latitude: Number(reportForm.latitude),
        longitude: Number(reportForm.longitude),
        removeImages,
      };

      await updateAdminReport(report._id, payload);

      // Ambil ulang data terbaru dari database
      const updatedReport = await getAdminReportById(report._id);
      setReport(updatedReport);

      setEditingReport(false);

      await Swal.fire({
        title: "Laporan berhasil disimpan",
        text: "Perubahan data laporan berhasil diperbarui.",
        icon: "success",
        confirmButtonText: "Mengerti",
        confirmButtonColor: "#047857",
      });
    } catch (error) {
      console.error("Gagal memperbarui laporan:", error);

      await Swal.fire({
        title: "Gagal menyimpan laporan",
        text: "Terjadi kesalahan saat memperbarui laporan. Silakan coba kembali.",
        icon: "error",
        confirmButtonText: "Mengerti",
        confirmButtonColor: "#047857",
      });
    } finally {
      setSavingReport(false);
    }
  };

  const openNewProgress = () => {
    setEditingProgressId(null);
    setProgressForm(initialProgress);
    setProgressFormOpen(true);
    setError("");
    setMessage("");
  };

  const openEditProgress = (item: AdminProgress) => {
    setEditingProgressId(item._id);
    setProgressForm({
      title: item.title,
      description: item.description,
      status: item.status,
      cost: formatThousands(item.cost ?? 0),
      images: [],
    });
    setProgressFormOpen(true);
    setError("");
    setMessage("");
  };

  const saveProgress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProgress(true);
    setError("");
    setMessage("");
    try {
      const payload: ProgressPayload = {
        ...progressForm,
        cost: String(Number(progressForm.cost.replace(/\./g, ""))),
      };
      if (editingProgressId)
        await updateAdminProgress(editingProgressId, payload);
      else await createAdminProgress(reportId, payload);

      const updatedReport = await getAdminReportById(reportId);
      setReport(updatedReport);

      setProgressFormOpen(false);
      setProgressForm(initialProgress);
      setEditingProgressId(null);
      setMessage(
        editingProgressId
          ? "Progres berhasil diperbarui."
          : "Progres baru berhasil ditambahkan.",
      );
      await loadProgress();
    } catch {
      setError("Progres gagal disimpan. Silakan coba kembali.");
    } finally {
      setSavingProgress(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!report) return;

    const result = await Swal.fire({
      title: "Hapus laporan ini?",
      text: "Laporan dan progres penanganannya mungkin tidak dapat dipulihkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus laporan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteAdminReport(report._id);

      await Swal.fire({
        title: "Laporan dihapus",
        text: "Laporan berhasil dihapus.",
        icon: "success",
        confirmButtonColor: "#047857",
      });

      navigate("/admin/reports", { replace: true });
    } catch {
      await Swal.fire({
        title: "Gagal menghapus",
        text: "Laporan tidak berhasil dihapus. Silakan coba kembali.",
        icon: "error",
        confirmButtonColor: "#047857",
      });
    }
  };

  const handleDeleteProgress = async (item: AdminProgress) => {
    const result = await Swal.fire({
      title: "Hapus progres ini?",
      text: `Progres "${item.title}" akan dihapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus progres",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteAdminProgress(item._id);

      setProgress((current) =>
        current.filter((progressItem) => progressItem._id !== item._id),
      );

      const updatedReport = await getAdminReportById(reportId);
      setReport(updatedReport);

      await Swal.fire({
        title: "Progres dihapus",
        text: "Progres berhasil dihapus.",
        icon: "success",
        confirmButtonColor: "#047857",
      });
    } catch {
      await Swal.fire({
        title: "Gagal menghapus",
        text: "Progres tidak berhasil dihapus. Silakan coba kembali.",
        icon: "error",
        confirmButtonColor: "#047857",
      });
    }
  };

  const handleLocationChange = (
    lat: number,
    lng: number,
    displayName: string,
  ) => {

    setReportForm((current) => ({
      ...current,
      latitude: Number(lat),
      longitude: Number(lng),
    }));

    setLocationDisplayName(displayName);

    setLocationSuggestion({
      id: `location-${lat}-${lng}`,
      name: displayName.split(",")[0],
      displayName,
      lat: Number(lat),
      lng: Number(lng),
    });
  };

  if (!report)
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <FileText size={23} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Data laporan tidak tersedia
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Halaman detail membutuhkan data laporan dari daftar laporan. Silakan
          kembali ke daftar dan pilih laporan yang ingin dikelola.
        </p>
        <button
          onClick={() => navigate("/admin/reports")}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <ArrowLeft size={16} /> Kembali ke daftar
        </button>
      </section>
    );

  const existingImages = getReportImages(report.images).filter(
    (image) =>
      image.resource_type === "image" &&
      !removeImages.includes(image.public_id ?? image.url),
  );

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate("/admin/reports")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-800"
          >
            <ArrowLeft size={17} /> Kembali ke daftar laporan
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setError("");
                setMessage("");

                if (editingReport) {
                  setEditingReport(false);
                } else {
                  startEditReport();
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            >
              <Pencil size={16} />
              {editingReport ? "Tutup edit" : "Edit laporan"}
            </button>

            <button
              type="button"
              onClick={handleDeleteReport}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 size={16} />
              Hapus laporan
            </button>

          </div>
        </div>
        {message && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {message}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              Detail pengaduan
            </p>
            <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {report.title}
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                  ID laporan: {report._id}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass[report.status] || "bg-slate-100 text-slate-700"}`}
              >
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.85fr_1.15fr]">
            {" "}
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-800">
                Foto laporan
              </h3>
              {getReportImages(report.images).length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {getReportImages(report.images).map((image, index) => (
                    <a
                      key={image._id ?? image.public_id ?? `${image.url}-${index}`}
                      href={image.url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
                    >
                      <img
                        src={image.url}
                        alt={`Foto laporan ${index + 1}`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/indonesia-city.jpg";
                        }}
                        className="h-36 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <img
                    src={"/indonesia-city.jpg"}
                    alt="Tidak ada foto laporan"
                    className="h-36 w-full object-cover"
                  />
                </div>
              )}

              {(() => {
                const mediaFiles = (report.images ?? []).filter(
                  (media) =>
                    Boolean(media.url) &&
                    media.resource_type !== "image",
                );

                const audioFormats = [
                  "ogg",
                  "mp3",
                  "wav",
                  "m4a",
                  "aac",
                  "opus",
                  "weba",
                  "mpeg",
                  "webm"
                ];

                if (mediaFiles.length === 0) return null;

                return (
                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-bold text-slate-800">
                      Media laporan
                    </h3>

                    <div className="space-y-4">
                      {mediaFiles.map((media, index) => {
                        const format = media.format?.toLowerCase() ?? "";
                        const isAudio = audioFormats.includes(format);

                        return (
                          <div
                            key={media._id ?? media.public_id ?? media.url}
                            className="rounded-xl border border-slate-200 bg-white p-4"
                          >
                            {isAudio ? (
                              <>
                                <p className="mb-3 text-sm font-semibold text-slate-800">
                                  Rekaman suara {index + 1}
                                </p>

                                <audio
                                  controls
                                  preload="metadata"
                                  className="w-full"
                                >
                                  <source src={media.url} />
                                  Browser kamu tidak mendukung pemutar audio.
                                </audio>
                              </>
                            ) : (
                              <>
                                <p className="mb-3 text-sm font-semibold text-slate-800">
                                  Video laporan {index + 1}
                                </p>

                                <video
                                  controls
                                  preload="metadata"
                                  playsInline
                                  className="max-h-80 w-full rounded-lg bg-black"
                                >
                                  <source src={media.url} />
                                  Browser kamu tidak mendukung pemutar video.
                                </video>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin
                    size={17}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />
                  <span>{report.address || "Alamat belum tersedia"}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays size={15} />
                  {dateLabel(report.createdAt)}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Koordinat: {report.location.coordinates[1]},{" "}
                  {report.location.coordinates[0]}
                </p>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-800">
                Informasi pengaduan
              </h3>
              {editingReport ? (
                <form
                  onSubmit={saveReport}
                  className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4"
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Judul laporan
                    </label>
                    <input
                      required
                      value={reportForm.title}
                      onChange={(event) =>
                        setReportForm({
                          ...reportForm,
                          title: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Deskripsi
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reportForm.description}
                      onChange={(event) =>
                        setReportForm({
                          ...reportForm,
                          description: event.target.value,
                        })
                      }
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="report-type"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Tipe laporan
                    </label>

                    <select
                      id="report-type"
                      value={reportForm.type}
                      onChange={(event) =>
                        setReportForm((current) => ({
                          ...current,
                          type: event.target.value,
                        }))
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      {reportTypes.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <p className="mt-1.5 text-xs text-slate-400">
                      Pilih kategori yang paling sesuai dengan laporan kerusakan.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Tingkat kerusakan
                      </label>
                      <select
                        value={reportForm.severity}
                        onChange={(event) =>
                          setReportForm({
                            ...reportForm,
                            severity: event.target.value as ReportSeverity,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                      >
                        <option value="ringan">Ringan</option>
                        <option value="sedang">Sedang</option>
                        <option value="berat">Berat</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Status laporan
                      </label>
                      <select
                        value={reportForm.status}
                        onChange={(event) =>
                          setReportForm({
                            ...reportForm,
                            status: event.target.value as ReportStatus,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                      >
                        {statuses.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Lokasi pengaduan
                      </label>
                      <p className="mb-3 text-sm text-slate-500">
                        Cari nama jalan atau alamat, kemudian pilih hasil yang sesuai.
                        Kamu juga bisa menentukan titik langsung melalui peta.
                      </p>
                      <LocationSearch
                        label="Cari alamat atau nama jalan"
                        placeholder="Contoh: Jl. Jamin Ginting, Medan"
                        value={locationSuggestion}
                        onSelect={(location) => {
                          if (!location) return;

                          handleLocationChange(
                            Number(location.lat),
                            Number(location.lng),
                            location.displayName
                          );
                        }}
                      />

                      {locationDisplayName && (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-xs font-semibold text-emerald-700">
                            Alamat terpilih
                          </p>
                          <p className="mt-1 text-sm text-slate-800">
                            {locationDisplayName}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs text-slate-500">Latitude</p>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                          {reportForm.latitude.toFixed(6)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs text-slate-500">Longitude</p>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                          {reportForm.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMapPickerOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      <MapPinned size={16} />
                      Pilih titik dari peta
                    </button>
                  </div>
                  {existingImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600">
                        Foto lama
                      </p>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {existingImages.map((image, index) => {
                          const imageId = image.public_id ?? image.url;

                          return (
                            <div
                              key={image._id ?? imageId}
                              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                            >
                              <a
                                href={image.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block"
                              >
                                <img
                                  src={image.url}
                                  alt={`Foto laporan ${index + 1}`}
                                  loading="lazy"
                                  className="h-32 w-full object-cover"
                                />
                              </a>

                              <button
                                type="button"
                                onClick={() =>
                                  setRemoveImages((current) => [...current, imageId])
                                }
                                className="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-3 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                              >
                                <Trash2 size={14} />
                                Hapus foto
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <ImageUploadPreview
                    label="Foto laporan"
                    description="JPG, PNG atau WEBP"
                    files={reportForm.images}
                    onChange={(images) =>
                      setReportForm((current) => ({
                        ...current,
                        images,
                      }))
                    }
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingReport(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      disabled={savingReport}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      <Save size={16} />
                      {savingReport ? "Menyimpan..." : "Simpan perubahan"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Judul</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {report.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Deskripsi
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {report.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                    <span className="text-xs font-medium text-slate-500">
                      Biaya penanganan
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {formatRupiah(Number(report?.cost ?? 0))}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="text-xs text-slate-400">Tipe laporan</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {reportTypes.find((item) => item.value === report.type)?.label ??
                          report.type ??
                          "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="text-xs text-slate-400">Tingkat kerusakan</p>
                      <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                        {report.severity}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 p-3 sm:col-span-2">
                      <p className="text-xs text-slate-400">Status saat ini</p>
                      <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                        {report.status}
                      </p>
                    </div>
                  </div>

                  {/* Status Validasi & Review Note */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-700" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Validasi Sistem
                        </span>
                      </div>
                      {report.validation?.status && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 capitalize ring-1 ring-slate-200">
                          {report.validation.status}
                        </span>
                      )}
                    </div>

                    {report.validation?.review?.note ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                          <FileText size={14} />
                          <span>Catatan Tinjauan (Review Note):</span>
                        </div>
                        <p className="mt-1.5 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                          "{report.validation.review.note}"
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          {report.validation.review.decision && (
                            <span>
                              Keputusan:{" "}
                              <strong className="capitalize text-slate-700">
                                {report.validation.review.decision}
                              </strong>
                            </span>
                          )}
                          {report.validation.review.at && (
                            <span>• Ditinjau pada {dateLabel(report.validation.review.at)}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-400">
                        Belum ada catatan tinjauan (review note) untuk laporan ini.
                      </div>
                    )}

                    {report.validation?.ai?.reason && (
                      <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Analisis AI:</span>{" "}
                        {report.validation.ai.reason}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={startEditReport}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                  >
                    <Pencil size={15} /> Ubah informasi laporan
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Progres penanganan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Catat tindakan petugas dan dokumentasi setiap perkembangan.
              </p>
            </div>
            <button
              onClick={openNewProgress}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Plus size={17} /> Tambah progres
            </button>
          </div>
          {progressFormOpen && (
            <form
              onSubmit={saveProgress}
              className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">
                  {editingProgressId ? "Edit progres" : "Progres baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setProgressFormOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                  aria-label="Tutup form"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Judul progres
                  </label>
                  <input
                    required
                    value={progressForm.title}
                    onChange={(event) =>
                      setProgressForm({
                        ...progressForm,
                        title: event.target.value,
                      })
                    }
                    placeholder="Contoh: Perbaikan mulai dikerjakan"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Status progres
                  </label>
                  <select
                    value={progressForm.status}
                    onChange={(event) =>
                      setProgressForm({
                        ...progressForm,
                        status: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    {progressStatuses.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Deskripsi progres
                </label>
                <textarea
                  required
                  rows={3}
                  value={progressForm.description}
                  onChange={(event) =>
                    setProgressForm({
                      ...progressForm,
                      description: event.target.value,
                    })
                  }
                  placeholder="Jelaskan pekerjaan yang dilakukan petugas..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="progress-cost"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Biaya penanganan
                </label>

                <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                  <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500">
                    Rp
                  </span>

                  <input
                    id="progress-cost"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={progressForm.cost}
                    onChange={(event) =>
                      setProgressForm((current) => ({
                        ...current,
                        cost: formatThousands(event.target.value),
                      }))
                    }
                    placeholder="0"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold text-slate-800 outline-none"
                  />
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  Masukkan biaya dalam Rupiah, tanpa tanda minus atau desimal.
                </p>
              </div>

              <ImageUploadPreview
                label="Foto dokumentasi progres"
                description="Unggah foto kondisi atau pekerjaan yang dilakukan"
                files={progressForm.images}
                onChange={(images) =>
                  setProgressForm((current) => ({
                    ...current,
                    images,
                  }))
                }
              />
              <div className="mt-4 flex justify-end">
                <button
                  disabled={savingProgress}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  <Save size={16} />
                  {savingProgress ? "Menyimpan..." : "Simpan progres"}
                </button>
              </div>
            </form>
          )}
          {loadingProgress ? (
            <div className="mt-5 space-y-3">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : progress.length ? (
            <div className="mt-6 space-y-0">
              {[...progress]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((item, index) => (
                  <article
                    key={item._id}
                    className="relative pb-5 pl-8 last:pb-0"
                  >
                    <span
                      className={`absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${item.status === "selesai" ? "bg-emerald-500" : "bg-teal-600"}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    {index < progress.length - 1 && (
                      <span className="absolute bottom-0 left-[9px] top-6 w-px bg-emerald-100" />
                    )}
                    <div className="rounded-xl border border-slate-200/80 p-4 transition hover:border-emerald-200">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-800">
                              {item.title}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusClass[item.status] || "bg-slate-100 text-slate-600"}`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-500">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditProgress(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDeleteProgress(item)}
                            aria-label={`Hapus progres ${item.title}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 size={13} />
                            Hapus
                          </button>
                        </div>

                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                        <span className="text-xs font-medium text-slate-500">
                          Biaya penanganan
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {formatRupiah(Number(item.cost ?? 0))}
                        </span>
                      </div>
                      {item.images?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.images.map((image, imageIndex) => (
                            <a
                              key={`${image}-${imageIndex}`}
                              href={image}
                              target="_blank"
                              rel="noreferrer"
                              className="h-20 w-24 overflow-hidden rounded-lg bg-slate-100"
                            >
                              <img
                                src={image}
                                alt={`Dokumentasi progres ${imageIndex + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                        <span>{dateLabel(item.createdAt)}</span>
                        {item.createdByName && (
                          <span>Ditambahkan oleh {item.createdByName}</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <CheckCircle2 size={22} />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Belum ada progres penanganan
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Tambahkan progres pertama untuk mencatat tindak lanjut laporan
                ini.
              </p>
            </div>
          )}
        </section>
      </div>

      {mapPickerOpen && (
        <LocationPickerMap
          initialPosition={{
            lat: reportForm.latitude,
            lng: reportForm.longitude,
          }}
          onClose={() => setMapPickerOpen(false)}
          onConfirm={(location, displayName) => {
            handleLocationChange(
              Number(location.lat),
              Number(location.lng),
              displayName
            );

            setMapPickerOpen(false);
          }}
        />
      )}

    </>
  );

}
