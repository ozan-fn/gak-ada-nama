export interface MonitoringPoint {
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

export const monitoringPoints: MonitoringPoint[] = [
  {
    id: 1,
    name: 'Jakarta Pusat',
    coords: [106.8456, -6.2088],
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
    coords: [106.8294, -6.2615],
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
    coords: [106.8650, -6.2251],
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
    coords: [106.8405, -6.1380],
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
    coords: [106.6290, -6.1781],
    aqi: 65,
    aqiStatus: 'Sedang',
    aqiColor: 'yellow',
    temp: 29.5,
    humidity: 70,
    wind: 11,
    issues: 3,
  },
]

export const colorHex: Record<string, string> = {
  emerald: '#10b981',
  yellow: '#eab308',
  orange: '#f97316',
}

export function getAqiColorClass(color: string): string {
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
