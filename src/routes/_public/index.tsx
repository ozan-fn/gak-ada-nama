import { createFileRoute } from "@tanstack/react-router";
import CollectedDataSection from "@/components/sections/home/CollectedDataSection";
import CTASection from "@/components/sections/home/CTASection";
import FeatureSection from "@/components/sections/home/FeatureSection";
import HeroSection from "@/components/sections/home/HeroSection";
import WhyChooseUsSection from "@/components/sections/home/WhyChooseUsSection";

export const Route = createFileRoute("/_public/")({ component: Home });

function Home() {
  return (
    <>
      <HeroSection />
      <CollectedDataSection />
      <FeatureSection />
      <WhyChooseUsSection />
      <CTASection />
    </>
  );
}
