import { Button } from "@/components/ui/button";
import landingImage from "@/assets/images/landingpage-background.jpg";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <main className="relative h-screen bg-cover bg-center bg-no-repeat -mt-14" style={{ backgroundImage: `url(${landingImage})` }}>
      {/* Overlay gelap dari atas ke bawah */}
      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/25 to-transparent" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center text-white">
          <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight md:text-4xl xl:text-5xl">Lihat Lingkungan. Prediksi Risiko. Lindungi Komunitas.</h1>

          <p className="mt-4 max-w-2xl text-sm md:text-lg text-white">Deteksi bahaya lingkungan menggunakan AI, validasi laporan komunitas, dan terima peringatan risiko secara real-time sebelum menjadi bencana.</p>

          <div className="mt-6 flex gap-3 flex-row">
            <Button size="lg">Laporkan Sekarang</Button>

            <Button variant="outline" size="lg">
              Jelajahi Peta
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
