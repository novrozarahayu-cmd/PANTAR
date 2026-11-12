import { useTranslation } from "react-i18next";
import Reveal from "./Reveal";

const defaultCategories = [
    { title: "Jalan & jembatan", desc: "Lubang, retak, amblas, pagar jembatan rusak" },
    { title: "Penerangan jalan", desc: "Lampu padam, tiang miring, kabel menjuntai" },
    { title: "Drainase & banjir", desc: "Parit mampet, gorong-gorong rusak, penutup saluran hilang" },
    { title: "Trotoar & penyeberangan", desc: "Paving lepas, zebra cross pudar, rambu rusak" },
    { title: "Halte & transportasi", desc: "Halte rusak, papan informasi mati" },
    { title: "Taman & ruang terbuka", desc: "Bangku patah, alat bermain rusak, pohon tumbang" },
    { title: "Fasilitas publik", desc: "Toilet umum, gedung, tiang dan papan penunjuk" },
    { title: "Lainnya", desc: "Fasilitas umum lain yang kamu temui dalam kondisi rusak" },
];

export default function CategoriesSection() {
    const { t } = useTranslation();
    const categoriesObj = t("home.categories.items", { returnObjects: true });
    const categories = Array.isArray(categoriesObj) && categoriesObj.length > 0
        ? (categoriesObj as { title: string; desc: string }[])
        : defaultCategories;

    return (
        <section id="kategori" className="border-t border-[#dfeae3] py-20 sm:py-28">
            <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                <div className="lg:sticky lg:top-28 lg:self-start">
                    <Reveal>
                        <h2 className="text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
                            {t("home.categories.title", "Bukan hanya jalan.")}
                        </h2>
                        <p className="mt-5 max-w-sm text-base leading-7 text-[#4b5d55]">
                            {t("home.categories.subtitle", "Apa pun fasilitas umum yang rusak di sekitarmu, bisa dilaporkan lewat satu tempat.")}
                        </p>
                    </Reveal>
                </div>

                <ul className="border-t border-[#dfeae3]">
                    {categories.map((cat, i) => (
                        <li key={cat.title}>
                            <Reveal delay={Math.min(i, 4) * 0.04} y={10}>
                                <a
                                    href="/pengaduan"
                                    className="group flex items-start gap-5 border-b border-[#dfeae3] px-1 py-6 transition-colors duration-300 hover:bg-[#dcf6e8]/60 sm:items-center sm:gap-8 sm:px-4"
                                >
                                    <span className="w-6 pt-1 text-xs tabular-nums text-[#0b7a52] sm:pt-0">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span className="flex-1">
                                        <span className="block text-lg font-semibold tracking-tight sm:text-xl">
                                            {cat.title}
                                        </span>
                                        <span className="mt-1 block text-sm leading-6 text-[#4b5d55]">
                                            {cat.desc}
                                        </span>
                                    </span>
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="mt-1.5 h-5 w-5 shrink-0 -translate-x-1 text-[#0b7a52] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:mt-0"
                                        aria-hidden="true"
                                    >
                                        <path d="M5 12h14m-6-6 6 6-6 6" />
                                    </svg>
                                </a>
                            </Reveal>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
