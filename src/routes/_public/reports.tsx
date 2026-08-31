import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowUpDown,
  Bot,
  CheckCircle,
  Clock,
  Droplets,
  Factory,
  FileText,
  Filter,
  MapPin,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPublicReportsFn } from "@/lib/public-reports.functions";

export const Route = createFileRoute("/_public/reports")({
  loader: () => getPublicReportsFn({ data: { limit: 100 } }),
  component: ReportsPage,
});

const categoryIcons = {
  sampah: Trash2,
  polusi: Factory,
  "drainase/banjir": Droplets,
  kebakaran: AlertTriangle,
  "fasilitas rusak": AlertTriangle,
  lainnya: AlertTriangle,
};

const categoryDefinitions = [
  { id: "all", label: "Semua" },
  { id: "sampah", label: "Sampah" },
  { id: "polusi", label: "Polusi" },
  { id: "drainase/banjir", label: "Drainase/Banjir" },
  { id: "kebakaran", label: "Kebakaran" },
  { id: "fasilitas rusak", label: "Fasilitas Rusak" },
  { id: "lainnya", label: "Lainnya" },
];

const statuses = [
  { id: "all", label: "Semua" },
  { id: "pending", label: "Menunggu" },
  { id: "verified", label: "Terverifikasi" },
  { id: "progress", label: "Diproses" },
  { id: "completed", label: "Selesai" },
  { id: "rejected", label: "Ditolak" },
];

function metadataString(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entry = (value as Record<string, unknown>)[key];

  return typeof entry === "string" ? entry : null;
}

