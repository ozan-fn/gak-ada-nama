import { motion } from 'framer-motion'
import { ScanEye, Users, Radar, TrendingUp, ArrowRight } from 'lucide-react'

const pipeline = [
  {
    index: '01',
    icon: ScanEye,
    title: 'Deteksi Lingkungan',
    description:
      'AI mengenali sampah, drainase tersumbat, banjir, dan polusi langsung dari foto yang diunggah.',
    capabilities: ['Deteksi multi-kelas', 'Klasifikasi keparahan', 'Ekstraksi lokasi'],
  },
  {
    index: '02',
    icon: Users,
    title: 'Validasi Komunitas',
    description:
      'Laporan diverifikasi otomatis, laporan serupa digabung, dan tingkat kepercayaan dihitung.',
    capabilities: ['Validasi foto & lokasi', 'Penggabungan duplikat', 'Skor kepercayaan'],
  },
  {
    index: '03',
    icon: Radar,
    title: 'Peringatan Real-Time',
    description:
      'Data diubah menjadi peta risiko dinamis agar warga bisa menghindari area berbahaya lebih awal.',
    capabilities: ['Notifikasi radius', 'Peta panas risiko', 'Alert multi-kanal'],
  },
  {
    index: '04',
    icon: TrendingUp,
    title: 'Prediksi Dampak',
    description:
      'Simulasi konsekuensi bila masalah dibiarkan, serta manfaat jika ditangani lebih cepat.',
    capabilities: ['Model time-series', 'Simulasi if-then', 'Prioritas tindakan'],
  },
]

export default function PipelineSection() {
  return (
    <section className="relative z-10 bg-gray-100 py-14 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-px overflow-hidden rounded-xl border border-gray-300 bg-white md:grid-cols-4">
          {pipeline.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
                className="group relative flex flex-col bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-gray-300">
                    {step.index}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-emerald-50">
                    <Icon className="h-5 w-5 text-gray-600 transition-colors group-hover:text-emerald-600" strokeWidth={1.5} />
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>

                <ul className="mt-2.5 space-y-2 border-t border-gray-200 pt-4">
                  {step.capabilities.map((cap) => (
                    <li key={cap} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                      {cap}
                    </li>
                  ))}
                </ul>

                {i < pipeline.length - 1 && (
                  <ArrowRight
                    className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full border border-gray-300 bg-white p-0.5 text-gray-400 md:block"
                    strokeWidth={1.5}
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
