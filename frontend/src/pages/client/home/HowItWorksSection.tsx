import { useRef } from "react";
import { m, useReducedMotion, useScroll } from "framer-motion";
import { useTranslation } from "react-i18next";
import Reveal from "./Reveal";

const defaultSteps = [
    {
        title: "Laporkan kerusakan",
        text: "Isi formulir singkat, unggah foto, dan tandai lokasinya langsung dari ponselmu.",
    },
    {
        title: "Diverifikasi petugas",
        text: "Petugas memeriksa laporanmu agar informasinya akurat dan bisa ditindaklanjuti.",
    },
    {
        title: "Proses perbaikan",
        text: "Penanganan dilakukan sesuai kondisi dan prioritas di lapangan.",
    },
    {
        title: "Pantau perkembangan",
        text: "Lihat status laporanmu dari awal sampai selesai, kapan saja.",
    },
];

export default function HowItWorksSection() {
    const { t } = useTranslation();
    const ref = useRef<HTMLOListElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 65%", "end 70%"],
    });

    const stepsObj = t("home.howItWorks.steps", { returnObjects: true });
    const steps = Array.isArray(stepsObj) && stepsObj.length > 0
        ? (stepsObj as { title: string; desc: string }[]).map((s) => ({ title: s.title, text: s.desc }))
        : defaultSteps;

    return (
        <section
            id="cara-kerja"
            className="border-t border-[#dfeae3] bg-white py-20 sm:py-28"
        >
            <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                <div className="lg:sticky lg:top-28 lg:self-start">
                    <Reveal>
                        <h2 className="text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
                            {t("home.howItWorks.title", "Dari laporan sampai selesai.")}
                        </h2>
                        <p className="mt-5 max-w-sm text-base leading-7 text-[#4b5d55]">
                            {t("home.howItWorks.subtitle", "Empat langkah, tanpa harus bingung mencari tempat pengaduan.")}
                        </p>
                    </Reveal>
                </div>

                <ol ref={ref} className="relative">
                    {/* rel */}
                    <span
                        aria-hidden="true"
                        className="absolute bottom-3 left-[15px] top-3 w-px bg-[#dfeae3]"
                    />
                    <m.span
                        aria-hidden="true"
                        style={{ scaleY: reduce ? 1 : scrollYProgress }}
                        className="absolute bottom-3 left-[15px] top-3 w-px origin-top bg-[#0b7a52]"
                    />

                    {steps.map((step, i) => (
                        <li key={step.title} className="relative pb-12 pl-14 last:pb-0">
                            <Reveal y={12}>
                                <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-[#dfeae3] bg-white text-xs font-semibold tabular-nums text-[#0b7a52]">
                                    {i + 1}
                                </span>
                                <h3 className="text-xl font-semibold tracking-tight">
                                    {step.title}
                                </h3>
                                <p className="mt-2 max-w-md text-base leading-7 text-[#4b5d55]">
                                    {step.text}
                                </p>
                            </Reveal>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
