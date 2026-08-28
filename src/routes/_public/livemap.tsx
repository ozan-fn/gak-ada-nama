import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Plus, Minus } from 'lucide-react'
import { MobileLocationCard } from '#/components/LivemapMobileLocationCard'
import { DesktopSidebar } from '#/components/LivemapDesktopSidebar'
import {
  monitoringPoints,
  colorHex,
  getAqiColorClass,
  type MonitoringPoint,
} from '#/types/livemap'

export const Route = createFileRoute('/_public/livemap')({
  component: LiveMapPage,
})

function LiveMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [selectedId, setSelectedId] = useState<number>(monitoringPoints[0].id)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const selectPoint = (point: MonitoringPoint) => {
      setSelectedId(point.id)
      map.current?.easeTo({ center: point.coords, duration: 500 })
    }

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
      markersRef.current.forEach((marker) => {
        marker.remove()
      })
      markersRef.current = []
      map.current?.remove()
    }
  }, [])

  const selectPoint = (point: MonitoringPoint) => {
    setSelectedId(point.id)
    map.current?.easeTo({ center: point.coords, duration: 500 })
  }

  const selectedPoint = monitoringPoints.find((p) => p.id === selectedId)!

  return (
    <div className="flex h-screen w-full flex-col bg-gray-100 lg:flex-row lg:overflow-hidden">
      {/* Map area */}
      <div className="relative flex-1 lg:h-full">
        <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

        {/* Top-left: info pill */}
        <div className="absolute left-2 right-2 top-2 z-20 flex items-start justify-between gap-3 sm:left-4 sm:right-auto sm:top-4">
          <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 shadow-md sm:gap-4 sm:px-4 sm:py-2.5 md:flex">
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
        <div className="absolute bottom-4 right-2 z-20 flex flex-col overflow-hidden rounded-2xl bg-white shadow-md sm:right-4 lg:bottom-6">
          <button
            type="button"
            onClick={() => map.current?.zoomIn({ duration: 300 })}
            className="flex h-9 w-9 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 sm:h-10 sm:w-10"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="h-px bg-gray-200" />
          <button
            type="button"
            onClick={() => map.current?.zoomOut({ duration: 300 })}
            className="flex h-9 w-9 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 sm:h-10 sm:w-10"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom sheet on mobile, sidebar on desktop */}
      <aside className="flex h-auto w-full shrink-0 flex-col border-t border-gray-200 bg-white lg:h-full lg:max-w-sm lg:border-l lg:border-t-0">
        {/* Mobile view */}
        <MobileLocationCard
          point={selectedPoint}
          colorHex={colorHex}
          monitoringPoints={monitoringPoints}
          selectedId={selectedId}
          onSelectPoint={selectPoint}
          getAqiColorClass={getAqiColorClass}
        />

        {/* Desktop view */}
        <DesktopSidebar
          monitoringPoints={monitoringPoints}
          selectedId={selectedId}
          colorHex={colorHex}
          onSelectPoint={selectPoint}
          getAqiColorClass={getAqiColorClass}
        />
      </aside>
    </div>
  )
}
