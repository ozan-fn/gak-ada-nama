import { Header } from "#/components/Header";
import HeroSection from "#/components/sections/home/HeroSection";
import FeatureSection from "#/components/sections/home/FeatureSection";
import { createFileRoute } from "@tanstack/react-router";
import AdvantageSection from "#/components/sections/home/AdventageSection";
import WhyChooseSection from "#/components/sections/home/WhyChooseSection";
import FAQSection from "#/components/sections/home/FAQSection";
import ShowcaseSection from "#/components/sections/home/ShowcaseSection";
import { StickyFooter } from "#/components/Footer";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="relative">
      <Header />
      <HeroSection />
      <FeatureSection />
      <AdvantageSection />
      <ShowcaseSection />
      <WhyChooseSection />
      <FAQSection />
      <StickyFooter />
    </div>
  );
}
