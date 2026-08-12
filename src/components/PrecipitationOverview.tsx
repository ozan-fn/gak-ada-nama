import { MoreVertical, ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  ReferenceLine,
  Cell,
} from "recharts";

const precipitationData = [
  { time: "06.00", mm: 0 },
  { time: "07.00", mm: 0 },
  { time: "08.00", mm: 1 },
  { time: "09.00", mm: 1 },
  { time: "10.00", mm: 2 },
  { time: "11.00", mm: 3 },
  { time: "12.00", mm: 4 },
  { time: "13.00", mm: 6 },
  { time: "14.00", mm: 4 },
  { time: "15.00", mm: 2.5 },
  { time: "16.00", mm: 2 },
  { time: "17.00", mm: 3 },
  { time: "18.00", mm: 2 },
  { time: "19.00", mm: 1 },
  { time: "20.00", mm: 1 },
  { time: "21.00", mm: 1 },
  { time: "22.00", mm: 1 },
];

// Selalu ambil titik data paling akhir (paling kanan) sebagai "Sekarang"
const nowPoint = precipitationData[precipitationData.length - 1];

export default function PrecipitationOverview() {
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      {/* Bagian Atas: Judul & Subjudul */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">
            Intensitas Hujan
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            Pembaruan estimasi curah hujan setiap jam
          </p>
        </div>
        {/* Tombol Opsi */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100"
          aria-label="Opsi lainnya"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Ringkasan Angka Utama */}
      <div className="mt-3">
        <p className="text-[11px] font-medium text-neutral-400">
          Total Curah Hujan
        </p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-bold text-neutral-900">12,4 mm</p>
          <span className="text-[11px] text-neutral-400">hari ini</span>
        </div>
      </div>

      {/* Grafik */}
      <div className="relative -mt-8 h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={precipitationData}
            barSize={12}
            margin={{ top: 20, right: 18, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="time"
              ticks={["08.00", "12.00", "16.00", "20.00"]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              dy={8}
            />
            <Bar dataKey="mm" radius={[3, 3, 0, 0]}>
              {precipitationData.map((entry) => (
                <Cell
                  key={entry.time}
                  fill={entry.mm === 0 ? "#e5e5e5" : "hsl(199, 89%, 48%)"}
                />
              ))}
            </Bar>
            <ReferenceLine
              x={nowPoint.time}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              label={{
                value: "Sekarang",
                position: "top",
                offset: 10,
                fill: "#ef4444",
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tombol Aksi */}
      <button
        type="button"
        className="mt-3 flex h-8 w-full items-center justify-between rounded-lg bg-neutral-100 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
      >
        <span>Lihat Rincian</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
