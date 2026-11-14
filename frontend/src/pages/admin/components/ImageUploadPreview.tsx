
import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";

type ImageUploadPreviewProps = {
    files: File[];
    onChange: (files: File[]) => void;
    label: string;
    description?: string;
};

export default function ImageUploadPreview({
    files,
    onChange,
    label,
    description = "JPG, PNG atau WEBP",
}: ImageUploadPreviewProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const previews = useMemo(
        () => files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        })),
        [files],
    );

    useEffect(() => {
        return () => {
            previews.forEach(({ url }) => URL.revokeObjectURL(url));
        };
    }, [previews]);

    const addFiles = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const imageFiles = Array.from(selectedFiles).filter((file) =>
            file.type.startsWith("image/"),
        );

        onChange([...files, ...imageFiles]);

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const removeFile = (index: number) => {
        onChange(files.filter((_, fileIndex) => fileIndex !== index));
    };

    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="mt-1 text-xs text-slate-500">
                    {description}. Kamu bisa memilih beberapa foto sekaligus.
                </p>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => addFiles(event.target.files)}
            />

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50"
            >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                    <UploadCloud size={22} />
                </span>

                <span className="mt-3 text-sm font-semibold text-slate-800">
                    Klik untuk memilih foto
                </span>

                <span className="mt-1 text-xs text-slate-500">
                    Pilih satu atau beberapa gambar dari perangkat
                </span>
            </button>

            {previews.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500">
                            Preview foto baru
                        </p>

                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {files.length} foto
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {previews.map(({ file, url }, index) => (
                            <div
                                key={`${file.name}-${file.lastModified}-${index}`}
                                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                            >
                                <div className="group relative aspect-[4/3] bg-slate-100">
                                    <img
                                        src={url}
                                        alt={file.name}
                                        className="h-full w-full object-cover"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        aria-label={`Hapus ${file.name}`}
                                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-rose-600 shadow-sm transition hover:bg-rose-50"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                                <div className="p-2.5">
                                    <p className="truncate text-xs font-medium text-slate-700">
                                        {file.name}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-xs font-medium text-slate-500 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                            <ImagePlus size={22} />
                            Tambah foto
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
