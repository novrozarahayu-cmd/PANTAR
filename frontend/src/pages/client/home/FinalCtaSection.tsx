import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import Reveal from "./Reveal";

const defaultReports = [
    {
        titleKey: "type.jalan",
        defaultTitle: "Jalan berlubang",
        place: "Jl. Gatot Subroto",
        statusKey: "home.hero.mockup.waitingVerification",
        defaultStatus: "Menunggu verifikasi",
        chip: "bg-amber-100 text-amber-700",
        dot: "bg-amber-500",
        offset: "lg:translate-x-0 lg:-rotate-2",
    },
    {
        titleKey: "type.lampu-jalan",
        defaultTitle: "Lampu jalan padam",
        place: "Jl. Sisingamangaraja",
        statusKey: "home.hero.mockup.inProgress",
        defaultStatus: "Sedang dikerjakan",
        chip: "bg-sky-100 text-sky-700",
        dot: "bg-sky-500",
        offset: "lg:translate-x-8 lg:rotate-1",
    },
    {
        titleKey: "type.halte",
        defaultTitle: "Halte rusak",
        place: "Jl. Imam Bonjol",
        statusKey: "status.selesai",
        defaultStatus: "Selesai",
        chip: "bg-emerald-100 text-emerald-700",
        dot: "bg-emerald-500",
        offset: "lg:translate-x-2 lg:-rotate-1",
    },
];

const defaultChecklist = ["Tanpa biaya", "Cukup foto & lokasi", "Status bisa dipantau"];

export default function FinalCtaSection() {
    const { t } = useTranslation();

    const checklistObj = t("home.finalCta.features", { returnObjects: true });
    const checklist = Array.isArray(checklistObj) && checklistObj.length > 0
        ? (checklistObj as string[])
        : defaultChecklist;

    return (
        <section className="px-4 pb-16 sm:px-6 sm:pb-24">
            <Reveal y={20}>
                <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-[#dcf6e8] px-6 py-14 sm:rounded-[36px] sm:px-14 sm:py-20">
                    {/* Pola titik halus */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
                        style={{
                            backgroundImage:
                                "radial-gradient(rgba(5,150,105,0.22) 1.2px, transparent 1.2px)",
                            backgroundSize: "22px 22px",
                            maskImage:
                                "linear-gradient(to right, transparent 0%, black 45%, black 100%)",
                            WebkitMaskImage:
                                "linear-gradient(to right, transparent 0%, black 45%, black 100%)",
                        }}
                    />
                    {/* Cahaya lembut */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-28 -left-20 -z-10 h-64 w-64 rounded-full bg-lime-200/60 blur-3xl"
                    />

                    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
                        {/* Teks */}
                        <div>
                            <h2 className="max-w-2xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#0b1d16] sm:text-6xl">
                                {t("home.finalCta.titleLine1", "Lihat yang rusak?")}
                                <br />
                                {t("home.finalCta.titleLine2", "Laporkan sekarang.")}
                            </h2>
                            <p className="mt-5 max-w-md text-base leading-7 text-[#2f4a3e]">
                                {t("home.finalCta.subtitle", "Jalan dan fasilitas yang baik adalah hak setiap orang. Mulai dari satu laporan.")}
                            </p>

                            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                                <Link
                                    to="/form-pengaduan"
                                    className="group inline-flex items-center gap-3 rounded-full bg-emerald-600 py-2 pl-6 pr-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#dcf6e8]"
                                >
                                    {t("home.finalCta.btnReport", "Buat laporan")}
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 transition-transform duration-300 group-hover:translate-x-0.5">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        >
                                            <path d="M5 12h14m-6-6 6 6-6 6" />
                                        </svg>
                                    </span>
                                </Link>

                                <Link
                                    to="/pengaduan"
                                    className="rounded-full px-2 py-2 text-sm font-semibold text-emerald-800 underline-offset-4 transition-colors hover:text-emerald-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                                >
                                    {t("home.finalCta.btnExplore", "Lihat laporan warga")}
                                </Link>
                            </div>

                            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#2f4a3e]">
                                {checklist.map((item) => (
                                    <li key={item} className="flex items-center gap-2">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.2"
                                            className="h-4 w-4 text-emerald-600"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m5 12 5 5L20 7"
                                            />
                                        </svg>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Tumpukan kartu laporan */}
                        <div
                            className="hidden flex-col gap-3 lg:flex"
                            aria-hidden="true"
                        >
                            {defaultReports.map((r) => (
                                <div
                                    key={r.place}
                                    className={`flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.3)] backdrop-blur ${r.offset}`}
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            className="h-5 w-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                                            />
                                            <circle cx="12" cy="10" r="2.5" />
                                        </svg>
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                            {t(r.titleKey, r.defaultTitle)}
                                        </p>
                                        <p className="truncate text-xs text-slate-500">
                                            {r.place}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${r.chip}`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
                                        {t(r.statusKey, r.defaultStatus)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}
