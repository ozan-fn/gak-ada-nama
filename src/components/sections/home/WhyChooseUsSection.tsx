import {
  ArrowUpRight,
  BrainCircuit,
  ChartNoAxesCombined,
  ShieldCheck,
} from "lucide-react";
import { Button } from "#/components/ui/button";

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
    <section className="relative z-10 bg-background px-6 pb-16 pt-26">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left Content */}
        <div className="flex h-full flex-col justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full border border-cyan-500 px-3 py-1 text-xs font-medium text-cyan-500 shadow-xs">
              Mengapa Prita?
            </span>

            <h2 className="max-w-prose text-2xl font-semibold leading-tight tracking-tight text-gray-900 md:text-3xl lg:text-4xl">
              Pahami risiko sebelum menjadi masalah.
            </h2>

            <p className="max-w-sm text-sm leading-relaxed text-gray-500 md:text-[15px]">
              Gabungkan kecerdasan AI dan laporan komunitas untuk memahami
              kondisi lingkungan, mengenali risiko, dan mengambil tindakan lebih
              awal.
            </p>
          </div>

          <Button
            size="lg"
            className="mt-6 w-fit rounded-lg border border-sky-400/30 bg-sky-500 px-3.5 py-4.5 font-semibold text-white shadow-lg shadow-sky-500/15 transition-all duration-200 hover:bg-sky-400 hover:shadow-sky-500/25"
          >
            Pelajari Lebih Lanjut
            <ArrowUpRight className="size-4" />
          </Button>
        </div>

        {/* Right Cards */}
        <div className="flex flex-col gap-2.5">
          {advantages.map((advantage) => {
            const Icon = advantage.icon;

            return (
              <div
                key={advantage.title}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-linear-to-b from-cyan-50/50 to-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md md:gap-3.5 md:p-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-cyan-500 shadow-xs md:size-10">
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-gray-900 md:text-sm">
                    {advantage.title}
                  </h3>

                  <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 md:text-xs">
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
