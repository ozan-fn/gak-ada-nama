import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Thermometer,
  Wind,
  Droplets,
  MapPin,
  AlertTriangle,
  ChevronDown,
  Plus,
  Minus,
} from 'lucide-react'

export const Route = createFileRoute('/_public/livemap')({
  component: LiveMapPage,
})

// Data monitoring lokasi
const monitoringPoints = [
  {
    id: 1,
    name: 'Jakarta Pusat',
    coords: [106.8456, -6.2088] as [number, number],
    aqi: 42,
    aqiStatus: 'Baik',
    aqiColor: 'emerald',
    temp: 28.4,
    humidity: 71,
    wind: 12,
    issues: 0,
  },
  {
    id: 2,
    name: 'Jakarta Selatan',
    coords: [106.8294, -6.2615] as [number, number],
    aqi: 58,
    aqiStatus: 'Sedang',
    aqiColor: 'yellow',
    temp: 29.1,
    humidity: 68,
    wind: 10,
    issues: 2,
  },
  {
    id: 3,
    name: 'Jakarta Timur',
    coords: [106.8650, -6.2251] as [number, number],
    aqi: 75,
    aqiStatus: 'Tidak Sehat',
    aqiColor: 'orange',
    temp: 30.2,
    humidity: 65,
    wind: 8,
    issues: 5,
  },
  {
    id: 4,
    name: 'Jakarta Utara',
    coords: [106.8405, -6.1380] as [number, number],
    aqi: 38,
    aqiStatus: 'Baik',
    aqiColor: 'emerald',
    temp: 27.8,
    humidity: 75,
    wind: 15,
    issues: 1,
  },
  {
    id: 5,
    name: 'Tangerang',
    coords: [106.6290, -6.1781] as [number, number],
    aqi: 65,
    aqiStatus: 'Sedang',
    aqiColor: 'yellow',
    temp: 29.5,
    humidity: 70,
    wind: 11,
    issues: 3,
  },
]

const colorHex: Record<string, string> = {
  emerald: '#10b981',
  yellow: '#eab308',
  orange: '#f97316',
}

function LiveMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [selectedId, setSelectedId] = useState<number>(monitoringPoints[0].id)

  const selectPoint = (point: typeof monitoringPoints[0]) => {
    setSelectedId(point.id)
    map.current?.easeTo({ center: point.coords, duration: 500 })
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: monitoringPoints[0].coords,
      zoom: 11,
      maxBounds: [
        [106.4, -6.5],
        [107.2, -5.9],
      ],
      attributionControl: false,
    })

    monitoringPoints.forEach((point) => {
      const markerColor = colorHex[point.aqiColor]
      const el = document.createElement('div')
      el.className = 'relative cursor-pointer'
      el.innerHTML = `
        <div class="relative flex h-10 w-10 items-center justify-center">
          <div class="absolute h-10 w-10 animate-ping rounded-full opacity-25" style="background-color: ${markerColor}"></div>
          <div class="relative h-8 w-8 rounded-full border-2 border-white shadow-lg" style="background-color: ${markerColor}">
            <div class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
              ${point.aqi}
            </div>
          </div>
        </div>
      `
      const marker = new maplibregl.Marker({ element: el }).setLngLat(point.coords).addTo(map.current!)
      el.addEventListener('click', () => selectPoint(point))
      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.current?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getAqiColorClass = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700'
      case 'yellow':
        return 'bg-yellow-50 text-yellow-700'
      case 'orange':
        return 'bg-orange-50 text-orange-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100">
      {/* Map area — no longer full bleed, shares the screen with the sidebar */}
      <div className="relative flex-1">
        <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

        {/* Top-left: info pill */}
        <div className="absolute left-4 right-4 top-4 z-20 flex items-start justify-between gap-3 sm:right-auto">
          <div className="hidden items-center gap-4 rounded-full bg-white px-4 py-2.5 shadow-md sm:flex">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Baik
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="h-2 w-2 rounded-full bg-yellow-500" /> Sedang
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> Tidak sehat
            </div>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-6 right-4 z-20 flex flex-col overflow-hidden rounded-2xl bg-white shadow-md">
          <button
            type="button"
            onClick={() => map.current?.zoomIn({ duration: 300 })}
            className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="h-px bg-gray-200" />
          <button
            type="button"
            onClick={() => map.current?.zoomOut({ duration: 300 })}
            className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Static right sidebar — always visible, full detail per region */}
      <aside className="flex w-full max-w-sm shrink-0 flex-col border-l border-gray-200 bg-white">
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
                  onClick={() => selectPoint(point)}
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
      </aside>
    </div>
  )
}
