import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router";
import {
  getAdminReports,
  getAdminReportSummary,
} from "../api/reports-admin.api";
import type { ReportSummaryResponse } from "../../client/reports/types/reports.types";
import ReportStatusChart from "./dashboard/components/ReportStatusChart";
import TodayReportsTable from "./dashboard/components/TodayReportsTable";
import RegionDistributionCard from "./dashboard/components/RegionDistributionCard";
import ReportTypeChart from "./dashboard/components/ReportTypeChart";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<ReportSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminReportSummary();
      setSummary(response);
    } catch {
      setError(
        "Ringkasan laporan gagal dimuat. Periksa koneksi API lalu coba kembali.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSummary();
  }, []);

  const loadTodayReports = useCallback(
    () => getAdminReports({ page: 1, limit: 10, today: true }),
    [],
  );

  const statusCount = (status: string) =>
    summary?.data.statusSummary.find((item) => item.status === status)?.total ??
    0;

  const cards = [
    {
      label: t("reports.totalReports", "Total laporan"),
      value: summary?.meta.totalReports ?? 0,
      description: "Seluruh laporan masyarakat",
      icon: FileText,
      style: "bg-emerald-50 text-emerald-700",
    },
    {
      label: t("status.menunggu", "Menunggu"),
      value: statusCount("menunggu"),
      description: "Perlu ditindaklanjuti",
      icon: Clock3,
      style: "bg-amber-50 text-amber-700",
    },
    {
      label: t("status.diproses", "Sedang diproses"),
      value: statusCount("diproses"),
      description: "Dalam penanganan petugas",
      icon: Activity,
      style: "bg-lime-50 text-lime-700",
    },
    {
      label: t("status.selesai", "Selesai"),
      value: statusCount("selesai"),
      description: "Penanganan telah selesai",
      icon: CheckCircle2,
      style: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-3xl bg-emerald-800 p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[36px] border-white/5"
        />
        <div className="relative">
          <p className="text-sm text-emerald-100">Ringkasan administrasi</p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            Pantau laporan masyarakat
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/85">
            Pantau status pengaduan, identifikasi wilayah yang sering
            dilaporkan, dan bantu petugas menentukan prioritas penanganan.
          </p>
        </div>
        <Link
          to="/admin/reports"
          className="relative inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
        >
          Kelola laporan <ArrowUpRight size={17} />
        </Link>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <button
            onClick={() => void loadSummary()}
            className="inline-flex items-center gap-2 font-semibold"
          >
            <RefreshCw size={15} /> Coba lagi
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-500">
                  {card.label}
                </span>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.style}`}
                >
                  <Icon size={20} />
                </span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                {loading ? "—" : card.value.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-xs text-slate-400">{card.description}</p>
            </article>
          );
        })}
      </section>

      <TodayReportsTable load={loadTodayReports} />

      {loading ? (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="h-[420px] animate-pulse rounded-2xl bg-slate-200/70" />
            <div className="h-[420px] animate-pulse rounded-2xl bg-slate-200/70" />
          </div>
          <div className="h-[400px] animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      ) : (
        summary && (
          <div className="space-y-5">
            <section className="grid items-stretch gap-5 xl:grid-cols-2">
              <ReportStatusChart
                summary={summary.data.statusSummary}
                total={summary.meta.totalReports}
              />

              <ReportTypeChart
                summary={summary.data.typeSummary ?? []}
                total={summary.meta.totalReports}
              />
            </section>

            <RegionDistributionCard
              districts={summary.data.district ?? []}
              villages={summary.data.village ?? []}
            />
          </div>
        )
      )}
    </div>
  );
}