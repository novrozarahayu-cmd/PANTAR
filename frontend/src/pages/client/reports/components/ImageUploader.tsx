
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
    ImagePlus,
    Mic,
    Square,
    Trash2,
    UploadCloud,
    Video,
} from "lucide-react";

interface ImageUploaderProps {
    value: File[];
    onChange: (files: File[]) => void;
    error?: string;
}

interface MediaPreview {
    file: File;
    url: string;
    index: number;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_RECORDING_SECONDS = 60;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
];

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds,
    ).padStart(2, "0")}`;
}

function getRecordingMimeType() {
    const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/mp4",
    ];

    return supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
    );
}

export default function ImageUploader({
    value,
    onChange,
    error,
}: ImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const secondsRef = useRef(0);

    const [previews, setPreviews] = useState<MediaPreview[]>([]);
    const [validationError, setValidationError] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [isPreparingRecorder, setIsPreparingRecorder] = useState(false);

    useEffect(() => {
        const mediaPreviews = value.map((file, index) => ({
            file,
            index,
            url: URL.createObjectURL(file),
        }));

        setPreviews(mediaPreviews);

        return () => {
            mediaPreviews.forEach(({ url }) => URL.revokeObjectURL(url));
        };
    }, [value]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            if (recorderRef.current?.state === "recording") {
                recorderRef.current.ondataavailable = null;
                recorderRef.current.onstop = null;
                recorderRef.current.stop();
            }

            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const stopRecordingTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const stopStream = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    };

    const addFiles = (selectedFiles: File[]) => {
        setValidationError("");

        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        for (const file of selectedFiles) {
            const isAllowedType =
                IMAGE_TYPES.includes(file.type) ||
                VIDEO_TYPES.includes(file.type);

            if (!isAllowedType) {
                invalidFiles.push(`${file.name}: format tidak didukung`);
                continue;
            }

            if (file.size > MAX_FILE_SIZE) {
                invalidFiles.push(`${file.name}: ukuran melebihi 10 MB`);
                continue;
            }

            validFiles.push(file);
        }

        const remainingSlots = MAX_FILES - value.length;
        const acceptedFiles = validFiles.slice(0, remainingSlots);
        const hasExcessFiles = validFiles.length > remainingSlots;

        if (invalidFiles.length > 0 || hasExcessFiles) {
            const messages = [...invalidFiles];

            if (hasExcessFiles) {
                messages.push(`Maksimal ${MAX_FILES} lampiran per laporan.`);
            }

            setValidationError(messages.join(". "));
        }

        if (acceptedFiles.length > 0) {
            onChange([...value, ...acceptedFiles]);
        }
    };

    const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
        addFiles(Array.from(event.target.files ?? []));
        event.target.value = "";
    };

    const removeFile = (index: number) => {
        onChange(value.filter((_, fileIndex) => fileIndex !== index));
        setValidationError("");
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            setValidationError(
                "Browser Anda belum mendukung perekaman suara. Silakan gunakan browser yang lebih baru.",
            );
            return;
        }

        if (value.length >= MAX_FILES) {
            setValidationError("Maksimal 5 lampiran per laporan.");
            return;
        }

        setValidationError("");
        setIsPreparingRecorder(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            streamRef.current = stream;

            const mimeType = getRecordingMimeType();

            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            recorderRef.current = recorder;
            chunksRef.current = [];
            secondsRef.current = 0;
            setRecordingSeconds(0);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onerror = () => {
                stopRecordingTimer();
                stopStream();
                setIsRecording(false);
                setValidationError("Terjadi kesalahan saat merekam suara.");
            };

            recorder.onstop = () => {
                stopRecordingTimer();
                stopStream();
                setIsRecording(false);

                if (chunksRef.current.length === 0) {
                    setValidationError("Rekaman suara kosong. Silakan coba lagi.");
                    return;
                }

                const blob = new Blob(chunksRef.current, {
                    type: recorder.mimeType || "audio/webm",
                });

                chunksRef.current = [];

                if (blob.size > MAX_FILE_SIZE) {
                    setValidationError(
                        "Ukuran rekaman melebihi 10 MB. Silakan rekam lebih singkat.",
                    );
                    return;
                }

                if (value.length >= MAX_FILES) {
                    setValidationError("Maksimal 5 lampiran per laporan.");
                    return;
                }

                const extension = blob.type.includes("ogg")
                    ? "ogg"
                    : blob.type.includes("mp4")
                        ? "m4a"
                        : "webm";

                const audioFile = new File(
                    [blob],
                    `rekaman-suara-${Date.now()}.${extension}`,
                    {
                        type: blob.type,
                        lastModified: Date.now(),
                    },
                );

                onChange([...value, audioFile]);
            };

            recorder.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                secondsRef.current += 1;
                setRecordingSeconds(secondsRef.current);

                if (secondsRef.current >= MAX_RECORDING_SECONDS) {
                    recorderRef.current?.stop();
                }
            }, 1000);
        } catch {
            stopStream();
            setValidationError(
                "Mikrofon tidak dapat diakses. Periksa izin mikrofon pada browser Anda.",
            );
        } finally {
            setIsPreparingRecorder(false);
        }
    };

    const stopRecording = () => {
        stopRecordingTimer();

        if (recorderRef.current?.state === "recording") {
            recorderRef.current.stop();
        }
    };

    const remainingSlots = MAX_FILES - value.length;

    return (
        <div>
            <div className="mb-3 flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-800">
                    Bukti kerusakan <span className="text-red-500">*</span>
                </label>

                <span className="text-xs text-slate-500">
                    {value.length}/{MAX_FILES} lampiran
                </span>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
                multiple
                onChange={handleFiles}
                className="hidden"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {previews.map(({ file, url, index }) => {
                    const isImage = file.type.startsWith("image/");
                    const isVideo = file.type.startsWith("video/");
                    const isAudio = file.type.startsWith("audio/");

                    return (
                        <div
                            key={`${file.name}-${file.lastModified}-${index}`}
                            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                        >
                            {isImage && (
                                <img
                                    src={url}
                                    alt={`Foto kerusakan ${index + 1}`}
                                    className="aspect-video w-full bg-slate-50 object-contain"
                                />
                            )}

                            {isVideo && (
                                <video
                                    src={url}
                                    controls
                                    preload="metadata"
                                    className="aspect-video w-full bg-slate-950 object-contain"
                                >
                                    Browser Anda tidak mendukung pemutaran video.
                                </video>
                            )}

                            {isAudio && (
                                <div className="flex min-h-32 flex-col justify-center gap-3 bg-emerald-50/60 p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                            <Mic size={20} />
                                        </span>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800">
                                                Rekaman suara
                                            </p>
                                            <p className="truncate text-xs text-slate-500">
                                                {file.name}
                                            </p>
                                        </div>
                                    </div>

                                    <audio
                                        src={url}
                                        controls
                                        preload="metadata"
                                        className="w-full"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-2 p-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    {isImage ? (
                                        <ImagePlus
                                            size={16}
                                            className="shrink-0 text-emerald-600"
                                        />
                                    ) : isVideo ? (
                                        <Video
                                            size={16}
                                            className="shrink-0 text-emerald-600"
                                        />
                                    ) : (
                                        <Mic
                                            size={16}
                                            className="shrink-0 text-emerald-600"
                                        />
                                    )}

                                    <span className="truncate text-xs text-slate-600">
                                        {file.name}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    aria-label={`Hapus lampiran ${file.name}`}
                                    onClick={() => removeFile(index)}
                                    className="shrink-0 rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {remainingSlots > 0 && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-4 text-center transition hover:border-emerald-500 hover:bg-emerald-50"
                    >
                        <UploadCloud
                            className="mb-2 text-emerald-600"
                            size={25}
                        />

                        <span className="text-sm font-semibold text-emerald-700">
                            Tambah foto atau video
                        </span>

                        <span className="mt-1 text-xs text-slate-500">
                            JPG, PNG, WebP, MP4, WebM
                        </span>
                    </button>
                )}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Mic size={20} />
                    </span>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-800">
                            Rekam suara
                        </h3>

                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                            Tambahkan penjelasan melalui suara langsung dari mikrofon.
                            Durasi maksimal 60 detik.
                        </p>

                        {isRecording && (
                            <p
                                aria-live="polite"
                                className="mt-3 text-sm font-semibold tabular-nums text-red-600"
                            >
                                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                Merekam {formatDuration(recordingSeconds)} / 01:00
                            </p>
                        )}

                        <div className="mt-3">
                            {isRecording ? (
                                <button
                                    type="button"
                                    onClick={stopRecording}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                                >
                                    <Square size={15} />
                                    Berhenti merekam
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    disabled={
                                        isPreparingRecorder ||
                                        remainingSlots <= 0
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Mic size={16} />
                                    {isPreparingRecorder
                                        ? "Menyiapkan mikrofon..."
                                        : "Mulai merekam"}
                                </button>
                            )}
                        </div>

                        {remainingSlots <= 0 && !isRecording && (
                            <p className="mt-2 text-xs text-amber-700">
                                Hapus salah satu lampiran untuk merekam suara.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {(validationError || error) && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {validationError || error}
                </p>
            )}

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Maksimal 5 lampiran gabungan, masing-masing 10 MB. Rekaman suara
                akan masuk ke daftar lampiran yang sama dan ikut dikirim melalui
                field <code>images</code>.
            </p>
        </div>
    );
}
