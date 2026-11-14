import type { ReportSummaryItem } from "../../../../client/reports/types/reports.types";

export default function LocationSummaryChart({
  items,
  title,
  subtitle,
}: {
  items: ReportSummaryItem[];
  title: string;
  subtitle: string;
}) {
  const topItems = [...items].sort((a, b) => b.total - a.total).slice(0, 5);
  const max = Math.max(1, ...topItems.map((item) => item.total));
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      {topItems.length ? (
        <div className="mt-5 space-y-4">
          {topItems.map((item) => (
            <div key={item.name}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium text-slate-600">
                  {item.name}
                </span>
                <span className="shrink-0 font-semibold text-slate-800">
                  {item.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400"
                  style={{ width: `${(item.total / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center text-sm text-slate-400">
          Belum ada data lokasi.
        </div>
      )}
    </section>
  );
}
