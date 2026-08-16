import {
  MoreVertical,
  CloudRain,
  Thermometer,
  Wind,
  FileText,
  ChevronRight,
} from "lucide-react";

export default function SelectedRisk() {
  const regionName = "Kelurahan Cempaka Putih";
  const score = 72;
  const level = "Tinggi";
  const updatedAt = "10 menit lalu";

  const conditions = [
    { icon: CloudRain, label: "Curah Hujan", value: "82%" },
    { icon: Thermometer, label: "Suhu", value: "34°C" },
    { icon: Wind, label: "Kualitas Udara", value: "42 AQI" },
  ];

  const reports = [
    { title: "Genangan air di Jl. Percetakan Negara", time: "12 menit lalu" },
    { title: "Angin kencang dilaporkan warga", time: "48 menit lalu" },
    { title: "Kualitas udara menurun sejak siang", time: "2 jam lalu" },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-white p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-neutral-400">
            Wilayah Terpilih
          </p>
          <h3 className="text-base font-bold text-neutral-800">{regionName}</h3>
        </div>

        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100"
          aria-label="Opsi lainnya"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Score */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-start">
          <span className="text-4xl font-bold tracking-tight text-neutral-900">
            {score}
          </span>
          <span className="ml-1 text-lg font-medium text-neutral-600">
            /100
          </span>
        </div>
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500">
          Risiko {level}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        Kondisi lingkungan saat ini menunjukkan peningkatan risiko dibanding
        pola normal. Terakhir diperbarui {updatedAt}.
      </p>

      {/* Conditions */}
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-4">
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

      {/* Reports */}
      <div className="mt-6 flex flex-1 flex-col border-t border-neutral-100 pt-4">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
          <FileText className="h-3.5 w-3.5" />
          {reports.length} Laporan Mendukung
        </p>

        <div className="mt-2.5 flex flex-col divide-y divide-neutral-100">
          {reports.map((report) => (
            <div
              key={report.title}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-neutral-700">
                  {report.title}
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  {report.time}
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <button
        type="button"
        className="mt-6 flex h-9 w-full items-center justify-center rounded-lg bg-neutral-100 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
      >
        Lihat Laporan Lengkap
      </button>
    </div>
  );
}
