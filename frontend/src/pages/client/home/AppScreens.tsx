import { useTranslation } from "react-i18next";

/**
 * Mockup layar aplikasi PantauJalan, digambar dengan kode (tanpa file gambar).
 * Semua data di dalamnya hanya contoh tampilan.
 */

const INK = "#0b1d16";
const MINT = "#3ddc97";
const GREEN = "#0b7a52";
const LINE = "#dfeae3";
const MUTED = "#4b5d55";

function MiniMap({
    route = false,
    pins = [],
}: {
    route?: boolean;
    pins?: { x: number; y: number; color?: string }[];
}) {
    return (
        <svg
            viewBox="0 0 250 520"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
        >
            <rect width="250" height="520" fill="#e9f3ec" />
            {/* area hijau & air */}
            <rect x="150" y="60" width="110" height="70" rx="14" fill="#d3ecdc" />
            <rect x="-10" y="330" width="90" height="60" rx="14" fill="#d3ecdc" />
            <path d="M-10 420 C 60 400, 120 450, 260 420 L260 470 C 120 500, 60 450, -10 470Z" fill="#cfe6ee" />
            {/* jalan */}
            <g stroke="#ffffff" strokeWidth="9" fill="none" strokeLinecap="round">
                <path d="M-10 150 L260 130" />
                <path d="M-10 290 L260 310" />
                <path d="M70 -10 L90 530" />
                <path d="M180 -10 L170 530" />
            </g>
            <g stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round">
                <path d="M-10 220 L260 215" />
                <path d="M125 -10 L130 530" />
                <path d="M-10 380 L260 372" />
            </g>
            {route && (
                <>
                    <path
                        d="M40 440 C 60 380, 80 330, 90 290 S 110 230, 130 215 S 170 160, 190 100"
                        stroke={GREEN}
                        strokeWidth="5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <path
                        d="M40 440 C 60 380, 80 330, 90 290 S 110 230, 130 215 S 170 160, 190 100"
                        stroke={MINT}
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <circle cx="40" cy="440" r="7" fill="#fff" stroke={INK} strokeWidth="3" />
                </>
            )}
            {pins.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="15" fill={p.color ?? "#ff6b57"} fillOpacity="0.2" />
                    <circle cx={p.x} cy={p.y} r="7" fill={p.color ?? "#ff6b57"} stroke="#fff" strokeWidth="2.5" />
                </g>
            ))}
        </svg>
    );
}

/* ------------------------------------------------------------------ */

export function ReportScreen() {
    const chips = ["Jalan", "Lampu jalan", "Drainase", "Halte"];
    return (
        <div className="flex h-full flex-col px-4 pb-3.5 pt-9 text-[11px]" style={{ color: INK }}>
            <p className="text-[10px]" style={{ color: MUTED }}>Langkah 1 dari 2</p>
            <p className="mt-0.5 text-[15px] font-semibold tracking-tight">Buat laporan</p>

            <p className="mt-3 font-medium">Kategori</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                    <span
                        key={c}
                        className="rounded-full border px-2.5 py-1"
                        style={
                            c === "Lampu jalan"
                                ? { background: INK, color: "#fff", borderColor: INK }
                                : { borderColor: LINE, color: MUTED }
                        }
                    >
                        {c}
                    </span>
                ))}
            </div>

            <p className="mt-3 font-medium">Foto kerusakan</p>
            <div
                className="relative mt-2 h-[78px] overflow-hidden rounded-xl"
                style={{ background: "#dcf6e8" }}
            >
                <svg viewBox="0 0 220 92" className="h-full w-full" aria-hidden="true">
                    <rect y="66" width="220" height="26" fill="#bfe3cd" />
                    <path d="M150 66 V16 q0 -8 -8 -8 h-16" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
                    <rect x="108" y="9" width="20" height="8" rx="4" fill={INK} />
                    <path d="M112 20 l-10 22 h30z" fill="#ffffff" fillOpacity="0.0" />
                </svg>
                <span
                    className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: MINT }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2" className="h-3.5 w-3.5">
                        <path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v11H3V8a1 1 0 0 1 1-1Z" />
                        <circle cx="12" cy="12.5" r="3.2" />
                    </svg>
                </span>
            </div>

            <p className="mt-3 font-medium">Lokasi</p>
            <div className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: LINE }}>
                <span className="h-2 w-2 rounded-full" style={{ background: GREEN }} />
                <span className="flex-1 truncate">Jl. Sudirman, Medan Petisah</span>
                <span style={{ color: GREEN }}>Ubah</span>
            </div>

            <p className="mt-3 font-medium">Deskripsi</p>
            <div className="mt-2 rounded-xl border px-3 py-2 leading-4" style={{ borderColor: LINE, color: MUTED }}>
                Lampu mati sejak beberapa hari, jalan jadi gelap di malam hari.
            </div>

            <span
                className="mt-auto rounded-full py-2.5 text-center text-[12px] font-medium text-white"
                style={{ background: INK }}
            >
                Kirim laporan
            </span>
        </div>
    );
}

/* ------------------------------------------------------------------ */

