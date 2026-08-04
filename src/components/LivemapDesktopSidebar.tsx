import { AnimatePresence, motion } from 'framer-motion'
import {
  Thermometer,
  Wind,
  Droplets,
  MapPin,
  AlertTriangle,
  ChevronDown,
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

interface DesktopSidebarProps {
  monitoringPoints: MonitoringPoint[]
  selectedId: number
  colorHex: Record<string, string>
  onSelectPoint: (point: MonitoringPoint) => void
  getAqiColorClass: (color: string) => string
}

export function DesktopSidebar({
  monitoringPoints,
  selectedId,
  colorHex,
  onSelectPoint,
  getAqiColorClass,
}: DesktopSidebarProps) {
  return (
    <div className="hidden lg:flex lg:h-full lg:flex-col">
      <div className="border-b border-gray-200 px-5 py-5">
        <h1 className="text-base font-semibold text-gray-900">Detail Wilayah</h1>
        <p className="mt-1 text-sm text-gray-500">Pilih lokasi untuk melihat data lengkap</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {monitoringPoints.map((point) => {
          const isActive = point.id === selectedId
          return (
            <div key={point.id} className="border-b border-gray-100">
              <button
                type="button"
                onClick={() => onSelectPoint(point)}
                className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
                  isActive ? 'bg-gray-50' : 'hover:bg-gray-50/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorHex[point.aqiColor] }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{point.name}</div>
                    <div className="text-xs text-gray-500">AQI {point.aqi} · {point.aqiStatus}</div>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                    isActive ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <div className="rounded-2xl border border-gray-200">
                        <div className="border-b border-gray-100 px-4 py-4">
                          <span className="text-xs text-gray-500">Kualitas Udara</span>
                          <div className="mt-1.5 flex items-baseline gap-2">
                            <span className="text-3xl font-semibold tabular-nums text-gray-900">
                              {point.aqi}
                            </span>
                            <span className="text-sm text-gray-500">AQI</span>
                            <span
                              className={`ml-auto rounded-full px-2.5 py-1 text-xs font-medium ${getAqiColorClass(point.aqiColor)}`}
                            >
                              {point.aqiStatus}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                          <div className="px-3 py-3.5">
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Thermometer className="h-3.5 w-3.5" />
                              <span className="text-xs">Suhu</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-1">
                              <span className="text-base font-semibold tabular-nums text-gray-900">
                                {point.temp}
                              </span>
                              <span className="text-xs text-gray-500">°C</span>
                            </div>
                          </div>
                          <div className="px-3 py-3.5">
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Droplets className="h-3.5 w-3.5" />
                              <span className="text-xs">Lembab</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-1">
                              <span className="text-base font-semibold tabular-nums text-gray-900">
                                {point.humidity}
                              </span>
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                          </div>
                          <div className="px-3 py-3.5">
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Wind className="h-3.5 w-3.5" />
                              <span className="text-xs">Angin</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-1">
                              <span className="text-base font-semibold tabular-nums text-gray-900">
                                {point.wind}
                              </span>
                              <span className="text-xs text-gray-500">km/h</span>
                            </div>
                          </div>
                        </div>

                        {point.issues > 0 ? (
                          <div className="px-4 py-3.5">
                            <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2.5">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-orange-600" />
                              <span className="text-xs text-orange-700">
                                {point.issues} laporan masalah lingkungan
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 py-3.5">
                            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5">
                              <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="text-xs text-emerald-700">
                                Tidak ada laporan masalah
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
