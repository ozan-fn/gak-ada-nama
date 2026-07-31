import { Button } from "@/components/ui/button";
import landingImage from "@/assets/images/landingpage-background.jpg";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="sticky top-0 h-screen -mt-14 overflow-hidden z-0">
      <main
        style={{ backgroundImage: `url(${landingImage})` }}
        className="relative h-full w-full bg-cover bg-center bg-no-repeat"
      >
        <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/25 to-transparent" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center text-white">
            <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight md:text-4xl xl:text-5xl">
              Lihat Lingkungan. Prediksi Risiko. Lindungi Komunitas.
            </h1>
            <p className="mt-4 max-w-2xl text-sm md:text-lg text-white">
              Deteksi bahaya lingkungan menggunakan AI, validasi laporan komunitas, dan terima peringatan risiko secara real-time sebelum menjadi bencana.
            </p>
            <div className="mt-6 flex flex-row gap-3">
              <Button size="lg">Laporkan Sekarang</Button>
              <Button variant="outline" size="lg">
                Jelajahi Peta
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
