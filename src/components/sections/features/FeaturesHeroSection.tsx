import { motion } from 'framer-motion'

export default function FeaturesHeroSection() {
  return (
    <section className="py-14 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl"
        >
          <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs text-white">
            Fitur Lengkap
          </span>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-950 md:text-5xl">
            Satu alur, dari deteksi hingga prediksi
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Empat modul inti bekerja berurutan sebagai satu pipeline, didukung tools
            tambahan untuk pelaporan dan analisis.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
