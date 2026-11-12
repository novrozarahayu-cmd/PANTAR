import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
    AnimatePresence,
    motion,
    useReducedMotion,
    type Variants,
} from "framer-motion";

const defaultWords = [
    "Jalan berlubang",
    "Lampu padam",
    "Drainase mampet",
    "Halte rusak",
    "Trotoar retak",
    "Jembatan retak",
];

const wordVariants: Variants = {
    initial: { opacity: 0, y: 18, filter: "blur(4px)" },
    animate: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
        opacity: 0,
        y: -16,
        filter: "blur(4px)",
        transition: { duration: 0.25, ease: "easeIn" },
    },
};

function RotatingWord() {
    const { t } = useTranslation();
    const wordsObj = t("home.hero.words", { returnObjects: true });
    const words = Array.isArray(wordsObj) && wordsObj.length > 0 ? (wordsObj as string[]) : defaultWords;
    const [activeIndex, setActiveIndex] = useState(0);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (shouldReduceMotion) return;
        const interval = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % words.length);
        }, 2400);
        return () => window.clearInterval(interval);
    }, [shouldReduceMotion, words.length]);

    const activeWord = words[activeIndex % words.length];

    if (shouldReduceMotion) {
        return <span className="text-emerald-600">{activeWord}</span>;
    }

    return (
        <span className="relative inline-grid align-bottom text-left">
            <span className="invisible col-start-1 row-start-1 whitespace-nowrap">
                {words.reduce(
                    (longest, word) =>
                        word.length > longest.length ? word : longest,
                    ""
                )}
            </span>

            <AnimatePresence mode="wait">
                <motion.span
                    key={activeWord}
                    variants={wordVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="col-start-1 row-start-1 whitespace-nowrap text-emerald-600"
                >
                    {activeWord}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

/* ---------- Right side building blocks ---------- */

/** Kartu melayang: bergerak naik-turun pelan, mati otomatis jika reduced motion */
function FloatCard({
    children,
    className = "",
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={`absolute z-20 rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.28)] backdrop-blur-md ${className}`}
            animate={reduce ? undefined : { y: [0, -8, 0] }}
            transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
            }}
        >
            {children}
        </motion.div>
    );
}

