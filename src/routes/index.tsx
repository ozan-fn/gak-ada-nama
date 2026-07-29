import { Header } from "#/components/Header";
import HeroSection from "#/components/sections/home/HeroSection";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="relative">
      <Header />
      <HeroSection />
    </div>
  );
}
