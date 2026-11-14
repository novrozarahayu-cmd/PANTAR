
import { AlertTriangle, CircleAlert, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReportSeverity } from "../types/reports.types";

interface SeveritySelectorProps {
    value: ReportSeverity | "";
    onChange: (value: ReportSeverity) => void;
}

const severityOptions = [
    {
        value: "ringan",
        label: "Ringan",
        description: "Kerusakan kecil",
        icon: ShieldCheck,
        styles: "border-amber-200 bg-amber-50/60 text-amber-700",
        active: "border-amber-400 ring-2 ring-amber-100",
    },
    {
        value: "sedang",
        label: "Sedang",
        description: "Perlu penanganan",
        icon: AlertTriangle,
        styles: "border-orange-200 bg-orange-50/60 text-orange-700",
        active: "border-orange-400 ring-2 ring-orange-100",
    },
    {
        value: "berat",
        label: "Berat",
        description: "Berbahaya",
        icon: CircleAlert,
        styles: "border-red-200 bg-red-50/60 text-red-700",
        active: "border-red-400 ring-2 ring-red-100",
    },
] as const;

export default function SeveritySelector({
    value,
    onChange,
}: SeveritySelectorProps) {
    const { t } = useTranslation();

    return (
        <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-800">
                {t("reports.form.severityLabel", "Tingkat keparahan")} <span className="text-red-500">*</span>
            </legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {severityOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = value === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onChange(option.value)}
                            className={`rounded-xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${option.styles
                                } ${selected ? option.active : "border-opacity-70"}`}
                        >
                            <span className="flex items-center gap-2">
                                <Icon size={18} />
                                <span className="text-sm font-semibold">
                                    {t(`severity.${option.value}`, option.label)}
                                </span>
                            </span>

                            <span className="mt-2 block text-xs leading-relaxed opacity-80">
                                {option.description}
                            </span>

                            {selected && (
                                <span className="mt-2 block text-xs font-medium">
                                    Dipilih
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}