function ReportsPage() {
  const databaseReports = Route.useLoaderData();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [query, setQuery] = useState("");

  const reports = useMemo(
    () =>
      databaseReports.map((report) => {
        const normalizedStatus =
          report.status === "PENDING"
            ? "pending"
            : report.status === "VERIFIED"
              ? "verified"
              : report.status === "RESOLVED"
                ? "completed"
                : report.status === "REJECTED"
                  ? "rejected"
                  : "progress";

        const normalizedUrgency = report.urgency.toLowerCase();

        return {
          id: report.id,
          title: report.title,
          category: report.category.toLowerCase(),
          categoryLabel: report.category,
          location: report.locationName,
          date: formatDistanceToNow(new Date(report.createdAt), {
            addSuffix: true,
            locale: idLocale,
          }),
          status: normalizedStatus,
          priority: normalizedUrgency.includes("tinggi")
            ? "high"
            : normalizedUrgency.includes("sedang")
              ? "medium"
              : "low",
          reporter:
            report.source === "ENVIRONMENT_MONITOR"
              ? "Prita Environmental Monitor"
              : report.user.name,
          image: report.images[0] ?? null,
          automatic: report.source === "ENVIRONMENT_MONITOR",
          sourceConfidence: report.sourceConfidence,
          locationAttribution: metadataString(
            report.sourceMetadata,
            "locationAttribution",
          ),
        };
      }),
    [databaseReports],
  );

  const visibleReports = reports.filter((report) => {
    const normalizedQuery = query.trim().toLowerCase();

    return (
      (selectedCategory === "all" || report.category === selectedCategory) &&
      (selectedStatus === "all" || report.status === selectedStatus) &&
      (!normalizedQuery ||
        report.title.toLowerCase().includes(normalizedQuery) ||
        report.location.toLowerCase().includes(normalizedQuery))
    );
  });

  const categories = categoryDefinitions.map((category) => ({
    ...category,
    count:
      category.id === "all"
        ? reports.length
        : reports.filter((report) => report.category === category.id).length,
  }));

  const reportStats = [
    {
      label: "Total laporan",
      value: reports.length,
    },
    {
      label: "Terdeteksi otomatis",
      value: reports.filter((report) => report.automatic).length,
    },
    {
      label: "Sedang diproses",
      value: reports.filter((report) => report.status === "progress").length,
    },
    {
      label: "Selesai",
      value: reports.filter((report) => report.status === "completed").length,
    },
  ];

  const getStatusMeta = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Menunggu",
          icon: Clock,
          className: "border-amber-200 bg-amber-50 text-amber-700",
          dot: "bg-amber-500",
        };

      case "progress":
        return {
          label: "Diproses",
          icon: ArrowUpDown,
          className: "border-blue-200 bg-blue-50 text-blue-700",
          dot: "bg-blue-500",
        };

      case "verified":
        return {
          label: "Terverifikasi",
          icon: CheckCircle,
          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
          dot: "bg-emerald-500",
        };

      case "completed":
        return {
          label: "Selesai",
          icon: CheckCircle,
          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
          dot: "bg-emerald-500",
        };

      case "rejected":
        return {
          label: "Ditolak",
          icon: XCircle,
          className: "border-zinc-200 bg-zinc-50 text-zinc-600",
          dot: "bg-zinc-400",
        };

      default:
        return {
          label: status,
          icon: Clock,
          className: "border-zinc-200 bg-zinc-50 text-zinc-600",
          dot: "bg-zinc-400",
        };
    }
  };

  const getPriorityMeta = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          label: "Prioritas tinggi",
          dot: "bg-red-500",
        };

      case "medium":
        return {
          label: "Prioritas sedang",
          dot: "bg-amber-500",
        };

      default:
        return {
          label: "Prioritas rendah",
          dot: "bg-zinc-300",
        };
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 lg:px-8 lg:pb-14 lg:pt-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-cyan-500 shadow-xs">
              Laporan lingkungan
            </span>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              Pantau kondisi lingkungan
              <br className="hidden sm:block" /> melalui laporan masyarakat.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500 sm:text-[15px]">
              Temukan laporan lingkungan yang terjadi di sekitar, lihat status
              penanganannya, dan ikuti perkembangan secara transparan.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 border-y border-zinc-200 sm:grid-cols-4">
            {reportStats.map((stat, index) => (
              <div
                key={stat.label}
                className={`px-4 py-5 sm:px-5 ${
                  index > 0 ? "border-l border-zinc-200" : ""
                } ${
                  index >= 2 ? "border-t border-zinc-200 sm:border-t-0" : ""
                }`}
              >
                <div className="text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums">
                  {stat.value}
                </div>

                <div className="mt-1 text-xs text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTENT
      ========================================================= */}
      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          {/* =====================================================
              FILTER
          ===================================================== */}
          <aside className="lg:w-52 lg:shrink-0">
            <div className="space-y-7 lg:sticky lg:top-24">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />

                  <Input
                    type="text"
                    placeholder="Cari laporan"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-9 border-zinc-200 bg-white pl-9 text-xs shadow-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
                  <Filter className="size-3" />
                  Kategori
                </div>

                <div className="space-y-0.5">
                  {categories.map((category) => {
                    const Icon =
                      category.id === "all"
                        ? FileText
                        : categoryIcons[
                            category.id as keyof typeof categoryIcons
                          ];

                    const active = selectedCategory === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                          active
                            ? "bg-zinc-100 font-medium text-zinc-900"
                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {Icon && <Icon className="size-3.5 shrink-0" />}

                          <span className="truncate">{category.label}</span>
                        </span>

                        <span className="ml-2 text-[10px] tabular-nums text-zinc-400">
                          {category.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="mb-2.5 text-[10px] font-medium text-zinc-400">
                  Status
                </div>

                <div className="space-y-0.5">
                  {statuses.map((status) => {
                    const active = selectedStatus === status.id;

                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => setSelectedStatus(status.id)}
                        className={`w-full rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                          active
                            ? "bg-zinc-100 font-medium text-zinc-900"
                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                      >
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* =====================================================
              REPORTS
          ===================================================== */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-900">
                    {visibleReports.length}
                  </span>{" "}
                  laporan ditemukan
                </p>
              </div>

              <Select defaultValue="newest">
                <SelectTrigger className="h-8 w-36 border-zinc-200 text-xs shadow-none">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>

                  <SelectItem value="priority">Prioritas</SelectItem>

                  <SelectItem value="location">Lokasi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Empty state */}
            {visibleReports.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 px-6 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-zinc-50">
                  <Search className="size-4 text-zinc-400" />
                </div>

                <h3 className="mt-4 text-sm font-medium text-zinc-900">
                  Tidak ada laporan
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
                  Coba ubah kata kunci pencarian atau filter yang digunakan.
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-xs"
                  onClick={() => {
                    setQuery("");
                    setSelectedCategory("all");
                    setSelectedStatus("all");
                  }}
                >
                  Reset filter
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleReports.map((report) => {
                  const CategoryIcon =
                    categoryIcons[
                      report.category as keyof typeof categoryIcons
                    ] ?? AlertTriangle;

                  const statusMeta = getStatusMeta(report.status);

                  const priorityMeta = getPriorityMeta(report.priority);

                  return (
                    <Card
                      key={report.id}
                      className="group overflow-hidden rounded-xl border-zinc-200 bg-white p-0 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_8px_30px_-16px_rgba(0,0,0,0.18)]"
                    >
                      {/* Image */}
                      <div className="relative aspect-[1.45/1] overflow-hidden bg-zinc-100">
                        {report.image ? (
                          <img
                            src={report.image}
                            alt={report.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,#d1fae5,#f4f4f5_58%)]">
                            <CategoryIcon className="size-8 text-emerald-600/60" />
                          </div>
                        )}

                        {/* Automatic */}
                        {report.automatic && (
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-white/40 bg-white/90 px-2 py-1 text-[9px] font-medium text-emerald-700 shadow-sm backdrop-blur-sm">
                            <Bot className="size-3" />

                            <span>
                              Otomatis
                              {report.sourceConfidence !== null &&
                                ` · ${Math.round(
                                  report.sourceConfidence * 100,
                                )}%`}
                            </span>
                          </span>
                        )}

                        {/* Priority */}
                        <span
                          title={priorityMeta.label}
                          className={`absolute right-3 top-3 size-2 rounded-full ring-2 ring-white ${priorityMeta.dot}`}
                        />
                      </div>

                      {/* Card Header */}
                      <CardHeader className="px-4 pb-2.5 pt-4">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className="h-6 max-w-[55%] gap-1.5 border-zinc-200 px-2 text-[10px] font-medium text-zinc-600"
                          >
                            <CategoryIcon className="size-3" />

                            <span className="truncate">
                              {report.categoryLabel}
                            </span>
                          </Badge>

                          <span
                            className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-md border px-2 text-[10px] font-medium ${statusMeta.className}`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${statusMeta.dot}`}
                            />

                            {statusMeta.label}
                          </span>
                        </div>
                      </CardHeader>

                      {/* Content */}
                      <CardContent className="px-4 pb-3">
                        <h3 className="line-clamp-2 text-sm font-medium leading-5 text-zinc-900">
                          {report.title}
                        </h3>

                        <div className="mt-3 space-y-1.5 text-[11px] text-zinc-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3 shrink-0 text-zinc-400" />

                            <span className="truncate">{report.location}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span>{report.date}</span>

                            <span className="max-w-[55%] truncate text-right text-zinc-400">
                              {report.reporter}
                            </span>
                          </div>
                        </div>

                        {/* Automatic information */}
                        {report.automatic && report.status === "verified" && (
                          <div className="mt-3 border-t border-zinc-100 pt-3">
                            <p className="text-[10px] leading-relaxed text-emerald-700">
                              Threshold sensor terpenuhi; belum dikonfirmasi
                              saksi manusia.
                            </p>

                            {report.locationAttribution && (
                              <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">
                                Nama lokasi berdasarkan{" "}
                                {report.locationAttribution}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>

                      {/* Footer */}
                      <CardFooter className="px-4 pb-4 pt-1">
                        <Button
                          render={
                            <Link
                              to="/dashboard/report-detail/$reportId"
                              params={{
                                reportId: report.id,
                              }}
                            />
                          }
                          variant="outline"
                          size="sm"
                          className="h-8 w-full border-zinc-200 text-xs font-medium shadow-none transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                        >
                          Lihat detail
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {visibleReports.length > 0 && (
              <div className="mt-10 border-t border-zinc-200 pt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>

                    {[1, 2, 3, 4, 5].map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink href="#" isActive={page === 1}>
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
