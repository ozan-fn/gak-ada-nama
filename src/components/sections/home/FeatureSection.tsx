import { ScanEye, Users, Radar, TrendingUp } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const features = [
  { icon: ScanEye, subtitle: "Deteksi Lingkungan Otomatis", description: "Analisis foto menggunakan AI untuk mengenali sampah, drainase tersumbat, banjir, polusi, dan potensi bahaya lingkungan lainnya." },
  { icon: Users, subtitle: "Laporan Lebih Terpercaya", description: "AI memvalidasi laporan komunitas, menggabungkan laporan serupa, dan menghitung tingkat kepercayaan agar informasi yang muncul tetap akurat." },
  { icon: Radar, subtitle: "Peringatan Risiko Real-Time", description: "Mengubah data lingkungan menjadi peta risiko dinamis yang membantu masyarakat menghindari area berbahaya sebelum dampaknya meluas." },
  { icon: TrendingUp, subtitle: "Prediksi Dampak Masa Depan", description: "Mensimulasikan konsekuensi apabila suatu masalah lingkungan tidak ditangani serta menunjukkan manfaat jika tindakan dilakukan lebih awal." },
];

export default function FeatureSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 30%"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [120, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.section
      ref={ref}
      style={{ y }}
      className="relative z-10 bg-gray-100 py-12 md:py-14"
    >
      <motion.div style={{ opacity: contentOpacity }} className="mx-auto max-w-6xl w-full px-6">
        <div className="mb-12 max-w-2xl">
          <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs text-white">
            Cara Kerja
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Empat Modul AI, Satu Tujuan
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-500">
            EcoSentry menghubungkan empat modul AI yang bekerja secara berkesinambungan
            untuk mendeteksi, memvalidasi, memprediksi, dan mensimulasikan risiko
            lingkungan secara real-time.
          </p>
        </div>
        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-300 bg-white md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isRight = index % 2 === 1;
            const isXlLast = index === 3;
            return (
              <div
                key={feature.subtitle}
                className={`flex flex-col border-gray-300 p-6 transition-colors hover:bg-gray-50
                  ${index < 3 ? "border-b" : ""}
                  ${index < 2 ? "md:border-b" : "md:border-b-0"}
                  xl:border-b-0
                  ${!isRight ? "md:border-r" : ""}
                  ${!isXlLast ? "xl:border-r" : ""}
                `}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Icon className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
                </div>
                <p className="mb-4 text-lg font-medium leading-snug text-gray-900 md:min-h-12">
                  {feature.subtitle}
                </p>
                <p className="text-sm leading-relaxed text-gray-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.section>
  );
}
