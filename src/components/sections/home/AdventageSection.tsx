import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function AdvantageSection() {
  return (
    <section className="relative z-10 bg-white py-18 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-medium leading-relaxed text-gray-900 md:text-3xl">
            Prita menggabungkan{" "}
            <HoverCard>
              <HoverCardTrigger>
                <span className="cursor-pointer font-medium underline decoration-gray-900 underline-offset-4 transition-colors hover:text-gray-700">
                  Deteksi Lingkungan Berbasis AI
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 border-gray-300 bg-white">
                <h4 className="font-semibold text-base text-gray-900">Deteksi Lingkungan Berbasis AI</h4>
                <p className="mt-2 text-sm text-gray-500">
                  Menganalisis foto menggunakan AI untuk mengenali sampah,
                  drainase tersumbat, banjir, polusi udara, air tercemar, hingga
                  potensi bahaya lingkungan lainnya secara otomatis.
                </p>
              </HoverCardContent>
            </HoverCard>
            ,{" "}
            <HoverCard>
              <HoverCardTrigger>
                <span className="cursor-pointer font-medium underline decoration-gray-900 underline-offset-4 transition-colors hover:text-gray-700">
                  Intelijen Komunitas
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 border-gray-300 bg-white">
                <h4 className="font-semibold text-base text-gray-900">Intelijen Komunitas</h4>
                <p className="mt-2 text-sm text-gray-500">
                  AI memvalidasi laporan warga, menggabungkan laporan serupa,
                  serta menghitung tingkat kepercayaan agar informasi yang
                  ditampilkan tetap akurat dan dapat dipercaya.
                </p>
              </HoverCardContent>
            </HoverCard>
            ,{" "}
            <HoverCard>
              <HoverCardTrigger>
                <span className="cursor-pointer font-medium underline decoration-gray-900 underline-offset-4 transition-colors hover:text-gray-700">
                  Prediksi Risiko Real-Time
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 border-gray-300 bg-white">
                <h4 className="font-semibold text-base text-gray-900">Prediksi Risiko Real-Time</h4>
                <p className="mt-2 text-sm text-gray-500">
                  Mengolah laporan yang telah diverifikasi menjadi peta risiko
                  dinamis lengkap dengan peringatan dini berdasarkan kondisi
                  lingkungan di sekitar pengguna.
                </p>
              </HoverCardContent>
            </HoverCard>
            , dan{" "}
            <HoverCard>
              <HoverCardTrigger>
                <span className="cursor-pointer font-medium underline decoration-gray-900 underline-offset-4 transition-colors hover:text-gray-700">
                  Simulasi Dampak Masa Depan
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 border-gray-300 bg-white">
                <h4 className="font-semibold text-base text-gray-900">
                  Simulasi Dampak Masa Depan
                </h4>
                <p className="mt-2 text-sm text-gray-500">
                  Memproyeksikan dampak lingkungan dan kesehatan apabila suatu
                  masalah tidak segera ditangani, sekaligus menunjukkan manfaat
                  dari tindakan pencegahan.
                </p>
              </HoverCardContent>
            </HoverCard>{" "}
            untuk mengubah setiap laporan lingkungan menjadi informasi yang
            dapat ditindaklanjuti, sehingga masyarakat dapat mengambil keputusan
            lebih cepat sebelum masalah berkembang menjadi bencana.
          </h2>
        </div>
      </div>
    </section>
  );
}
