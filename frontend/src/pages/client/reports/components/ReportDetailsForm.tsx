
import { FileText, MapPin } from "lucide-react";
import type { ChangeEvent } from "react";
import SeveritySelector from "./SeveritySelector";
import ImageUploader from "./ImageUploader";
import type { CreateReportPayload } from "../types/reports.types";

interface ReportDetailsFormProps {
    form: CreateReportPayload;
    onChange: <K extends keyof CreateReportPayload>(
        field: K,
        value: CreateReportPayload[K],
    ) => void;
    errors: Partial<Record<keyof CreateReportPayload, string>>;
}

const reportTypes = [
    { value: "jalan", label: "Jalan" },
    { value: "lampu-jalan", label: "Lampu jalan" },
    { value: "trotoar", label: "Trotoar" },
    { value: "halte", label: "Halte" },
    { value: "taman", label: "Taman" },
    { value: "lainnya", label: "Lainnya" },
] as const;


export default function ReportDetailsForm({
    form,
    onChange,
    errors,
}: ReportDetailsFormProps) {
    const handleTextChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;

        if (name === "title" || name === "description") {
            onChange(name, value);
        }
    };

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7 pt-20">
            <div className="mb-7 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FileText size={20} />
                </span>

                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        Detail pengaduan
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        Isi informasi kerusakan dengan lengkap agar petugas lebih mudah
                        memahami laporan Anda.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label
                        htmlFor="title"
                        className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                        Nama kerusakan <span className="text-red-500">*</span>
                    </label>

                    <input
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleTextChange}
                        maxLength={120}
                        placeholder="Contoh: Jalan berlubang di depan sekolah"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />

                    {errors.title && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.title}</p>
                    )}
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <label
                            htmlFor="description"
                            className="text-sm font-semibold text-slate-800"
                        >
                            Deskripsi kerusakan <span className="text-red-500">*</span>
                        </label>

                        <span className="text-xs text-slate-400">
                            {form.description.length}/500
                        </span>
                    </div>

                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleTextChange}
                        maxLength={500}
                        rows={4}
                        placeholder={`Contoh: Terdapat lubang di badan jalan dengan diameter sekitar 50 cm dan kedalaman 10 cm. Kerusakan berada di dekat persimpangan dan sering tergenang air saat hujan, sehingga pengendara motor harus menghindar dan berisiko terjatuh.`}
                        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />

                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        Jelaskan jenis kerusakan, perkiraan ukuran atau tingkat keparahan,
                        lokasi yang lebih spesifik, dan dampaknya bagi pengguna jalan.
                    </p>

                    {errors.description && (
                        <p className="mt-1.5 text-sm text-red-600">
                            {errors.description}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="type"
                        className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                        Tipe pelaporan <span className="text-red-500">*</span>
                    </label>

                    <select
                        id="type"
                        name="type"
                        value={form.type}
                        onChange={(event) => {
                            const value = event.target.value as CreateReportPayload["type"];

                            console.log("Tipe yang dipilih:", value);

                            onChange("type", value);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    >
                        <option value="" disabled>
                            Pilih tipe pelaporan
                        </option>

                        {reportTypes.map((reportType) => (
                            <option
                                key={reportType.value}
                                value={reportType.value}
                            >
                                {reportType.label}
                            </option>
                        ))}
                    </select>

                    {errors.type && (
                        <p className="mt-1.5 text-sm text-red-600">
                            {errors.type}
                        </p>
                    )}
                </div>

                <SeveritySelector
                    value={form.severity}
                    onChange={(value) => onChange("severity", value)}
                />

                {errors.severity && (
                    <p className="-mt-4 text-sm text-red-600">{errors.severity}</p>
                )}

                <ImageUploader
                    value={form.images}
                    onChange={(files) => onChange("images", files)}
                    error={errors.images}
                />

                <div className="flex items-start gap-2 rounded-xl bg-emerald-50/80 p-3.5 text-sm leading-relaxed text-emerald-800">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                    <p>
                        Pastikan lokasi pada peta sesuai dengan lokasi kerusakan yang
                        Anda laporkan.
                    </p>
                </div>
            </div>
        </section>
    );
}
