import type { ReactNode } from "react";
import { m, useReducedMotion } from "framer-motion";

type RevealProps = {
    children: ReactNode;
    delay?: number;
    y?: number;
    className?: string;
};

/**
 * Fade + naik tipis saat masuk viewport. Hanya opacity & transform (murah di GPU),
 * jalan sekali, dan mati otomatis kalau user memilih "reduce motion".
 */
export default function Reveal({
    children,
    delay = 0,
    y = 16,
    className,
}: RevealProps) {
    const reduce = useReducedMotion();

    return (
        <m.div
            className={className}
            initial={reduce ? false : { opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </m.div>
    );
}
