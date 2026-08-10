import {
  ArrowUpRight,
  BrainCircuit,
  ChartNoAxesCombined,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const advantages = [
  {
    icon: BrainCircuit,
    title: "Deteksi Lebih Cepat",
    description:
      "AI membantu mengenali kondisi dan potensi bahaya lingkungan sejak laporan pertama dibuat.",
  },
  {
    icon: ShieldCheck,
    title: "Risiko Lebih Terkendali",
    description:
      "Dapatkan peringatan berdasarkan kondisi lingkungan dan laporan komunitas di sekitar lokasi.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Keputusan Lebih Tepat",
    description:
      "Gunakan insight dan prediksi AI untuk memahami risiko sebelum menentukan tindakan.",
  },
];

export default function WhyChooseUsSection() {
  return (
    <section className="relative z-10 pt-24 pb-16 px-6 bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Left Content */}
        <div className="flex flex-col justify-between h-full">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full text-cyan-500 border border-cyan-500 px-3 py-1 text-xs font-medium shadow-xs">
              Mengapa Prita?
            </span>

            <h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight text-gray-900 md:text-5xl">
              Pahami risiko sebelum menjadi masalah.
            </h2>

            <p className="max-w-lg text-sm leading-relaxed text-gray-500">
              Gabungkan kecerdasan AI dan laporan komunitas untuk memahami
              kondisi lingkungan, mengenali risiko, dan mengambil tindakan lebih
              awal.
            </p>
          </div>

          <Button className="mt-8 px-4 py-5 w-fit" size="lg">
            Pelajari Lebih Lanjut
            <ArrowUpRight className="size-4" />
          </Button>
        </div>

        {/* Right Cards */}
        <div className="flex flex-col gap-4">
          {advantages.map((advantage) => {
            const Icon = advantage.icon;

            return (
              <div
                key={advantage.title}
                className="group flex items-center gap-5 rounded-2xl border border-gray-200 bg-linear-to-b from-cyan-50/50 to-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md md:p-4"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-cyan-500 shadow-xs transition-colors">
                  <Icon className="size-5" />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 md:text-lg">
                    {advantage.title}
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    {advantage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
