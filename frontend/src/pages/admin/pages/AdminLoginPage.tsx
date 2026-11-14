import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    LoaderCircle,
    Lock,
    Mail,
    MapPin,
} from "lucide-react";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { loginAdmin } from "../api/auth.api";
import { saveAdminSession, getAdminToken } from "../utils/auth-storage";
import { getApiErrorMessage } from "../../../utils/api-error";

const previewRows = [
    { title: "Jalan berlubang", place: "Jl. Gatot Subroto", status: "Menunggu", chip: "bg-amber-100 text-amber-700" },
    { title: "Lampu jalan padam", place: "Jl. Sisingamangaraja", status: "Diproses", chip: "bg-lime-100 text-lime-700" },
    { title: "Halte rusak", place: "Jl. Imam Bonjol", status: "Selesai", chip: "bg-emerald-100 text-emerald-700" },
];

/** Panel kiri: pratinjau dashboard dibuat dari kode, tanpa foto. */
function BrandPanel() {
    return (
        <section className="relative hidden overflow-hidden bg-emerald-800 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14">
            {/* Dekorasi */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                    backgroundImage:
                        "radial-gradient(rgba(255,255,255,0.12) 1.2px, transparent 1.2px)",
                    backgroundSize: "24px 24px",
                    maskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
                }}
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-40 -right-32 h-[26rem] w-[26rem] rounded-full border-[48px] border-white/5"
            />

            {/* Logo */}
            <div className="relative flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-700">
                    <MapPin size={22} />
                </span>
                <div>
                    <p className="text-lg font-extrabold tracking-tight">PANTAR</p>
                    <p className="text-xs text-emerald-100/80">Panel admin</p>
                </div>
            </div>

            {/* Teks */}
            <div className="relative mt-10">
                <h1 className="max-w-md text-4xl font-bold leading-[1.15] tracking-tight xl:text-[2.6rem]">
                    Tindak lanjuti laporan warga dengan lebih cepat.
                </h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-emerald-100/85">
                    Pantau laporan masuk, periksa tingkat kerusakan, dan perbarui
                    progres penanganan dari satu tempat.
                </p>

                <ul className="mt-6 space-y-2.5 text-sm text-emerald-50">
                    {[
                        "Laporan masuk hari ini langsung terlihat",
                        "Sebaran laporan per kecamatan dan kelurahan",
                        "Riwayat progres perbaikan tiap laporan",
                    ].map((item) => (
                        <li key={item} className="flex items-center gap-2.5">
                            <CheckCircle2 size={17} className="shrink-0 text-emerald-300" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Pratinjau dashboard (dekoratif) */}
            <div aria-hidden="true" className="relative mt-10 h-[250px]">
                <div className="absolute inset-x-0 top-0 rounded-2xl bg-white p-4 text-slate-800 shadow-2xl shadow-emerald-950/30 xl:mr-10">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-bold">Laporan hari ini</p>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            3
                        </span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {previewRows.map((row) => (
                            <li key={row.title} className="flex items-center gap-3 py-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                    <MapPin size={16} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{row.title}</p>
                                    <p className="truncate text-xs text-slate-400">{row.place}</p>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.chip}`}>
                                    {row.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="absolute -bottom-2 right-0 w-48 rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5 text-slate-800 shadow-xl shadow-emerald-950/20">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-emerald-900">Tingkat penyelesaian</span>
                        <span className="font-bold text-emerald-700">68%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                        <div className="h-full w-[68%] rounded-full bg-emerald-600" />
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function AdminLoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    if (getAdminToken()) {
        return <Navigate to="/admin" replace />;
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await loginAdmin({ email, password });

            if (!response.success || !response.data?.token || !response.data?.user) {
                throw new Error(response.message || "Login gagal.");
            }

            if (
                response.data.user.role !== "admin" ||
                !response.data.user.isActive
            ) {
                navigate("/403", { replace: true });
                return;
            }

            saveAdminSession(response.data.token, response.data.user);
            navigate("/admin", { replace: true });
        } catch (requestError: unknown) {
            setError(
                getApiErrorMessage(requestError, "Login gagal. Periksa email dan password."),
            );
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass =
        "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

    return (
        <main className="grid min-h-screen bg-[#f6faf7] lg:grid-cols-2">
            <BrandPanel />

            <section className="flex flex-col px-6 py-6 sm:px-12 lg:px-14">
                {/* Bar atas */}
                <div className="flex items-center justify-between">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-medium text-slate-500 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    >
                        <ArrowLeft size={16} />
                        {t("admin.backHome", "Kembali ke beranda")}
                    </Link>
                    <LanguageSwitcher variant="admin" />
                </div>

                {/* Form */}
                <div className="flex flex-1 items-center justify-center py-10">
                    <div className="w-full max-w-md">
                        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                <MapPin size={20} />
                            </span>
                            <span className="text-base font-extrabold tracking-tight text-slate-900">
                                Pantau<span className="text-emerald-600">Jalan</span>
                            </span>
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            {t("admin.loginTitle", "Selamat datang")}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            {t("admin.loginSubtitle", "Masuk menggunakan akun administrator untuk melanjutkan.")}
                        </p>

                        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                                    {t("admin.emailLabel", "Email")}
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="username"
                                        required
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder={t("admin.emailPlaceholder", "Masukkan email admin")}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                                    {t("admin.passwordLabel", "Password")}
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder={t("admin.passwordPlaceholder", "Masukkan password")}
                                        className={`${inputClass} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((current) => !current)}
                                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p
                                    role="alert"
                                    className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-700"
                                >
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <>
                                        <LoaderCircle size={18} className="animate-spin" />
                                        {t("admin.loggingInBtn", "Memproses login...")}
                                    </>
                                ) : (
                                    t("admin.loginBtn", "Masuk ke Dashboard")
                                )}
                            </button>
                        </form>

                        <p className="mt-8 border-t border-slate-200 pt-5 text-center text-xs leading-5 text-slate-400">
                            Akses terbatas untuk administrator yang berwenang.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}