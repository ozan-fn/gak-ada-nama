import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'

export function MapLibre() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

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
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [106.8456, -6.2088],
      zoom: 12,
      maxBounds: [[94.5, -11.5], [141.5, 6.5]],
    })

    return () => map.current?.remove()
  }, [])

  return <div ref={mapContainer} className="w-full h-full min-h-100" />
}
