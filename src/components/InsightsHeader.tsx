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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-fit items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {(["Indonesia", "Sekitar Anda"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setScope(item)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              scope === item
                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
                : "text-neutral-600 hover:bg-sky-50 hover:text-sky-600"
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
    </div>
  );
}
