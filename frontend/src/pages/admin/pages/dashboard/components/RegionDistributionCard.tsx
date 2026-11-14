import { useMemo, useState } from "react";
import { ArrowDownUp, Search, X } from "lucide-react";
import { MEDAN_REGIONS, normalizeDistrict, normalizeName } from "./MedanRegion";

type SummaryItem = { name: string; total: number };
type Tab = "kecamatan" | "kelurahan";
type Row = { key: string; name: string; parent?: string; total: number };

function sumByName(items: SummaryItem[] | undefined, normalize: (v: string) => string) {
    const map = new Map<string, number>();
    for (const item of items ?? []) {
        const key = normalize(item.name ?? "");
        map.set(key, (map.get(key) ?? 0) + (item.total ?? 0));
    }
    return map;
}

export default function RegionDistributionCard({
    districts,
    villages,
}: {
    districts: SummaryItem[];
    villages: SummaryItem[];
}) {
    const [tab, setTab] = useState<Tab>("kecamatan");
    const [query, setQuery] = useState("");
    const [parent, setParent] = useState("");
    const [sort, setSort] = useState<"terbanyak" | "abjad">("terbanyak");

    const { districtRows, villageRows, unmatched } = useMemo(() => {
        const districtMap = sumByName(districts, normalizeDistrict);
        const villageMap = sumByName(villages, normalizeName);

        const districtRows: Row[] = MEDAN_REGIONS.map((d) => ({
            key: d.name,
            name: d.name,
            total: districtMap.get(normalizeDistrict(d.name)) ?? 0,
        }));

        const villageRows: Row[] = MEDAN_REGIONS.flatMap((d) =>
            d.villages.map((v) => ({
                key: `${d.name}|${v}`,
                name: v,
                parent: d.name,
                total: villageMap.get(normalizeName(v)) ?? 0,
            })),
        );

        // Laporan dengan nama wilayah di luar daftar resmi
        const knownDistricts = new Set(MEDAN_REGIONS.map((d) => normalizeDistrict(d.name)));
        const knownVillages = new Set(MEDAN_REGIONS.flatMap((d) => d.villages.map(normalizeName)));
        const sumUnknown = (map: Map<string, number>, known: Set<string>) =>
            [...map].filter(([key]) => key && !known.has(key)).reduce((acc, [, v]) => acc + v, 0);

        return {
            districtRows,
            villageRows,
            unmatched: {
                kecamatan: sumUnknown(districtMap, knownDistricts),
                kelurahan: sumUnknown(villageMap, knownVillages),
            },
        };
    }, [districts, villages]);

    const allRows = tab === "kecamatan" ? districtRows : villageRows;
    const maxTotal = Math.max(...allRows.map((row) => row.total), 1);
    const withReports = allRows.filter((row) => row.total > 0).length;
    const label = tab === "kecamatan" ? "kecamatan" : "kelurahan";

    const rows = useMemo(() => {
        const q = normalizeName(query);
        return allRows
            .filter((row) => !parent || row.parent === parent)
            .filter(
                (row) =>
                    !q ||
                    normalizeName(row.name).includes(q) ||
                    normalizeName(row.parent ?? "").includes(q),
            )
            .sort((a, b) =>
                sort === "terbanyak" && b.total !== a.total
                    ? b.total - a.total
                    : a.name.localeCompare(b.name, "id"),
            );
    }, [allRows, query, parent, sort]);

    const changeTab = (next: Tab) => {
        setTab(next);
        setQuery("");
        setParent("");
    };

    const tabClass = (active: boolean) =>
        `rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${active ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
        }`;

    const extra = unmatched[tab];

    return (
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-slate-800">Sebaran laporan per wilayah</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {withReports} dari {allRows.length} {label} memiliki laporan
                    </p>
                </div>

                <div role="tablist" aria-label="Tingkat wilayah" className="inline-flex rounded-xl bg-slate-100 p-1">
                    <button type="button" role="tab" aria-selected={tab === "kecamatan"} onClick={() => changeTab("kecamatan")} className={tabClass(tab === "kecamatan")}>
                        Kecamatan
                    </button>
                    <button type="button" role="tab" aria-selected={tab === "kelurahan"} onClick={() => changeTab("kelurahan")} className={tabClass(tab === "kelurahan")}>
                        Kelurahan
                    </button>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Cari ${label}...`}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery("")} aria-label="Hapus pencarian" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                            <X size={15} />
                        </button>
                    )}
                </div>

                {tab === "kelurahan" && (
                    <select
                        value={parent}
                        onChange={(e) => setParent(e.target.value)}
                        aria-label="Filter kecamatan"
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-400"
                    >
                        <option value="">Semua kecamatan</option>
                        {MEDAN_REGIONS.map((d) => (
                            <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                    </select>
                )}

                <button
                    type="button"
                    onClick={() => setSort((v) => (v === "terbanyak" ? "abjad" : "terbanyak"))}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                    <ArrowDownUp size={15} />
                    {sort === "terbanyak" ? "Terbanyak" : "A–Z"}
                </button>
            </div>

            {/* Tinggi tetap: daftar panjang di-scroll di dalam kartu, halaman tidak memanjang */}
            <ul className="mt-4 h-[400px] space-y-1 overflow-y-auto pr-1">
                {rows.length === 0 ? (
                    <li className="flex h-full items-center justify-center text-sm text-slate-400">
                        Tidak ada {label} yang cocok.
                    </li>
                ) : (
                    rows.map((row) => (
                        <li key={row.key} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                            <div className="w-36 shrink-0 sm:w-44">
                                <p className={`truncate text-sm ${row.total > 0 ? "font-medium text-slate-800" : "text-slate-500"}`}>
                                    {row.name}
                                </p>
                                {row.parent && <p className="truncate text-[11px] text-slate-400">{row.parent}</p>}
                            </div>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                                    style={{ width: `${(row.total / maxTotal) * 100}%` }}
                                />
                            </div>
                            <span className={`w-8 shrink-0 text-right text-sm tabular-nums ${row.total > 0 ? "font-semibold text-slate-800" : "text-slate-400"}`}>
                                {row.total}
                            </span>
                        </li>
                    ))
                )}
            </ul>

            {extra > 0 && (
                <p className="mt-3 text-xs text-amber-700">
                    {extra} laporan memakai nama {label} yang tidak ada di daftar resmi dan tidak ditampilkan di sini.
                </p>
            )}
        </div>
    );
}