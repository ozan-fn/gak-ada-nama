import { motion } from 'framer-motion'

export default function FeaturesCTASection() {
  return (
    <section className="bg-gray-100 py-14 md:py-18">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-gray-200 bg-gray-950 p-8 md:flex-row md:items-center md:p-10"
        >
          <div>
            <h3 className="text-2xl font-semibold text-white">
              Siap mencoba semua fitur ini?
            </h3>
            <p className="mt-2 max-w-md text-base text-gray-400">
              Mulai laporkan masalah lingkungan di sekitarmu dan rasakan monitoring
              berbasis AI yang lebih responsif.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 whitespace-nowrap rounded-full bg-white px-7 py-3 text-sm font-medium text-gray-950 transition-colors hover:bg-gray-100"
          >
            Mulai Sekarang
          </button>
        </motion.div>
      </div>
    </section>
  )
}
