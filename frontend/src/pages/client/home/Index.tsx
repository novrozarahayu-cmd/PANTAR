import { LazyMotion, domAnimation } from "framer-motion";
import CategoriesSection from "./CategoriesSection";
import FaqSection from "./FaqSection";
import FinalCtaSection from "./FinalCtaSection";
import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";
import ImpactSection from "./ImpactSection";
import MedanInfoSection from "./MedanInfoSection";
import NavigationFeatureSection from "./NavigationFeatureSection";

/**
 * LazyMotion + domAnimation: hanya memuat fitur animasi dasar framer-motion
 * (bundle jauh lebih kecil). Semua komponen memakai `m.*`, bukan `motion.*`.
 *
 * Catatan: Navbar & Footer ikut di sini. Kalau layout kamu sudah punya
 * keduanya, hapus dari file ini supaya tidak dobel.
 */
export default function Home() {
    return (
        <LazyMotion features={domAnimation}>
            <HeroSection />
            <CategoriesSection />
            <HowItWorksSection />
            <NavigationFeatureSection />
            <ImpactSection />
            <MedanInfoSection />
            <FaqSection />
            <FinalCtaSection />
        </LazyMotion>
    );
}
