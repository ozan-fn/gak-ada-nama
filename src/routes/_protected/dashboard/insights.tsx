import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import InsightsHeader from "#/components/InsightsHeader";
import InsightsOverviewCards from "#/components/InsightsOverviewCards";
import InsightsFilterBar from "#/components/InsightsFilterBar";
import RegionalRankingCard from "#/components/RegionalRankingCard";
import FeaturedInsightCard from "#/components/FeaturedInsightCard";
import InsightsPriorityTable from "#/components/InsightsPriorityTable";
import InsightsLatestCards from "#/components/InsightsLatestCards";

export const Route = createFileRoute("/_protected/dashboard/insights")({
  component: RouteComponent,
});

type Insight = {
  id: number;
  title: string;
  location: string;
  province: string;
  impact: "Tinggi" | "Sedang" | "Rendah";
  reports: number;
  validated: number;
  score: number;
  trend: "up" | "down" | "stable";
  summary: string;
  time: string;
};

const insights: Insight[] = [
  {
    id: 1,
    title: "Risiko genangan meningkat di Purwokerto Barat",
    location: "Purwokerto Barat",
    province: "Jawa Tengah",
    impact: "Tinggi",
    reports: 12,
    validated: 8,
    score: 92,
    trend: "up",
    summary:
      "Kombinasi laporan masyarakat, kondisi hujan, dan hambatan pada saluran drainase menunjukkan adanya peningkatan potensi genangan di beberapa titik.",
    time: "2 jam lalu",
  },
  {
    id: 2,
    title: "Kualitas udara menunjukkan peningkatan polutan",
    location: "Purwokerto Timur",
    province: "Jawa Tengah",
    impact: "Sedang",
    reports: 8,
    validated: 5,
    score: 76,
    trend: "up",
    summary:
      "Beberapa laporan mengenai asap dan perubahan kualitas udara ditemukan pada area yang berdekatan dengan peningkatan konsentrasi polutan.",
    time: "5 jam lalu",
  },
  {
    id: 3,
    title: "Potensi kebakaran lahan meningkat",
    location: "Banyumas Selatan",
    province: "Jawa Tengah",
    impact: "Sedang",
    reports: 6,
    validated: 4,
    score: 68,
    trend: "stable",
    summary:
      "Laporan mengenai titik asap dan kondisi lahan kering menunjukkan adanya potensi peningkatan risiko kebakaran pada wilayah tersebut.",
    time: "8 jam lalu",
  },
  {
    id: 4,
    title: "Peningkatan laporan sampah di saluran drainase",
    location: "Semarang",
    province: "Jawa Tengah",
    impact: "Tinggi",
    reports: 21,
    validated: 15,
    score: 88,
    trend: "up",
    summary:
      "Peningkatan laporan sampah pada saluran drainase ditemukan bersamaan dengan curah hujan yang lebih tinggi dari periode sebelumnya.",
    time: "10 jam lalu",
  },
  {
    id: 5,
    title: "Aktivitas lingkungan relatif stabil",
    location: "Surakarta",
    province: "Jawa Tengah",
    impact: "Rendah",
    reports: 4,
    validated: 3,
    score: 42,
    trend: "down",
    summary:
      "Jumlah laporan lingkungan di wilayah ini mengalami penurunan dibandingkan periode sebelumnya dengan kondisi lingkungan yang relatif stabil.",
    time: "12 jam lalu",
  },
];

const regionalRanking = [
  {
    rank: 1,
    location: "Jakarta",
    score: 92,
    reports: 184,
    trend: "up" as const,
  },
  {
    rank: 2,
    location: "Jawa Barat",
    score: 87,
    reports: 156,
    trend: "up" as const,
  },
  {
    rank: 3,
    location: "Jawa Tengah",
    score: 81,
    reports: 143,
    trend: "up" as const,
  },
  {
    rank: 4,
    location: "Jawa Timur",
    score: 76,
    reports: 128,
    trend: "stable" as const,
  },
  {
    rank: 5,
    location: "Banten",
    score: 71,
    reports: 112,
    trend: "down" as const,
  },
];

function RouteComponent() {
  const [scope, setScope] = useState<"Indonesia" | "Sekitar Anda">("Indonesia");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      const matchesFilter =
        activeFilter === "Semua" || insight.impact === activeFilter;

      const matchesSearch =
        insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.province.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesScope =
        scope === "Indonesia" || insight.province === "Jawa Tengah";

      return matchesFilter && matchesSearch && matchesScope;
    });
  }, [activeFilter, searchQuery, scope]);

  const featuredInsight = filteredInsights[0];

  return (
    <main className="min-h-full bg-neutral-50/50 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 md:px-6 lg:px-8">
        <section className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Insights
          </h1>

          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Analisis kondisi lingkungan berdasarkan laporan masyarakat dan data
            lingkungan.
          </p>
        </section>

        <InsightsHeader scope={scope} setScope={setScope} />

        <InsightsOverviewCards scope={scope} />

        <InsightsFilterBar
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {scope === "Indonesia" && <RegionalRankingCard data={regionalRanking} />}

        {featuredInsight && <FeaturedInsightCard insight={featuredInsight} />}

        <InsightsPriorityTable insights={filteredInsights} />

        <InsightsLatestCards insights={filteredInsights} />
      </div>
    </main>
  );
}
