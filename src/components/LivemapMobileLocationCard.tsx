import {
  Thermometer,
  Wind,
  Droplets,
  MapPin,
  AlertTriangle,
} from 'lucide-react'

interface MonitoringPoint {
  id: number
  name: string
  coords: [number, number]
  aqi: number
  aqiStatus: string
  aqiColor: string
  temp: number
  humidity: number
  wind: number
  issues: number
}

interface MobileLocationCardProps {
  point: MonitoringPoint
  colorHex: Record<string, string>
  monitoringPoints: MonitoringPoint[]
  selectedId: number
  onSelectPoint: (point: MonitoringPoint) => void
  getAqiColorClass: (color: string) => string
}

export function MobileLocationCard({
  point,
  colorHex,
  monitoringPoints,
  selectedId,
  onSelectPoint,
  getAqiColorClass,
}: MobileLocationCardProps) {
  return (
    <div className="px-4 py-3 lg:hidden">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: colorHex[point.aqiColor] }}
            />
            <div>
              <div className="text-sm font-semibold text-gray-900">{point.name}</div>
              <div className="text-[10px] text-gray-500">AQI {point.aqi}</div>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${getAqiColorClass(point.aqiColor)}`}
          >
            {point.aqiStatus}
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-1 text-gray-400">
              <Thermometer className="h-3 w-3" />
              <span className="text-[10px]">Suhu</span>
            </div>
            <div className="mt-1 flex items-baseline gap-0.5">
              <span className="text-base font-semibold tabular-nums text-gray-900">
                {point.temp}
              </span>
              <span className="text-[10px] text-gray-500">°C</span>
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-1 text-gray-400">
              <Droplets className="h-3 w-3" />
              <span className="text-[10px]">Lembab</span>
            </div>
            <div className="mt-1 flex items-baseline gap-0.5">
              <span className="text-base font-semibold tabular-nums text-gray-900">
                {point.humidity}
              </span>
              <span className="text-[10px] text-gray-500">%</span>
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-1 text-gray-400">
              <Wind className="h-3 w-3" />
              <span className="text-[10px]">Angin</span>
            </div>
            <div className="mt-1 flex items-baseline gap-0.5">
              <span className="text-base font-semibold tabular-nums text-gray-900">
                {point.wind}
              </span>
              <span className="text-[10px] text-gray-500">km/h</span>
            </div>
          </div>
        </div>

        {point.issues > 0 ? (
          <div className="px-4 py-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-600" />
              <span className="text-[10px] text-orange-700">
                {point.issues} laporan masalah
              </span>
            </div>
          </div>
        ) : (
          <div className="px-4 py-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className="text-[10px] text-emerald-700">Tidak ada laporan</span>
            </div>
          </div>
        )}

        {/* Location quick switcher */}
        <div className="flex gap-1.5 overflow-x-auto border-t border-gray-100 px-3 py-2.5">
          {monitoringPoints.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPoint(p)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors ${
                p.id === selectedId
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.name.split(' ')[1] || p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
