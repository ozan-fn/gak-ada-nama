import { Button } from "@/components/ui/button";
import { Cloud, CloudRain, CloudSun, Rainbow, Sun, Wind } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getReportMapPinsFn } from "@/lib/reports.functions";
import { Link } from "@tanstack/react-router";

const weatherIcons = [
  {
    Icon: Sun,
    className: "left-[4%] top-[14%] size-9 rotate-[-8deg] text-amber-400",
  },
  {
    Icon: CloudSun,
    className: "left-[12%] bottom-[14%] size-8 rotate-[6deg] text-sky-400",
  },
  {
    Icon: CloudRain,
    className: "right-[6%] top-[16%] size-9 rotate-[10deg] text-slate-400",
  },
  {
    Icon: Wind,
    className: "right-[14%] bottom-[16%] size-8 rotate-[-6deg] text-slate-400",
  },
  {
    Icon: Rainbow,
    className:
      "left-[22%] top-[8%] size-6 rotate-[4deg] text-violet-300 opacity-40",
  },
  {
    Icon: Cloud,
    className:
      "right-[24%] bottom-[8%] size-6 rotate-[-4deg] text-slate-300 opacity-40",
  },
];

function formatNumber(num: number): string {
  if (num >= 1000) {
    return new Intl.NumberFormat("id-ID").format(num) + "+";
  }
  return num.toString();
}

export default function CTASection() {
  const { data: reportPins = [] } = useQuery({
    queryKey: ["reportMapPins"],
    queryFn: () => getReportMapPinsFn(),
    staleTime: 60_000, // 1 minute
  });

  const totalReports = reportPins.length;
  const uniqueRegions = new Set(
    reportPins.map((pin) => pin.locationName).filter(Boolean),
  ).size;

  const statChips = [
    {
      label: `${formatNumber(totalReports)} laporan`,
      className: "left-[7%] top-[46%]",
    },
    {
      label: `${formatNumber(uniqueRegions)} wilayah terpantau`,
      className: "right-[7%] top-[42%]",
    },
  ];

  return (
    <section className="relative py-16 px-6 bg-background md:py-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden bg-white shadow-sm rounded-4xl min-h-100 flex items-center justify-center">
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(34,211,238,0.18),transparent_45%)]" />
        {/* Blue orb */}
        <div className="absolute -bottom-52 left-1/3 h-125 w-145 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-52 right-1/3 h-125 w-145 translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />

        {/* Faint dotted paths connecting the icon corners — gives the scatter some structure */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <title>Decorative connecting paths</title>
          <path
            d="M60,90 Q 300,40 640,110"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            fill="none"
            className="text-slate-400"
          />
          <path
            d="M90,320 Q 350,380 700,300"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            fill="none"
            className="text-slate-400"
          />
        </svg>

        {/* Decorative weather icons */}
        {weatherIcons.map(({ Icon, className }) => (
          <Icon
            key={className}
            aria-hidden="true"
            strokeWidth={1.5}
            className={`pointer-events-none absolute select-none drop-shadow-sm ${className}`}
          />
        ))}

        {/* Small floating stat chips */}
        {statChips.map((chip) => (
          <div
            key={chip.label}
            className={`pointer-events-none absolute hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm md:flex ${chip.className}`}
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {chip.label}
          </div>
        ))}

        {/* Main content */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-12 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <Sun className="size-3.5" />
            Cuaca cerah, waktu yang tepat untuk melapor
          </div>

          <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 md:text-3xl lg:text-4xl">
            Dari Satu Temuan Menjadi Peringatan untuk Satu Lingkungan
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
            Bagikan kondisi yang kamu temukan di sekitar. Setiap laporan
            membantu orang lain mengetahui apa yang sedang terjadi dan lebih
            siap mengambil tindakan.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login">
              <Button size="lg" className="px-6 font-semibold shadow-sm">
                Mulai Sekarang
              </Button>
            </Link>

            <Link to="/livemap">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white px-6 font-semibold shadow-sm"
              >
                Jelajahi Peta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
