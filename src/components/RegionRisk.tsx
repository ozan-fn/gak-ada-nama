import { CloudRain, Thermometer, Wind, MoreVertical, ArrowRight } from "lucide-react";

export default function RegionRisk() {
  const score = 72;
  const level = "Tinggi";
  const reportCount = 3;

  const conditions = [
    { icon: CloudRain, label: "Curah Hujan", value: "82%" },
    { icon: Thermometer, label: "Suhu", value: "34°C" },
    { icon: Wind, label: "Kualitas Udara", value: "42 AQI" },
  ];

  return (
    <div className="flex h-full w-full flex-col justify-between bg-white p-6">
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          {/* Score Detail */}
          <div className="flex items-start">
            <span className="text-4xl font-bold tracking-tight text-neutral-900">
              {score}
            </span>
            <span className="ml-1 text-lg font-medium text-neutral-600">
              /100
            </span>
          </div>

          {/* Risk Status */}
          <div>
            <p className="text-[11px] font-medium text-neutral-400">
              Risiko Wilayah
            </p>
            <h3 className="text-base font-bold text-red-500">
              Risiko {level}
            </h3>
          </div>
        </div>

        {/* More Button */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100"
          aria-label="Opsi lainnya"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
        Kondisi lingkungan saat ini menunjukkan peningkatan risiko dibanding pola normal.
      </p>

      {/* Conditions */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {conditions.map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </p>
            <p className="mt-1.5 text-base font-bold text-neutral-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button
        type="button"
        className="mt-6 flex h-9 w-full items-center justify-between rounded-lg bg-neutral-100 px-3.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
      >
        <span>{reportCount} laporan mendukung</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}