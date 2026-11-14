type StatusItem = { status: string; total: number };

const STATUSES = [
  { key: "menunggu", label: "Menunggu", color: "#F59E0B" },
  { key: "diverifikasi", label: "Diverifikasi", color: "#14B8A6" },
  { key: "diproses", label: "Sedang diproses", color: "#84CC16" },
  { key: "selesai", label: "Selesai", color: "#059669" },
  { key: "ditolak", label: "Ditolak", color: "#F43F5E" },
];

export default function ReportStatusChart({
  summary,
  total,
}: {
  summary: StatusItem[];
  total: number;
}) {
  const counts = STATUSES.map((status) => ({
    ...status,
    value: summary.find((item) => item.status === status.key)?.total ?? 0,
  }));
  const sum = counts.reduce((acc, item) => acc + item.value, 0);

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

  const completedRate = sum > 0 ? Math.round(((counts[3].value) / sum) * 100) : 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h3 className="text-base font-bold text-slate-800">Status laporan</h3>
        <p className="mt-1 text-sm text-slate-500">
          Proporsi laporan berdasarkan tahap penanganan
        </p>
      </div>

      <div className="relative mx-auto my-6 h-44 w-44">
        <svg
          viewBox="0 0 180 180"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label={`Status laporan, total ${total} laporan`}
        >
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#EEF3F0" strokeWidth="18" />
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
            {total.toLocaleString("id-ID")}
          </span>
          <span className="text-xs text-slate-500">laporan</span>
        </div>
      </div>

      <ul className="space-y-2.5">
        {counts.map((item) => {
          const percent = sum > 0 ? Math.round((item.value / sum) * 100) : 0;
          return (
            <li key={item.key} className="flex items-center gap-3 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="flex-1 text-slate-600">{item.label}</span>
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

      <div className="mt-auto pt-5">
        <div className="rounded-xl bg-emerald-50 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-emerald-900">Tingkat penyelesaian</span>
            <span className="font-bold tabular-nums text-emerald-700">{completedRate}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${completedRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}