export function StatusScreen() {
    const steps = [
        { t: "Laporan diterima", d: "Masuk ke sistem", state: "done" },
        { t: "Diverifikasi petugas", d: "Lokasi & foto sesuai", state: "done" },
        { t: "Sedang diperbaiki", d: "Tim sedang menuju lokasi", state: "now" },
        { t: "Selesai", d: "Menunggu penyelesaian", state: "todo" },
    ] as const;

    return (
        <div className="flex h-full flex-col px-4 pb-4 pt-9 text-[11px]" style={{ color: INK }}>
            <p className="text-[15px] font-semibold tracking-tight">Laporan saya</p>

            <div className="mt-4 rounded-2xl border p-3" style={{ borderColor: LINE }}>
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-[12px] font-semibold">Lampu jalan padam</p>
                        <p className="mt-0.5" style={{ color: MUTED }}>Jl. Sudirman, Medan Petisah</p>
                    </div>
                    <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: "#dcf6e8", color: GREEN }}
                    >
                        Diproses
                    </span>
                </div>
            </div>

            <p className="mt-5 font-medium">Perkembangan</p>
            <ol className="relative mt-3">
                <span
                    aria-hidden="true"
                    className="absolute bottom-3 left-[7px] top-2 w-px"
                    style={{ background: LINE }}
                />
                {steps.map((s) => (
                    <li key={s.t} className="relative flex gap-3 pb-4 last:pb-0">
                        <span
                            className="relative mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2"
                            style={
                                s.state === "todo"
                                    ? { background: "#fff", borderColor: LINE }
                                    : s.state === "now"
                                        ? { background: "#fff", borderColor: GREEN }
                                        : { background: GREEN, borderColor: GREEN }
                            }
                        >
                            {s.state === "done" && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" className="h-2 w-2">
                                    <path d="m5 12 5 5 9-10" />
                                </svg>
                            )}
                            {s.state === "now" && (
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />
                            )}
                        </span>
                        <span>
                            <span
                                className="block font-medium"
                                style={{ color: s.state === "todo" ? "#8a9b93" : INK }}
                            >
                                {s.t}
                            </span>
                            <span className="block text-[10px]" style={{ color: "#8a9b93" }}>
                                {s.d}
                            </span>
                        </span>
                    </li>
                ))}
            </ol>

            <div className="mt-auto flex items-center gap-3 rounded-2xl p-3" style={{ background: "#f3f9f5" }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#dcf6e8" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8" className="h-5 w-5">
                        <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
                        <circle cx="12" cy="12" r="4" />
                    </svg>
                </span>
                <span className="leading-4" style={{ color: MUTED }}>
                    Kamu akan mendapat pembaruan saat status berubah.
                </span>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */

export function MapScreen() {
    const rows = [
        ["Jalan berlubang", "Berat", "120 m", "#e5483a"],
        ["Lampu padam", "Sedang", "250 m", "#d98a1c"],
        ["Drainase mampet", "Ringan", "480 m", "#0b7a52"],
    ];
    return (
        <div className="relative h-full text-[11px]" style={{ color: INK }}>
            <MiniMap
                pins={[
                    { x: 92, y: 200 },
                    { x: 150, y: 260, color: "#d98a1c" },
                    { x: 60, y: 120, color: GREEN },
                ]}
            />

            <div className="absolute inset-x-3 top-9 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-md">
                <svg viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" className="h-3.5 w-3.5">
                    <circle cx="11" cy="11" r="6" />
                    <path d="m20 20-4-4" />
                </svg>
                <span style={{ color: "#8a9b93" }}>Cari lokasi atau jalan</span>
            </div>

            <div className="absolute inset-x-2 bottom-2 rounded-[1.4rem] bg-white p-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
                <span className="mx-auto mb-3 block h-1 w-8 rounded-full" style={{ background: LINE }} />
                <p className="text-[12px] font-semibold">3 kerusakan di sekitarmu</p>
                <ul className="mt-2">
                    {rows.map(([t, lv, d, c]) => (
                        <li key={t} className="flex items-center gap-2.5 border-t py-2" style={{ borderColor: LINE }}>
                            <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                            <span className="flex-1">
                                <span className="block font-medium">{t}</span>
                                <span className="block text-[10px]" style={{ color: MUTED }}>{lv}</span>
                            </span>
                            <span className="text-[10px]" style={{ color: MUTED }}>{d}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */

export function NavScreen() {
    const { t } = useTranslation();
    return (
        <div className="relative h-full text-[11px]" style={{ color: INK }}>
            <MiniMap route pins={[{ x: 90, y: 280 }]} />

            {/* instruksi belok */}
            <div className="absolute inset-x-2 top-8 flex items-center gap-3 rounded-2xl px-3.5 py-3 text-white" style={{ background: INK }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="2.4" className="h-8 w-8 shrink-0" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 20v-8a3 3 0 0 1 3-3h8m-4-4 4 4-4 4" />
                </svg>
                <span>
                    <span className="block text-[17px] font-semibold leading-5">200 m</span>
                    <span className="block text-[10px] text-white/70">
                        {t("navigation.routeSummary", "Belok kanan ke jalan berikutnya")}
                    </span>
                </span>
            </div>

            {/* peringatan */}
            <div className="absolute inset-x-2 bottom-2 rounded-[1.4rem] bg-white p-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#fdeceb" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#e5483a" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 4 3 20h18L12 4Z" />
                            <path d="M12 10v4m0 3h.01" />
                        </svg>
                    </span>
                    <span>
                        <span className="block text-[12px] font-semibold">
                            {t("type.jalan", "Jalan rusak")} <span style={{ color: "#e5483a" }}>({t("severity.berat", "Berat")})</span>
                        </span>
                        <span className="block text-[10px]" style={{ color: MUTED }}>250 m</span>
                    </span>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "#dcf6e8" }}>
                    <span>
                        <span className="block font-semibold" style={{ color: GREEN }}>{t("navigation.safeRoute", "Rute alternatif")}</span>
                        <span className="block text-[10px]" style={{ color: MUTED }}>12 km · 25 min</span>
                    </span>
                    <span className="rounded-full px-3 py-1.5 text-[10px] font-medium text-white" style={{ background: INK }}>
                        {t("common.confirm", "Pakai")}
                    </span>
                </div>
            </div>
        </div>
    );
}
