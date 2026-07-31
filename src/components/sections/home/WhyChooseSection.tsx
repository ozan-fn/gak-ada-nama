import { ChartSpline, Clock3, ShieldCheck, Users } from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Informasi Lebih Akurat",
    description: "AI memvalidasi setiap laporan sehingga informasi yang diterima lebih terpercaya dan meminimalkan laporan yang tidak valid.",
  },
  {
    icon: Clock3,
    title: "Respons Lebih Cepat",
    description: "Deteksi otomatis dan pemantauan secara real-time memungkinkan risiko lingkungan diketahui lebih awal sebelum berkembang menjadi masalah yang lebih besar.",
  },
  {
    icon: Users,
    title: "Kolaborasi Terintegrasi",
    description: "Menghubungkan masyarakat, komunitas, dan instansi pemerintah dalam satu platform pelaporan yang terintegrasi untuk penanganan yang lebih efektif.",
  },
  {
    icon: ChartSpline,
    title: "Pengambilan Keputusan",
    description: "Visualisasi data dan prediksi berbasis AI membantu menentukan prioritas penanganan berdasarkan tingkat risiko dan dampaknya.",
  },
];

export default function WhyChooseSection() {
  return (
    <section className="relative z-10 bg-white py-18 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs text-white">
              Mengapa EcoSentry
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              Monitoring Lingkungan Lebih Cepat dan Akurat
            </h2>
            <div className="mt-8 space-y-8">
              {reasons.map((reason) => {
                const Icon = reason.icon;
                return (
                  <div key={reason.title}>
                    <div className="flex items-center gap-4">
                      <Icon
                        className="h-5 w-5 shrink-0 text-gray-900"
                        strokeWidth={2.5}
                      />

                      <h3 className="text-lg font-semibold text-gray-900">
                        {reason.title}
                      </h3>
                    </div>

                    <p className="mt-1.5 ml-9 text-sm leading-relaxed text-gray-500">
                      {reason.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="h-full w-full rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    </section>
  );
}
