import { motion } from 'framer-motion'
import {
  Thermometer,
  Droplets,
  MapPin,
  Clock,
  TrendingDown,
  Wind,
} from 'lucide-react'

const stats = [
  { label: 'Lokasi Terpantau', value: '1.200+' },
  { label: 'Data Real-time', value: '24/7' },
  { label: 'Kota Terhubung', value: '38' },
]

const aqiTrend = [38, 41, 39, 44, 46, 43, 40, 42, 45, 41, 43, 42]

const pollutants = [
  { label: 'PM2.5', value: 18, unit: 'µg/m³', pct: 36 },
  { label: 'PM10', value: 32, unit: 'µg/m³', pct: 48 },
  { label: 'O₃', value: 54, unit: 'µg/m³', pct: 54 },
]

function Sparkline({ data }: { data: number[] }) {
  const w = 96
  const h = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-label="AQI trend chart">
      <title>AQI Trend</title>
      <polyline
        points={points}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-600"
      />
    </svg>
  )
}

export default function AboutSection() {
  return (
    <section className="relative z-10 bg-white py-18 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs text-white">
              Tentang Kami
            </span>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              Membangun Masa Depan Monitoring Lingkungan dengan AI
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Prita hadir untuk membantu masyarakat dan pemerintah memantau kondisi
              lingkungan melalui kecerdasan buatan. Dengan analisis otomatis,
              visualisasi interaktif, dan kolaborasi komunitas, kami ingin menciptakan
              pengambilan keputusan yang lebih cepat dan berbasis data.
            </p>

            {/* Stat strip */}
            <div className="mt-8 grid grid-cols-3 divide-x divide-gray-300 rounded-lg border border-gray-300 bg-gray-50">
              {stats.map((stat) => (
                <div key={stat.label} className="p-4 first:pl-4 not-first:pl-4">
                  <div className="text-xl font-semibold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — live monitoring panel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="rounded-lg border border-gray-300 bg-white">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-300 p-4">
                <div className="flex items-center gap-2">
                  <Wind className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-900">
                    Stasiun Jakarta Pusat
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>

              {/* Primary metric — AQI hero */}
              <div className="border-b border-gray-300 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500">Kualitas Udara</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-semibold tracking-tight text-gray-900">
                        42
                      </span>
                      <span className="text-xs text-gray-500">AQI</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Baik
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Sparkline data={aqiTrend} />
                    <span className="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-400">
                      <TrendingDown className="h-3 w-3" />
                      12 jam terakhir
                    </span>
                  </div>
                </div>
              </div>

              {/* Pollutant breakdown */}
              <div className="border-b border-gray-300 p-5">
                <span className="text-xs font-medium text-gray-500">
                  Rincian Polutan
                </span>
                <div className="mt-3 space-y-2.5">
                  {pollutants.map((p) => (
                    <div key={p.label} className="flex items-center gap-3">
                      <span className="w-12 text-xs text-gray-500">{p.label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gray-900"
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                      <span className="w-20 text-right text-xs text-gray-900">
                        {p.value}
                        <span className="ml-1 text-gray-400">{p.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary metrics */}
              <div className="grid grid-cols-2 divide-x divide-gray-300 border-b border-gray-300">
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Thermometer className="h-3.5 w-3.5" />
                    <span className="text-xs text-gray-500">Suhu</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-gray-900">28.4</span>
                    <span className="text-xs text-gray-500">°C</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Droplets className="h-3.5 w-3.5" />
                    <span className="text-xs text-gray-500">Kelembaban</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-gray-900">71</span>
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4">
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <MapPin className="h-3 w-3" />
                  -6.1751° S, 106.8650° E
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <Clock className="h-3 w-3" />
                  Update 5 menit lalu
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
