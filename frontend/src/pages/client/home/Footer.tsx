import { useTranslation } from "react-i18next";

const links = [
    { label: "Aplikasi", href: "#aplikasi" },
    { label: "Kategori", href: "#kategori" },
    { label: "Cara kerja", href: "#cara-kerja" },
    { label: "Navigasi", href: "#fitur" },
    { label: "Info Medan", href: "#medan" },
    { label: "FAQ", href: "#faq" },
];

const socials = [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "X", href: "https://x.com/" },
    { label: "YouTube", href: "https://youtube.com/" },
];

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="border-t border-[#dfeae3] bg-[#f7fbf8]">
            <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
                <div className="flex flex-col gap-10 md:flex-row md:justify-between">
                    <div className="max-w-xs">
                        <a
                            href="#beranda"
                            className="text-lg font-bold tracking-tight"
                            aria-label="PantauJalan, kembali ke beranda"
                        >
                            Pantau<span className="text-[#0b7a52]">Jalan</span>
                        </a>
                        <p className="mt-3 text-sm leading-6 text-[#4b5d55]">
                            {t("home.footerDesc", "Platform pelaporan kerusakan fasilitas umum untuk Kota Medan.")}
                        </p>
                    </div>

                    <div className="flex gap-16">
                        <nav aria-label="Navigasi footer">
                            <ul className="space-y-3 text-sm">
                                {links.map((l) => (
                                    <li key={l.href}>
                                        <a
                                            href={l.href}
                                            className="text-[#4b5d55] transition-colors hover:text-[#0b7a52]"
                                        >
                                            {l.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        <ul className="space-y-3 text-sm">
                            {socials.map((s) => (
                                <li key={s.label}>
                                    <a
                                        href={s.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#4b5d55] transition-colors hover:text-[#0b7a52]"
                                    >
                                        {s.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <p className="mt-12 border-t border-[#dfeae3] pt-6 text-xs text-[#6b7c74]">
                    © {new Date().getFullYear()} PantauJalan. {t("home.footerRights", "Bersama untuk infrastruktur yang lebih baik.")}
                </p>
            </div>
        </footer>
    );
}
