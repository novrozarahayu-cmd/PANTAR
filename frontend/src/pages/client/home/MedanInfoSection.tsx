import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Reveal from "./Reveal";
import { CAMAT_SOURCE_URL, camatMedan } from "./medanCamat";

export default function MedanInfoSection() {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");

    const facts = [
        { value: "21", label: t("home.medanInfo.facts.0.label", "Kecamatan") },
        { value: "151", label: t("home.medanInfo.facts.1.label", "Kelurahan") },
        { value: "112", label: t("home.medanInfo.facts.2.label", "Layanan darurat, bebas pulsa") },
    ];

    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return camatMedan;
        return camatMedan.filter(
            (c) =>
                c.kecamatan.toLowerCase().includes(q) ||
                (c.camat ?? "").toLowerCase().includes(q),
        );
    }, [query]);

    return (
        <section
            id="medan"
            className="border-t border-[#dfeae3] bg-white py-20 sm:py-28"
        >
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
                <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                    <Reveal>
                        <h2 className="text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
                            {t("home.medanInfo.title", "Kenali wilayahmu di Medan.")}
                        </h2>
                        <p className="mt-5 max-w-sm text-base leading-7 text-[#4b5d55]">
                            {t("home.medanInfo.subtitle", "Tahu siapa camat di kecamatanmu memudahkan tindak lanjut laporan di tingkat wilayah.")}
                        </p>
                    </Reveal>

                    <Reveal delay={0.08}>
                        <dl className="grid grid-cols-3 gap-4 sm:gap-8">
                            {facts.map((f) => (
                                <div key={f.value} className="border-t border-[#0b1d16] pt-4">
                                    <dd className="text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
                                        {f.value}
                                    </dd>
                                    <dt className="mt-2 text-xs leading-5 text-[#4b5d55] sm:text-sm">
                                        {f.label}
                                    </dt>
                                </div>
                            ))}
                        </dl>
                    </Reveal>
                </div>

                <div className="mt-16">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <h3 className="text-xl font-semibold tracking-tight">
                            {t("home.medanInfo.sectionTitle", "Camat 21 kecamatan")}
                        </h3>

                        <label className="relative block w-full sm:w-72">
                            <span className="sr-only">Cari kecamatan atau nama camat</span>
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t("home.medanInfo.searchPlaceholder", "Cari kecamatan atau nama")}
                                className="w-full rounded-full border border-[#dfeae3] bg-[#f7fbf8] px-5 py-2.5 text-sm outline-none transition-colors placeholder:text-[#8a9b93] focus:border-[#0b7a52]"
                            />
                        </label>
                    </div>

                    {list.length === 0 ? (
                        <p className="mt-8 text-sm text-[#4b5d55]">
                            {t("home.medanInfo.noResult", { query, defaultValue: `Tidak ada hasil untuk "${query}".` })}
                        </p>
                    ) : (
                        <ul className="mt-6 grid border-t border-[#dfeae3] sm:grid-cols-2 sm:gap-x-12 lg:grid-cols-3">
                            {list.map((c) => (
                                <li
                                    key={c.kecamatan}
                                    className="border-b border-[#dfeae3] py-4"
                                >
                                    <p className="text-sm font-semibold">
                                        {c.kecamatan}
                                    </p>
                                    {c.camat ? (
                                        <p className="mt-1 text-sm leading-6 text-[#4b5d55]">
                                            {c.camat}
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-sm italic text-[#8a9b93]">
                                            {t("home.medanInfo.pending", "Data menyusul")}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    <p className="mt-6 text-xs leading-5 text-[#6b7c74]">
                        Sumber:{" "}
                        <a
                            href={CAMAT_SOURCE_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2 hover:text-[#0b7a52]"
                        >
                            portal.medan.go.id
                        </a>
                        . Pejabat dapat berganti; periksa situs resmi Pemko
                        Medan untuk data terbaru.
                    </p>
                </div>
            </div>
        </section>
    );
}
