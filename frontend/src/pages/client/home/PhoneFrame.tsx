import type { ReactNode } from "react";

type PhoneFrameProps = {
    children?: ReactNode;
    /**
     * Opsional: isi dengan screenshot asli aplikasimu (mis. "/screens/lapor.png",
     * rasio ~9:19). Kalau diisi, screenshot menggantikan mockup kode.
     */
    src?: string;
    alt?: string;
    className?: string;
};

/** Bingkai ponsel minimalis. Ukuran konten dirancang untuk lebar 250px. */
export default function PhoneFrame({
    children,
    src,
    alt = "",
    className = "",
}: PhoneFrameProps) {
    return (
        <div
            className={`relative aspect-[9/19] w-[250px] shrink-0 rounded-[2.4rem] bg-[#0b1d16] p-[7px] shadow-[0_30px_60px_-20px_rgba(11,29,22,0.35)] ring-1 ring-black/10 ${className}`}
        >
            <div className="relative h-full w-full overflow-hidden rounded-[1.95rem] bg-white">
                {src ? (
                    <img
                        src={src}
                        alt={alt}
                        loading="lazy"
                        className="h-full w-full object-cover object-top"
                    />
                ) : (
                    children
                )}
                {/* poni */}
                <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-2 z-30 h-[18px] w-[64px] -translate-x-1/2 rounded-full bg-[#0b1d16]"
                />
            </div>
        </div>
    );
}
