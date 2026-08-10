import { Button } from "@/components/ui/button";
import BackgroundSkyHero from "@/assets/images/sky-hero.jpeg";

export default function HeroSection() {
  return (
    <div className="-mt-14">
      <main
        style={{ backgroundImage: `url(${BackgroundSkyHero})` }}
        className="relative w-full bg-cover bg-center bg-no-repeat pb-96"
      >
        <div className="absolute inset-0 bg-blue-600/30" />
        <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white via-white/60 to-transparent" />

        <div className="relative z-10 min-h-screen px-6 flex flex-col justify-center">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center text-white">
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 pl-2 pr-3 py-1 text-xs md:text-sm backdrop-blur-md">
              <span className="rounded-sm bg-cyan-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                Live
              </span>
              <span className="text-white/90">
                Pemantauan Lingkungan
              </span>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Pahami Lingkungan dan Antisipasi Resikonya
              </h1>

              <p className="max-w-2xl mx-auto text-sm md:text-base text-white/80 font-normal leading-relaxed">
                Kenali kondisi lingkungan di sekitarmu, dapatkan peringatan risiko
                    berbasis AI, dan ambil tindakan sebelum masalah berkembang.
              </p>
            </div>

            <div className="mt-6 flex flex-row items-center gap-4">
              <Button size="lg" className="p-4 font-semibold">
                Lihat Demo
              </Button>
              <Button variant="secondary" size="lg" className="p-4 font-semibold">
                Jelajahi Platform
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-10 translate-y-0 left-1/2 -translate-x-1/2 z-20 w-full max-w-6xl bg-gray-500/30 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden">
          {/* Mac window controls */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>

          {/* Content area */}
          <div className="p-6 min-h-130">
            {/* Content goes here */}
          </div>
        </div>
      </main>
    </div>
  );
}
