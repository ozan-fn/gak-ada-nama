import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="relative py-16 px-6 bg-background md:py-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden bg-white shadow-sm rounded-4xl min-h-100 flex items-center justify-center">
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(34,211,238,0.18),transparent_45%)]" />

        {/* Blue orb */}
        <div className="absolute -bottom-52 left-1/3 h-125 w-145 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-52 right-1/3 h-125 w-145 translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />

        {/* Main content */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-12 text-center">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 md:text-3xl lg:text-4xl">
            Dari Satu Temuan Menjadi Peringatan untuk Satu Lingkungan
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
            Bagikan kondisi yang kamu temukan di sekitar. Setiap laporan membantu orang
            lain mengetahui apa yang sedang terjadi dan lebih siap mengambil tindakan.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="px-6 font-semibold shadow-sm"
            >
              Laporkan Kondisi
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="bg-white px-6 font-semibold shadow-sm"
            >
              Jelajahi Peta Risiko
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
