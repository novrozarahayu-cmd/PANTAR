
import { useState } from "react";
import { ArrowRight, CheckCircle2, Send } from "lucide-react";
import { createReport } from "./api/reports.api.ts";
import { getApiErrorMessage } from "../../../utils/api-error.ts";
import { initialPengaduanForm, type CreateReportPayload } from "./types/reports.types.ts";
import ReportDetailsForm from "./components/ReportDetailsForm.tsx";
import ReportLocation from "./components/ReportLocation.tsx";
import Swal from "sweetalert2";

type FormErrors = Partial<Record<keyof CreateReportPayload, string>>;

export default function ReportPage() {
    const [form, setForm] = useState<CreateReportPayload>(initialPengaduanForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");

    const handleChange = <K extends keyof CreateReportPayload>(
        field: K,
        value: CreateReportPayload[K],
    ) => {

        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setErrors((current) => ({
            ...current,
            [field]: undefined,
        }));

        setSubmitError("");
        setSubmitSuccess("");
    };

    const validateForm = (): FormErrors => {
        const nextErrors: FormErrors = {};

        if (!form.title.trim()) {
            nextErrors.title = "Nama kerusakan wajib diisi.";
        }

        if (!form.description.trim()) {
            nextErrors.description = "Deskripsi kerusakan wajib diisi.";
        }

        if (!form.type) {
            nextErrors.type = "Pilih tipe pelaporan.";
        }

        if (!form.severity) {
            nextErrors.severity = "Pilih tingkat keparahan kerusakan.";
        }

        if (form.latitude === null || form.longitude === null) {
            nextErrors.latitude = "Pilih lokasi kerusakan pada peta.";
        }

        if (form.images.length === 0) {
            nextErrors.images = "Unggah minimal satu foto kerusakan.";
        }

        return nextErrors;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextErrors = validateForm();
        setErrors(nextErrors);
        setSubmitError("");
        setSubmitSuccess("");

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        if (
            !form.severity ||
            form.latitude === null ||
            form.longitude === null
        ) {
            return;
        }

        setIsSubmitting(true);

        try {
            const payload: CreateReportPayload = {
                title: form.title.trim(),
                description: form.description.trim(),
                severity: form.severity,
                latitude: form.latitude,
                longitude: form.longitude,
                type: form.type,
                images: form.images,
            };

            const response = await createReport(payload);


            setForm(initialPengaduanForm);
            setErrors({});
            setSubmitError("");
            setSubmitSuccess("");

            await Swal.fire({
                icon: "success",
                title: "Pengaduan Berhasil Dibuat!",
                text:
                    response.message ||
                    "Terima kasih! Laporan kerusakan fasilitas berhasil dikirim.",
                confirmButtonText: "Tutup",
                confirmButtonColor: "#2563eb",
                allowOutsideClick: false,
                customClass: {
                    popup: "rounded-2xl",
                    confirmButton: "rounded-lg px-5 py-2.5",
                },
            });
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);

            setSubmitError(message);

            await Swal.fire({
                icon: "error",
                title: "Pengaduan Gagal",
                text: message,
                confirmButtonText: "Coba Lagi",
                confirmButtonColor: "#2563eb",
                customClass: {
                    popup: "rounded-2xl",
                    confirmButton: "rounded-lg px-5 py-2.5",
                },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-slate-50 to-white pt-15">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                <div className="mb-8">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Laporan masyarakat
                        </span>

                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                            Laporkan kerusakan{" "}
                            <span className="text-emerald-600">fasilitas umum.</span>
                        </h1>

                        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                            Bantu menciptakan lingkungan yang lebih aman. Isi detail
                            kerusakan, tentukan lokasi, dan sertakan foto agar laporan
                            dapat diverifikasi petugas.
                        </p>
                    </div>
                </div>

                {submitSuccess && (
                    <div
                        role="status"
                        className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
                    >
                        <CheckCircle2 className="mt-0.5 shrink-0" size={21} />
                        <div>
                            <p className="font-semibold">{submitSuccess}</p>
                            <p className="mt-1 text-sm">
                                Terima kasih sudah membantu memperbaiki fasilitas umum.
                            </p>
                        </div>
                    </div>
                )}

                {submitError && (
                    <div
                        role="alert"
                        className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
                        <ReportDetailsForm
                            form={form}
                            onChange={handleChange}
                            errors={errors}
                        />

                        <ReportLocation
                            latitude={form.latitude}
                            longitude={form.longitude}
                            onCoordinatesChange={(latitude, longitude) => {
                                setForm((current) => ({
                                    ...current,
                                    latitude,
                                    longitude,
                                }));

                                setErrors((current) => ({
                                    ...current,
                                    latitude: undefined,
                                    longitude: undefined,
                                }));

                                setSubmitError("");
                            }}
                            locationError={errors.latitude}
                        />
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <p className="text-xs leading-relaxed text-slate-500 sm:max-w-sm">
                            Pastikan informasi dan lokasi yang kamu berikan sudah benar
                            sebelum mengirim laporan.
                        </p>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => {
                                    setForm(initialPengaduanForm);
                                    setErrors({});
                                    setSubmitError("");
                                    setSubmitSuccess("");
                                }}
                                disabled={isSubmitting}
                                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Reset form
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    "Mengirim laporan..."
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Kirim pengaduan
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}
