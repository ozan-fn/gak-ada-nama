import { MapPin } from "lucide-react";

type InsightsHeaderProps = {
  scope: "Indonesia" | "Sekitar Anda";
  setScope: (scope: "Indonesia" | "Sekitar Anda") => void;
};

export default function InsightsHeader({
  scope,
  setScope,
}: InsightsHeaderProps) {
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-fit items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {(["Indonesia", "Sekitar Anda"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setScope(item)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              scope === item
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <MapPin className="size-3.5" />
        {scope === "Indonesia"
          ? "Seluruh wilayah Indonesia"
          : "Berdasarkan lokasi Anda"}
      </div>
    </section>
  );
}
