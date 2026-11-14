import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ShieldX } from "lucide-react";

export default function ForbiddenPage() {
    const { t } = useTranslation();

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <ShieldX size={38} />
                </div>

                <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-red-600">
                    Error 403
                </p>

                <h1 className="mt-3 text-3xl font-bold text-slate-900">
                    {t("common.error", "Akses ditolak")}
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                    Kamu tidak memiliki izin untuk mengakses halaman ini.
                    Silakan kembali atau masuk menggunakan akun administrator yang sesuai.
                </p>

                <Link
                    to="/admin"
                    className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                    <ArrowLeft size={17} />
                    {t("common.back", "Kembali")}
                </Link>
            </div>
        </main>
    );
}