/** Pin di peta. x/y dalam persen terhadap area peta */
function MapPin({
    x,
    y,
    color,
    pulse = false,
    children,
}: {
    x: number;
    y: number;
    color: string;
    pulse?: boolean;
    children: ReactNode;
}) {
    return (
        <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
        >
            {pulse && (
                <span
                    className={`absolute inset-0 animate-ping rounded-full opacity-40 motion-reduce:hidden ${color}`}
                />
            )}
            <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow-md ${color}`}
            >
                {children}
            </span>
        </div>
    );
}

const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
    "aria-hidden": true,
};

function PhoneMockup() {
    const { t } = useTranslation();
    return (
        <div className="relative mx-auto aspect-[9/18.4] w-[250px] rounded-[2.4rem] border-[7px] border-slate-900 bg-slate-900 shadow-[0_40px_80px_-30px_rgba(15,23,42,0.55)] sm:w-[280px]">
            <div className="relative h-full w-full overflow-hidden rounded-[1.9rem] bg-[#eaf6ee]">
                {/* Peta */}
                <svg
                    viewBox="0 0 300 560"
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0 h-full w-full"
                    aria-hidden="true"
                >
                    <rect width="300" height="560" fill="#eaf6ee" />
                    {/* taman & sungai */}
                    <rect x="20" y="70" width="90" height="70" rx="10" fill="#cdeedb" />
                    <rect x="190" y="300" width="90" height="80" rx="10" fill="#cdeedb" />
                    <path
                        d="M-10 250 C 60 220, 120 300, 190 260 S 280 200, 320 230 L 320 262 C 280 236, 220 290, 190 296 C 120 336, 60 256, -10 284 Z"
                        fill="#cfe6f4"
                    />
                    {/* jalan */}
                    <g stroke="#ffffff" strokeLinecap="round" fill="none">
                        <path d="M-10 170 L 310 150" strokeWidth="16" />
                        <path d="M-10 400 L 310 420" strokeWidth="16" />
                        <path d="M95 -10 L 120 580" strokeWidth="14" />
                        <path d="M220 -10 L 190 580" strokeWidth="12" />
                        <path d="M-10 70 L 310 60" strokeWidth="7" />
                        <path d="M-10 500 L 310 490" strokeWidth="7" />
                    </g>
                    {/* jembatan di atas sungai */}
                    <rect x="84" y="244" width="46" height="28" rx="4" fill="#ffffff" />
                    {/* rute */}
                    <path
                        d="M100 400 L 110 300 L 108 168 L 205 160"
                        stroke="#059669"
                        strokeWidth="4"
                        strokeDasharray="2 8"
                        strokeLinecap="round"
                        fill="none"
                    />
                </svg>

                {/* Notch + search */}
                <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
                <div className="absolute inset-x-3 top-10 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-md">
                    <svg {...iconProps} className="h-4 w-4 text-slate-400">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                    </svg>
                    <span className="text-[11px] text-slate-500">Cari lokasi kerusakan</span>
                </div>

                {/* Pin */}
                <MapPin x={70} y={30} color="bg-amber-500">
                    <svg {...iconProps}>
                        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.500A6 6 0 0 0 12 3Z" />
                    </svg>
                </MapPin>
                <MapPin x={37} y={47} color="bg-rose-500">
                    <svg {...iconProps}>
                        <path d="M3 18h18M5 18v-5a7 7 0 0 1 14 0v5M12 6v12" />
                    </svg>
                </MapPin>
                <MapPin x={36} y={72} color="bg-orange-500" pulse>
                    <svg {...iconProps}>
                        <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.500h15.800a2 2 0 0 0 1.7-3L13.7 3.900a2 2 0 0 0-3.4 0Z" />
                    </svg>
                </MapPin>

                {/* Bottom sheet */}
                <div className="absolute inset-x-2 bottom-2 rounded-2xl bg-white p-3 shadow-[0_-8px_30px_-10px_rgba(15,23,42,0.25)]">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-300">
                            <svg {...iconProps} className="h-5 w-5 text-slate-500">
                                <path d="M4 7h3l2-3h6l2 3h3v12H4Z" />
                                <circle cx="12" cy="13" r="3.5" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-800">
                                {t("type.jalan", "Jalan berlubang")}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">
                                Jl. Gatot Subroto, Medan
                            </p>
                            <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                {t("home.hero.mockup.waitingVerification", "Menunggu verifikasi")}
                            </span>
                        </div>
                    </div>

                    {/* Tahapan: ini memang urutan nyata */}
                    <div className="mt-3 flex items-center">
                        {[
                            t("home.hero.mockup.reported", "Dilaporkan"),
                            t("home.hero.mockup.verified", "Diverifikasi"),
                            t("home.hero.mockup.working", "Dikerjakan"),
                            t("home.hero.mockup.resolved", "Selesai")
                        ].map((step, i) => (
                            <div key={step} className="flex flex-1 items-center last:flex-none">
                                <span
                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-emerald-600" : "bg-slate-200"
                                        }`}
                                    title={step}
                                />
                                {i < 3 && <span className="mx-1 h-0.5 flex-1 rounded bg-slate-200" />}
                            </div>
                        ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[9px] text-slate-400">
                        <span>{t("home.hero.mockup.reported", "Dilaporkan")}</span>
                        <span>{t("home.hero.mockup.resolved", "Selesai")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HeroVisual() {
    const { t } = useTranslation();
    return (
        <div className="relative mx-auto w-full max-w-[560px] py-6 lg:max-w-none">
            {/* Aksen latar */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[10%] inset-y-[6%] rounded-[3rem] bg-gradient-to-br from-emerald-100 via-emerald-50 to-lime-100"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[8%] top-[14%] h-24 w-24 rounded-full border border-emerald-200/70"
            />

            <div className="relative">
                <PhoneMockup />

                {/* Notifikasi laporan masuk */}
                <FloatCard className="left-0 top-[10%] w-[178px] sm:left-[4%] sm:w-[205px]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                            <svg {...iconProps}>
                                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                                <circle cx="12" cy="10" r="2.5" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{t("home.hero.mockup.newReport", "Laporan baru")}</p>
                            <p className="truncate text-xs text-slate-500">{t("home.hero.mockup.sampleRoad", "Lubang di Jl. Gatot Subroto")}</p>
                        </div>
                    </div>
                </FloatCard>

                {/* Progres penanganan */}
                <FloatCard
                    className="bottom-[16%] right-0 w-[190px] sm:right-[3%] sm:w-[215px]"
                    delay={1.2}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">{t("home.hero.mockup.inProgress", "Sedang dikerjakan")}</p>
                        <span className="text-xs font-medium text-emerald-700">60%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-3/5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{t("home.hero.mockup.officerOnSite", "Petugas sudah di lokasi.")}</p>
                </FloatCard>

                {/* Foto bukti */}
                <FloatCard
                    className="right-[2%] top-[30%] hidden w-[150px] p-2.5 sm:block"
                    delay={2.2}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <svg {...iconProps}>
                                <path d="M4 7h3l2-3h6l2 3h3v12H4Z" />
                                <circle cx="12" cy="13" r="3.5" />
                            </svg>
                        </div>
                        <p className="text-xs font-medium leading-4 text-slate-700">
                            {t("home.hero.mockup.photoAttached", "Foto & lokasi terlampir")}
                        </p>
                    </div>
                </FloatCard>
            </div>
        </div>
    );
}

export default function HeroSection() {
    const { t } = useTranslation();

    return (
        <section
            id="beranda"
            className="relative isolate overflow-hidden bg-[#f8fcf9] pt-6"
        >
            {/* Background decoration */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-32 top-10 -z-10 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-32 bottom-0 -z-10 h-80 w-80 rounded-full bg-lime-200/30 blur-3xl"
            />

            <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8 lg:px-10">
                {/* Left content */}
                <div className="relative z-10 mx-auto w-full max-w-2xl text-center lg:mx-0 lg:text-left">
                    <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-[3.65rem] xl:text-7xl">
                        {t("home.hero.titlePrefix", "Temukan dan laporkan")}
                        <span className="mt-2 block min-h-[1.2em] text-emerald-600">
                            <RotatingWord />
                        </span>
                        <span className="mt-2 block">{t("home.hero.titleSuffix", "di sekitarmu.")}</span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
                        {t(
                            "home.hero.desc",
                            "Bantu wujudkan lingkungan yang lebih aman dan nyaman dengan melaporkan kerusakan jalan serta fasilitas umum. Laporanmu membantu masyarakat dan petugas mengetahui masalah yang perlu segera ditangani."
                        )}
                    </p>

                    {/* CTA */}
                    <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                        <Link
                            to="/form-pengaduan"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                        >
                            {t("home.hero.ctaReport", "Laporkan Kerusakan")}
                            <svg
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-5 w-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7 17 17 7M7 7h10v10"
                                />
                            </svg>
                        </Link>

                        <Link
                            to="/pengaduan"
                            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                        >
                            {t("home.hero.trustReports")}
                        </Link>
                    </div>

                    {/* Supporting information */}
                    <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-500 lg:justify-start">
                        <div className="flex items-center gap-2">
                            <svg
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-5 w-5 text-emerald-600"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"
                                />
                                <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
                            </svg>
                            <span>{t("home.hero.trustReports", "Laporan masyarakat")}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <svg
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-5 w-5 text-emerald-600"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"
                                />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5" />
                            </svg>
                            <span>{t("home.hero.trustResolved", "Pantau tindak lanjut")}</span>
                        </div>
                    </div>
                </div>

                {/* Right: mockup aplikasi */}
                <HeroVisual />
            </div>
        </section>
    );
}