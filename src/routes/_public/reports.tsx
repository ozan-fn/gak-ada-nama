import { createFileRoute } from "@tanstack/react-router";
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
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "#/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { getPublicReportsFn } from "#/lib/public-reports.functions";

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
	{ id: "all", label: "Semua Status" },
	{ id: "pending", label: "Menunggu" },
	{ id: "verified", label: "Terverifikasi" },
	{ id: "progress", label: "Diproses" },
	{ id: "completed", label: "Selesai" },
	{ id: "rejected", label: "Ditolak" },
];

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
		{ label: "Total Laporan", value: reports.length },
		{
			label: "Terdeteksi Otomatis",
			value: reports.filter((report) => report.automatic).length,
		},
		{
			label: "Sedang Diproses",
			value: reports.filter((report) => report.status === "progress").length,
		},
		{
			label: "Selesai",
			value: reports.filter((report) => report.status === "completed").length,
		},
	];

	const getStatusVariant = (status: string) => {
		switch (status) {
			case "pending":
				return "secondary";
			case "progress":
				return "default";
			case "verified":
				return "default";
			case "completed":
				return "default";
			case "rejected":
				return "destructive";
			default:
				return "outline";
		}
	};

	const getStatusMeta = (status: string) => {
		switch (status) {
			case "pending":
				return { label: "Menunggu", icon: Clock, dot: "bg-amber-500" };
			case "progress":
				return { label: "Diproses", icon: ArrowUpDown, dot: "bg-blue-500" };
			case "verified":
				return {
					label: "Terverifikasi",
					icon: CheckCircle,
					dot: "bg-emerald-600",
				};
			case "completed":
				return { label: "Selesai", icon: CheckCircle, dot: "bg-emerald-600" };
			case "rejected":
				return { label: "Ditolak", icon: XCircle, dot: "bg-zinc-400" };
			default:
				return { label: status, icon: Clock, dot: "bg-zinc-400" };
		}
	};

	const getPriorityMeta = (priority: string) => {
		switch (priority) {
			case "high":
				return { label: "Prioritas Tinggi", dot: "bg-red-500" };
			case "medium":
				return { label: "Prioritas Sedang", dot: "bg-amber-500" };
			case "low":
				return { label: "Prioritas Rendah", dot: "bg-zinc-300" };
			default:
				return { label: priority, dot: "bg-zinc-300" };
		}
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Hero */}
			<section className="border-b border-zinc-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<Badge
						variant="outline"
						className="mb-3 text-[10px] uppercase tracking-widest"
					>
						EcoSentry / Laporan
					</Badge>
					<h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
						Laporan lingkungan dari masyarakat dan sistem pemantauan
					</h1>
					<p className="mt-3 max-w-xl text-sm text-zinc-500">
						Pantau dan lacak laporan masalah lingkungan secara real-time,
						terverifikasi oleh sistem dan komunitas.
					</p>

					{/* Stats */}
					<div className="mt-10 grid grid-cols-2 overflow-hidden rounded-lg border border-zinc-200 sm:grid-cols-4">
						{reportStats.map((stat, i) => (
							<div
								key={stat.label}
								className={`px-5 py-5 ${i !== 0 ? "border-l border-zinc-200" : ""} ${i >= 2 ? "border-t border-zinc-200 sm:border-t-0" : ""}`}
							>
								<div className="text-[10px] uppercase tracking-widest text-zinc-400">
									{stat.label}
								</div>
								<div className="mt-2 flex items-baseline gap-2">
									<span className="text-2xl font-semibold tabular-nums text-zinc-900">
										{stat.value}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Main Content */}
			<section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-10 lg:flex-row">
					{/* Sidebar Filters */}
					<aside className="lg:w-64 lg:shrink-0">
						<div className="sticky top-6 space-y-8">
							{/* Search */}
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
								<Input
									type="text"
									placeholder="Cari laporan..."
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									className="pl-9 text-sm"
								/>
							</div>

							{/* Categories */}
							<div>
								<div className="mb-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
									<Filter className="h-3 w-3" />
									Kategori
								</div>
								<div className="space-y-0.5">
									{categories.map((cat) => {
										const Icon =
											cat.id === "all"
												? FileText
												: categoryIcons[cat.id as keyof typeof categoryIcons];
										const active = selectedCategory === cat.id;
										return (
											<Button
												key={cat.id}
												variant={active ? "default" : "ghost"}
												size="sm"
												onClick={() => setSelectedCategory(cat.id)}
												className="w-full justify-between"
											>
												<span className="flex items-center gap-2">
													{Icon && <Icon className="h-3.5 w-3.5" />}
													{cat.label}
												</span>
												<span className="text-xs tabular-nums opacity-60">
													{cat.count}
												</span>
											</Button>
										);
									})}
								</div>
							</div>

							{/* Status Filter */}
							<div>
								<div className="mb-3 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
									Status
								</div>
								<div className="space-y-0.5">
									{statuses.map((status) => {
										const active = selectedStatus === status.id;
										return (
											<Button
												key={status.id}
												variant={active ? "default" : "ghost"}
												size="sm"
												onClick={() => setSelectedStatus(status.id)}
												className="w-full justify-start"
											>
												{status.label}
											</Button>
										);
									})}
								</div>
							</div>
						</div>
					</aside>

					{/* Reports Grid */}
					<div className="flex-1">
						<div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4">
							<h2 className="text-sm text-zinc-500">
								Menampilkan{" "}
								<span className="font-medium text-zinc-900">
									{visibleReports.length}
								</span>{" "}
								laporan
							</h2>
							<Select defaultValue="newest">
								<SelectTrigger className="w-45">
									<SelectValue placeholder="Urutkan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="newest">Terbaru</SelectItem>
									<SelectItem value="priority">Prioritas Tinggi</SelectItem>
									<SelectItem value="location">Lokasi Terdekat</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{visibleReports.map((report) => {
								const CategoryIcon =
									categoryIcons[
										report.category as keyof typeof categoryIcons
									] ?? AlertTriangle;
								const statusMeta = getStatusMeta(report.status);
								const priorityMeta = getPriorityMeta(report.priority);
								return (
									<Card key={report.id} className="group overflow-hidden p-0">
										<div className="relative aspect-4/3 overflow-hidden bg-zinc-100">
											{report.image ? (
												<img
													src={report.image}
													alt={report.title}
													className="h-full w-full object-cover transition-transform group-hover:scale-105"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,_#d1fae5,_#f4f4f5_58%)] text-emerald-700">
													<CategoryIcon className="size-10 opacity-70" />
												</div>
											)}
											{report.automatic && (
												<span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-medium text-white shadow-sm">
													<Bot className="size-3" />
													Terdeteksi otomatis
													{report.sourceConfidence !== null &&
														` · ${Math.round(report.sourceConfidence * 100)}%`}
												</span>
											)}
											<span
												title={priorityMeta.label}
												className={`absolute right-3 top-3 h-2 w-2 rounded-full ${priorityMeta.dot}`}
											/>
										</div>
										<CardHeader className="pb-3">
											<div className="flex items-center justify-between">
												<Badge variant="outline" className="gap-1.5">
													<CategoryIcon className="h-3 w-3" />
													<span>{report.categoryLabel}</span>
												</Badge>
												<Badge
													variant={getStatusVariant(report.status)}
													className="gap-1"
												>
													<span
														className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`}
													/>
													{statusMeta.label}
												</Badge>
											</div>
										</CardHeader>
										<CardContent className="pb-3">
											<h3 className="mb-3 line-clamp-2 text-sm font-medium leading-snug text-zinc-900">
												{report.title}
											</h3>
											<div className="space-y-1.5 text-xs text-zinc-500">
												<div className="flex items-center gap-1.5">
													<MapPin className="h-3.5 w-3.5 shrink-0" />
													{report.location}
												</div>
												<div className="flex items-center justify-between">
													<span>{report.date}</span>
													<span className="text-zinc-400">
														{report.reporter}
													</span>
												</div>
											</div>
											{report.automatic && report.status === "verified" && (
												<p className="mt-3 text-[10px] leading-relaxed text-emerald-700">
													Threshold sensor terpenuhi; belum dikonfirmasi saksi
													manusia.
												</p>
											)}
										</CardContent>
										<CardFooter>
											<Button variant="outline" size="sm" className="w-full">
												Lihat Detail
											</Button>
										</CardFooter>
									</Card>
								);
							})}
						</div>

						{/* Pagination */}
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
					</div>
				</div>
			</section>
		</div>
	);
}
