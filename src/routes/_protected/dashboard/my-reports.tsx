import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Plus,
  MapPin,
  Clock,
  ChevronDown,
  CloudRain,
  Wind,
  Flame,
  Waves,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Clock3,
  XCircle,
  Brain,
  Users,
  ClipboardX,
} from "lucide-react";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/_protected/dashboard/my-reports")({
  component: MyReportsPage,
});

type ReportStatus = "verified" | "pending" | "rejected";

type ReportCategory =
  | "Banjir"
  | "Cuaca"
  | "Kualitas Udara"
  | "Sampah"
  | "Kebakaran";

type Report = {
  id: number;
  title: string;
  category: ReportCategory;
  location: string;
  status: ReportStatus;
  date: string;
  confidence?: number;
  supportingReports?: number;
};

const statusConfig: Record<
  ReportStatus,
  { label: string; note: string; className: string; icon: typeof CheckCircle2 }
> = {
  verified: {
    label: "Terverifikasi",
    note: "Didukung komunitas",
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200/50",
    icon: CheckCircle2,
  },
  pending: {
    label: "Menunggu Verifikasi",
    note: "Sedang dianalisis Prita",
    className: "bg-amber-50 text-amber-600 border border-amber-200/50",
    icon: Clock3,
  },
  rejected: {
    label: "Ditolak",
    note: "Bukti belum cukup",
    className: "bg-red-50 text-red-500 border border-red-200/50",
    icon: XCircle,
  },
};

const categoryConfig: Record<
  ReportCategory,
  { icon: typeof Waves; className: string }
> = {
  Banjir: { icon: Waves, className: "bg-blue-50 text-blue-500" },
  Cuaca: { icon: CloudRain, className: "bg-sky-50 text-sky-500" },
  "Kualitas Udara": { icon: Wind, className: "bg-violet-50 text-violet-500" },
  Sampah: { icon: Trash2, className: "bg-emerald-50 text-emerald-500" },
  Kebakaran: { icon: Flame, className: "bg-orange-50 text-orange-500" },
};

const reports: Report[] = [
  {
    id: 1,
    title: "Genangan air di Jl. Percetakan Negara",
    category: "Banjir",
    location: "Cempaka Putih, Jakarta Pusat",
    status: "pending",
    date: "16 Agu, 14:20",
    confidence: 91,
  },
  {
    id: 2,
    title: "Angin kencang merobohkan pohon",
    category: "Cuaca",
    location: "Menteng, Jakarta Pusat",
    status: "verified",
    date: "15 Agu, 09:05",
    confidence: 96,
    supportingReports: 3,
  },
  {
    id: 3,
    title: "Kabut asap tebal mengganggu jarak pandang",
    category: "Kualitas Udara",
    location: "Pekanbaru, Riau",
    status: "verified",
    date: "13 Agu, 18:40",
    confidence: 94,
    supportingReports: 5,
  },
  {
    id: 4,
    title: "Titik api kecil di lahan kosong",
    category: "Kebakaran",
    location: "Cibubur, Jakarta Timur",
    status: "rejected",
    date: "10 Agu, 11:15",
    confidence: 42,
  },
  {
    id: 5,
    title: "Sampah menumpuk di saluran air",
    category: "Sampah",
    location: "Kelapa Gading, Jakarta Utara",
    status: "pending",
    date: "08 Agu, 16:50",
    confidence: 87,
  },
];

const filters = ["Semua", "Menunggu Verifikasi", "Terverifikasi", "Ditolak"];

