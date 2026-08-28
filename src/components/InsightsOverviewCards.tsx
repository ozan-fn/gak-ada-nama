import {
  ArrowUp,
  FileText,
  MapPin,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

type InsightsOverviewCardsProps = {
  scope: "Indonesia" | "Sekitar Anda";
};

export default function InsightsOverviewCards({
  scope,
}: InsightsOverviewCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">Total laporan</span>
          <FileText className="size-4 text-neutral-400" />
        </div>

        <p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {scope === "Indonesia" ? "1.284" : "42"}
        </p>

        <div className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
          <ArrowUp className="size-3" />
          12% dari periode sebelumnya
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">Wilayah terdampak</span>
          <MapPin className="size-4 text-neutral-400" />
        </div>

        <p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {scope === "Indonesia" ? "342" : "12"}
        </p>

        <p className="mt-1 text-[11px] text-neutral-400">
          berdasarkan laporan tervalidasi
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">Dampak tinggi</span>
          <ShieldAlert className="size-4 text-neutral-400" />
        </div>

        <p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {scope === "Indonesia" ? "87" : "8"}
        </p>

        <p className="mt-1 text-[11px] text-neutral-400">
          isu yang perlu diperhatikan
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">Tren risiko</span>
          <TrendingUp className="size-4 text-neutral-400" />
        </div>

        <p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Meningkat
        </p>

        <p className="mt-1 text-[11px] text-neutral-400">
          dibandingkan 7 hari sebelumnya
        </p>
      </div>
    </section>
  );
}
