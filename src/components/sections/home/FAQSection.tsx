import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Bagaimana cara EcoSentry mendeteksi masalah lingkungan?",
    answer: "EcoSentry menggunakan AI untuk menganalisis foto yang diunggah pengguna dan secara otomatis mengenali berbagai jenis masalah lingkungan seperti sampah, drainase tersumbat, banjir, dan polusi.",
  },
  {
    question: "Apakah laporan saya akan diverifikasi?",
    answer: "Ya, setiap laporan akan divalidasi oleh sistem AI kami yang menggabungkan laporan serupa dan menghitung tingkat kepercayaan untuk memastikan informasi yang akurat.",
  },
  {
    question: "Bagaimana sistem peringatan risiko bekerja?",
    answer: "Sistem kami mengubah data lingkungan menjadi peta risiko dinamis yang memberikan peringatan dini berdasarkan kondisi lingkungan di sekitar Anda secara real-time.",
  },
  {
    question: "Siapa yang dapat menggunakan EcoSentry?",
    answer: "EcoSentry dapat digunakan oleh masyarakat umum, komunitas peduli lingkungan, dan instansi pemerintah yang ingin memantau dan menangani masalah lingkungan secara lebih efektif.",
  },
  {
    question: "Apakah data saya aman?",
    answer: "Ya, kami menggunakan enkripsi dan standar keamanan tinggi untuk melindungi semua data pengguna dan laporan yang diunggah ke platform kami.",
  },
  {
    question: "Apakah EcoSentry tersedia secara gratis?",
    answer: "Fitur dasar EcoSentry tersedia secara gratis untuk masyarakat. Untuk fitur lanjutan dan akses institusi, tersedia paket berlangganan dengan harga terjangkau.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative z-10 bg-gray-100 py-18 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          {/* Left Content */}
          <div className="lg:w-100 lg:shrink-0">
            <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs text-white">
              Pertanyaan Umum
            </span>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-gray-900 md:text-4xl">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Tidak menemukan jawaban yang Anda cari?{" "}
              <a
                href="/contact"
                className="font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600"
              >
                Hubungi kami
              </a>{" "}
              dan kami akan senang membantu!
            </p>
          </div>

          {/* Right FAQ Items */}
          <div className="flex-1 border-gray-300">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.question}
                  className={`border-b border-gray-300 transition-colors ${
                    isOpen ? "bg-gray-50" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-start justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:bg-gray-50"
                  >
                    <span
                      className={`flex-1 text-base font-medium transition-colors ${
                        isOpen ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center"
                    >
                      <Plus
                        className={`h-5 w-5 transition-colors ${
                          isOpen ? "text-gray-900" : "text-gray-400"
                        }`}
                        strokeWidth={2}
                      />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5">
                          <p className="max-w-xl text-sm leading-relaxed text-gray-500">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