function MyReportsPage() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = reports.filter((report) => {
    const matchesFilter =
      activeFilter === "Semua" ||
      statusConfig[report.status].label === activeFilter;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      report.title.toLowerCase().includes(query) ||
      report.location.toLowerCase().includes(query) ||
      report.category.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const summary = [
    {
      label: "Total Laporan",
      value: reports.length,
      accent: "text-neutral-900",
    },
    {
      label: "Menunggu",
      value: reports.filter((r) => r.status === "pending").length,
      accent: "text-amber-600",
    },
    {
      label: "Terverifikasi",
      value: reports.filter((r) => r.status === "verified").length,
      accent: "text-emerald-600",
    },
    {
      label: "Ditolak",
      value: reports.filter((r) => r.status === "rejected").length,
      accent: "text-red-500",
    },
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      {/* Parent Utama Menggunakan Flex */}
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
        {/* Kolom Kiri: Parent Container Abu-abu */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2.5 lg:w-2/3">
          {/* Card Putih 1: Filter & Search */}
          <div className="flex flex-col gap-3 rounded-lg bg-white p-3 shadow-xs sm:px-4 sm:py-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 sm:text-sm">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                  <span>Daftar Laporan</span>
                </div>
                <span className="text-xs font-medium text-neutral-800">
                  Riwayat kontribusi lingkungan Anda
                </span>
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari laporan..."
                  className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-xs text-neutral-700 outline-none transition-colors placeholder:text-neutral-400 focus:border-cyan-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto border-t border-neutral-100 pt-2.5">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeFilter === filter
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Card Putih 2: List Laporan */}
          <div className="flex-1 overflow-hidden rounded-lg bg-white shadow-xs">
            {filteredReports.length > 0 && (
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
                <p className="text-[11px] font-medium text-neutral-400">
                  Menampilkan {filteredReports.length} laporan
                </p>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                >
                  Terbaru
                  <ChevronDown className="size-3 text-neutral-400" />
                </button>
              </div>
            )}

            <div className="flex flex-col divide-y divide-neutral-100">
              {filteredReports.map((report) => {
                const status = statusConfig[report.status];
                const StatusIcon = status.icon;
                const category = categoryConfig[report.category];
                const CategoryIcon = category.icon;

                return (
                  <article
                    key={report.id}
                    className="group flex flex-col gap-3 p-4 transition-colors hover:bg-neutral-50/70 sm:flex-row sm:items-center"
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${category.className}`}
                    >
                      <CategoryIcon className="size-4.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-semibold text-neutral-900">
                        {report.title}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {report.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {report.date}
                        </span>
                        {report.confidence && (
                          <span className="inline-flex items-center gap-1 font-medium text-neutral-700">
                            <Brain className="size-3 text-cyan-600" />
                            {report.confidence}% AI confidence
                          </span>
                        )}
                        {report.status === "verified" &&
                          report.supportingReports && (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                              <Users className="size-3" />
                              {report.supportingReports} laporan pendukung
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 self-start sm:self-auto">
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}
                        >
                          <StatusIcon className="size-3" />
                          {status.label}
                        </div>
                        <p className="mt-0.5 text-[10px] text-neutral-400">
                          {status.note}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-400 opacity-0 transition-colors group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-700 sm:opacity-100"
                        aria-label="Opsi laporan"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-neutral-100">
                    <ClipboardX className="size-5 text-neutral-400" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-neutral-800">
                    Tidak ada laporan
                  </h3>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-400">
                    Belum ada laporan yang sesuai dengan pencarian atau filter
                    yang kamu pilih.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Parent Container Abu-abu (Flex Layout, h-fit, Sticky) */}
        <div className="flex h-fit w-full flex-col gap-3 rounded-xl bg-muted/50 p-2.5 lg:sticky lg:top-4 lg:w-1/3 lg:self-start">
          {/* Header */}
          <div className="flex items-center justify-between px-1 py-0.5">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Statistik Laporan
            </h2>
          </div>

          {/* Card Putih 1: Tombol Laporan */}
          <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle2 className="size-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-800">
                  Kontribusi Aktif
                </h3>
                <p className="text-xs text-neutral-500">
                  Terima kasih atas laporan Anda!
                </p>
              </div>
            </div>
            <Button variant="default" className="mt-1 w-full gap-2 font-medium">
              <Plus className="size-4" />
              Buat Laporan Baru
            </Button>
          </div>

          {/* Card Putih 2: Ringkasan Statistik Menggunakan Flexbox (flex-wrap + min-w) */}
          <div className="flex flex-wrap gap-3">
            {summary.map((item) => (
              <div
                key={item.label}
                className="flex flex-1 min-w-[calc(50%-0.375rem)] flex-col items-center justify-center gap-1 rounded-lg bg-white p-4 text-center shadow-xs"
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                  {item.label}
                </p>
                <p
                  className={`text-2xl font-bold tracking-tight ${item.accent}`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}