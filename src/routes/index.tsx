import { Header } from "#/components/Header";
import HeroSection from "#/components/sections/home/HeroSection";
import FeatureSection from "#/components/sections/home/FeatureSection";
import { createFileRoute } from "@tanstack/react-router";
import AdvantageSection from "#/components/sections/home/AdventageSection";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="relative">
      <Header />
      <HeroSection />
      <FeatureSection />
      <AdvantageSection />
    </div>
  );
}
