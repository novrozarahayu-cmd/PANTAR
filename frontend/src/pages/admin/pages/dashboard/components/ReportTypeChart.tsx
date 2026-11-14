type TypeItem = { type: string; total: number };

const TYPES = [
    { key: "jalan", label: "Jalan", color: "#059669" },
    { key: "lampu-jalan", label: "Lampu Jalan", color: "#0D9488" },
    { key: "trotoar", label: "Trotoar", color: "#84CC16" },
    { key: "halte", label: "Halte", color: "#F59E0B" },
    { key: "taman", label: "Taman", color: "#0EA5E9" },
    { key: "lainnya", label: "Lainnya", color: "#8B5CF6" },
    { key: "belum-ditentukan", label: "Belum ditentukan", color: "#CBD5E1" },
];

export default function ReportTypeChart({
    summary,
    total,
}: {
    summary: TypeItem[];
    total: number;
}) {
    const reportedTotal = summary.reduce((sum, item) => sum + item.total, 0);
    const unclassified = Math.max(0, total - reportedTotal);

    const counts = TYPES.map((type) => ({
        ...type,
        value:
            type.key === "belum-ditentukan"
                ? unclassified
                : summary.find((item) => item.type === type.key)?.total ?? 0,
    }));

    // Tetap tampilkan tipe lain jika ada nilai yang belum terdaftar di TYPES.
    const knownTypes = new Set(TYPES.map((type) => type.key));
    const additionalTypes = summary
        .filter((item) => !knownTypes.has(item.type))
        .map((item) => ({
            key: item.type,
            label: item.type
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" "),
            color: "#64748B",
            value: item.total,
        }));

    const items = [...counts, ...additionalTypes];
    const sum = items.reduce((acc, item) => acc + item.value, 0);

    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    const visible = items.filter((item) => item.value > 0);
    const gap = visible.length > 1 ? 3 : 0;

    let offset = 0;
    const segments = visible.map((item) => {
        const length = sum > 0 ? (item.value / sum) * circumference : 0;
        const segment = {
            ...item,
            length: Math.max(length - gap, 0),
            offset,
        };

        offset += length;
        return segment;
    });

    const mostReported = [...items]
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value)[0];

    return (
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
                <h3 className="text-base font-bold text-slate-800">
                    Tipe laporan
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                    Proporsi laporan berdasarkan jenis kerusakan fasilitas
                </p>
            </div>

            <div className="relative mx-auto my-6 h-44 w-44">
                <svg
                    viewBox="0 0 180 180"
                    className="h-full w-full -rotate-90"
                    role="img"
                    aria-label={`Tipe laporan, total ${total} laporan`}
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
                            strokeDasharray={`${segment.length} ${circumference - segment.length} `}
                            strokeDashoffset={-segment.offset}
                        >
                            <title>{`${segment.label}: ${segment.value} `}</title>
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
                {items.map((item) => {
                    const percent =
                        sum > 0 ? Math.round((item.value / sum) * 100) : 0;

                    return (
                        <li key={item.key} className="flex items-center gap-3 text-sm">
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />

                            <span className="min-w-0 flex-1 text-slate-600">
                                {item.label}
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

            <div className="mt-auto pt-5">
                <div className="rounded-xl bg-emerald-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-emerald-900">
                            Tipe paling banyak dilaporkan
                        </span>
                        <span className="text-right font-bold text-emerald-700">
                            {mostReported?.label ?? "-"}
                        </span>
                    </div>

                    <p className="mt-1 text-xs text-emerald-700">
                        {mostReported
                            ? `${mostReported.value.toLocaleString("id-ID")} laporan dari ${sum.toLocaleString("id-ID")} laporan(${Math.round((mostReported.value / sum) * 100)} %).`
                            : "Belum ada data laporan."}
                    </p>
                </div>
            </div>
        </div>
    );
}