import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "react-i18next";
import Reveal from "./Reveal";

const defaultFaqs = [
    {
        q: "Apa saja yang bisa dilaporkan?",
        a: "Kerusakan fasilitas umum seperti jalan dan jembatan, lampu penerangan, drainase, trotoar, halte, taman, dan fasilitas publik lainnya.",
    },
    {
        q: "Bagaimana cara membuat laporan?",
        a: "Buka halaman pengaduan, isi deskripsi singkat, unggah foto, lalu tandai lokasi kerusakan di peta.",
    },
    {
        q: "Siapa yang memeriksa laporan saya?",
        a: "Petugas memverifikasi setiap laporan terlebih dahulu agar informasinya akurat sebelum ditindaklanjuti.",
    },
    {
        q: "Bagaimana saya memantau perkembangannya?",
        a: "Status laporanmu dapat dilihat dari awal diverifikasi sampai perbaikan selesai.",
    },
    {
        q: "Apa gunanya fitur navigasi?",
        a: "Peta menampilkan titik kerusakan yang sudah diverifikasi dan menawarkan rute alternatif, sehingga kamu bisa memilih jalur yang lebih aman.",
    },
];

export default function FaqSection() {
    const { t } = useTranslation();
    const [open, setOpen] = useState<number | null>(0);

    const faqsObj = t("home.faq.items", { returnObjects: true });
    const faqs = Array.isArray(faqsObj) && faqsObj.length > 0
        ? (faqsObj as { q: string; a: string }[])
        : defaultFaqs;

    return (
        <section id="faq" className="border-t border-[#dfeae3] py-20 sm:py-28">
            <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                <Reveal>
                    <h2 className="text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
                        {t("home.faq.title", "Pertanyaan umum.")}
                    </h2>
                </Reveal>

                <ul className="border-t border-[#dfeae3]">
                    {faqs.map((item, i) => {
                        const isOpen = open === i;
                        return (
                            <li key={item.q} className="border-b border-[#dfeae3]">
                                <h3>
                                    <button
                                        type="button"
                                        onClick={() => setOpen(isOpen ? null : i)}
                                        aria-expanded={isOpen}
                                        className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-semibold tracking-tight sm:text-lg"
                                    >
                                        {item.q}
                                        <span
                                            aria-hidden="true"
                                            className={`relative h-4 w-4 shrink-0 transition-transform duration-300 ${
                                                isOpen ? "rotate-45" : ""
                                            }`}
                                        >
                                            <span className="absolute left-0 top-1/2 h-px w-4 bg-[#0b1d16]" />
                                            <span className="absolute left-1/2 top-0 h-4 w-px bg-[#0b1d16]" />
                                        </span>
                                    </button>
                                </h3>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <m.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            className="overflow-hidden"
                                        >
                                            <p className="max-w-xl pb-6 text-base leading-7 text-[#4b5d55]">
                                                {item.a}
                                            </p>
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
