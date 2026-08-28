import { motion } from 'framer-motion'
import { MapPin, Bell, BarChart3, FileText, Camera, Activity } from 'lucide-react'

const additionalFeatures = [
  { icon: MapPin, label: 'Peta Interaktif', desc: 'Visualisasi data spasial real-time' },
  { icon: Bell, label: 'Notifikasi Pintar', desc: 'Alert berbasis preferensi pengguna' },
  { icon: BarChart3, label: 'Analitik Dashboard', desc: 'Insight visual untuk pengambil keputusan' },
  { icon: FileText, label: 'Laporan Otomatis', desc: 'Generate laporan PDF/Excel' },
  { icon: Camera, label: 'Upload Multi-Foto', desc: 'Batch processing hingga 10 foto' },
  { icon: Activity, label: 'API Terbuka', desc: 'Integrasi dengan sistem eksternal' },
]

export default function AdditionalFeaturesSection() {
  return (
    <section className="py-14 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-baseline justify-between"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950">
            Tools pendukung
          </h2>
          <span className="text-sm text-gray-400">
            6 tools
          </span>
        </motion.div>

        <div className="grid divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-3">
          {additionalFeatures.map((feat, i) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="flex items-start gap-3 bg-white px-5 py-5 transition-colors hover:bg-gray-50"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-emerald-50">
                  <Icon className="h-4 w-4 text-gray-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-950">{feat.label}</h4>
                  <p className="mt-0.5 text-sm leading-snug text-gray-500">{feat.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
