import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowLeft,
	BadgeCheck,
	CalendarClock,
	Camera,
	CheckCircle2,
	Eye,
	FileQuestion,
	Gauge,
	History,
	Images,
	MapPin,
	ScanSearch,
	ShieldAlert,
	Sparkles,
	Target,
	Wind,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Progress } from "#/components/ui/progress";
import { getReportByIdFn } from "#/lib/reports.functions";

export const Route = createFileRoute("/_protected/dashboard/report-detail/$reportId")({
	loader: async ({ params }) => getReportByIdFn({ data: params.reportId }),
	component: ReportDetailPage,
});

const categoryConfig: Record<string, { icon: typeof Wind; className: string }> =
	{
		Banjir: { icon: Wind, className: "bg-blue-50 text-blue-600" },
		"Drainase/Banjir": { icon: Wind, className: "bg-blue-50 text-blue-600" },
		Cuaca: { icon: Wind, className: "bg-sky-50 text-sky-600" },
		"Kualitas Udara": { icon: Wind, className: "bg-violet-50 text-violet-600" },
		Polusi: { icon: Wind, className: "bg-violet-50 text-violet-600" },
		Sampah: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" },
		Kebakaran: {
			icon: AlertTriangle,
			className: "bg-orange-50 text-orange-600",
		},
		"Fasilitas Rusak": {
			icon: AlertTriangle,
			className: "bg-amber-50 text-amber-600",
		},
		Lainnya: {
			icon: FileQuestion,
			className: "bg-neutral-100 text-neutral-600",
		},
	};

const statusConfig: Record<string, { label: string; className: string }> = {
	VERIFIED: {
		label: "Terverifikasi",
		className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
	},
	PENDING: {
		label: "Menunggu Verifikasi",
		className: "bg-amber-50 text-amber-700 ring-amber-200",
	},
	IN_PROGRESS: {
		label: "Sedang Ditangani",
		className: "bg-sky-50 text-sky-700 ring-sky-200",
	},
	RESOLVED: {
		label: "Selesai",
		className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
	},
	REJECTED: {
		label: "Ditolak",
		className: "bg-rose-50 text-rose-700 ring-rose-200",
	},
};

const assessmentStatusConfig: Record<
	string,
	{ label: string; className: string }
> = {
	COMPLETE: {
		label: "Analisis lengkap",
		className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
	},
	PARTIAL: {
		label: "Data sebagian",
		className: "bg-amber-50 text-amber-700 ring-amber-200",
	},
	PENDING: {
		label: "Sedang dianalisis",
		className: "bg-sky-50 text-sky-700 ring-sky-200",
	},
	FAILED: {
		label: "Analisis tertunda",
		className: "bg-rose-50 text-rose-700 ring-rose-200",
	},
};

const riskLevelConfig: Record<string, { label: string; className: string }> = {
	LOW: { label: "Rendah", className: "bg-emerald-50 text-emerald-700" },
	MODERATE: { label: "Sedang", className: "bg-amber-50 text-amber-700" },
	HIGH: { label: "Tinggi", className: "bg-orange-50 text-orange-700" },
	CRITICAL: { label: "Kritis", className: "bg-rose-50 text-rose-700" },
};

function formatDate(value?: Date | string | null): string {
	if (!value) return "-";
	const date = new Date(value);
	return date.toLocaleString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function toPercent(value?: number | null): number | null {
	if (typeof value !== "number") return null;
	return Math.round(Math.min(1, Math.max(0, value)) * 100);
}

const confirmationItems = [
	{ id: "location", label: "Lokasi kejadian sesuai dengan foto", icon: MapPin },
	{
		id: "photo",
		label: "Foto menggambarkan kejadian dengan akurat",
		icon: Camera,
	},
	{
		id: "desc",
		label: "Deskripsi sesuai dengan kondisi di lapangan",
		icon: FileQuestion,
	},
];

function useReportConfirmations(reportId: string) {
	const key = `report-confirm:${reportId}`;
	const [items, setItems] = useState<Record<string, boolean>>(() => {
		try {
			const raw =
				typeof window === "undefined" ? null : window.localStorage.getItem(key);
			return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
		} catch {
			return {};
		}
	});

	const toggle = (id: string) => {
		setItems((prev) => {
			const next = { ...prev, [id]: !prev[id] };
			try {
				window.localStorage.setItem(key, JSON.stringify(next));
			} catch {
				/* ignore */
			}
			return next;
		});
	};

	return { items, toggle };
}

function ReportDetailPage() {
	const report = Route.useLoaderData();

	if (!report) {
		return (
			<main className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-3 bg-neutral-50/40 px-4 text-center">
				<div className="grid size-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
					<FileQuestion className="size-7" />
				</div>
				<h2 className="text-base font-semibold text-neutral-900">
					Laporan Tidak Ditemukan
				</h2>
				<p className="max-w-sm text-sm text-neutral-500">
					Laporan tidak tersedia atau bukan milik Anda.
				</p>
				<Button
					render={<Link to="/dashboard/my-reports" />}
					className="mt-2 gap-2"
				>
					<ArrowLeft className="size-4" />
					Kembali ke Laporan Saya
				</Button>
			</main>
		);
	}

	const ecolens = report.ecolensAnalysis;
	const risk = report.riskAssessment;
	const confidence = toPercent(ecolens?.confidence);
	const riskConfidence = toPercent(risk?.confidence);
	const CategoryIcon = categoryConfig[report.category]?.icon ?? FileQuestion;
	const status = statusConfig[report.status] ?? statusConfig.PENDING;
	const assessmentStatus =
		assessmentStatusConfig[risk?.status ?? "PENDING"] ??
		assessmentStatusConfig.PENDING;
	const riskLevel = risk?.level ? riskLevelConfig[risk?.level] : null;
	const latestPhoto = report.images[0];
	const { items, toggle } = useReportConfirmations(report.id);
	const [lightbox, setLightbox] = useState<string | null>(null);

	const timeline = [
		{
			icon: FileQuestion,
			label: "Laporan dibuat",
			sub: formatDate(report.createdAt),
		},
		...(ecolens
			? [
					{
						icon: ScanSearch,
						label: "Analisis AI (EcoLens)",
						sub: formatDate(ecolens.createdAt),
					},
				]
			: []),
		...(risk
			? [
					{
						icon: Gauge,
						label: `Analisis risiko (${riskLevel?.label ?? risk.status})`,
						sub: formatDate(risk.lastAttemptAt ?? risk.updatedAt),
					},
				]
			: []),
		{
			icon: BadgeCheck,
			label: "Status terakhir",
			sub: `${status.label} · ${formatDate(report.updatedAt)}`,
		},
	];

	return (
		<main className="min-h-[calc(100dvh-3.5rem)] bg-neutral-50/40">
			<div className="mx-auto max-w-3xl space-y-4 p-4">
				<Button
					render={<Link to="/dashboard/my-reports" />}
					variant="ghost"
					size="sm"
					className="-ml-2 gap-1.5 text-neutral-600"
				>
					<ArrowLeft className="size-4" />
					Kembali
				</Button>

				{/* Header */}
				<Card className="overflow-hidden border-0 shadow-sm">
					<CardContent className="p-5">
						<div className="flex items-start justify-between gap-3">
							<div className="flex items-start gap-3">
								<div
									className={`grid size-11 shrink-0 place-items-center rounded-xl ${categoryConfig[report.category]?.className ?? "bg-neutral-100 text-neutral-500"}`}
								>
									<CategoryIcon className="size-5" />
								</div>
								<div>
									<h1 className="text-base font-semibold text-neutral-900">
										{report.title}
									</h1>
									<p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
										<span className="inline-flex items-center gap-1">
											<MapPin className="size-3" />
											{report.locationName}
										</span>
										<span className="inline-flex items-center gap-1">
											<CalendarClock className="size-3" />
											{formatDate(report.createdAt)}
										</span>
									</p>
								</div>
							</div>
							<Badge className={`shrink-0 ${status.className}`}>
								{status.label}
							</Badge>
						</div>

						<p className="mt-4 whitespace-pre-line text-sm leading-6 text-neutral-600">
							{report.description}
						</p>

						{report.user && (
							<div className="mt-5 flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
								<Avatar className="size-9">
									<AvatarImage
										src={report.user.image ?? undefined}
										alt={report.user.name}
									/>
									<AvatarFallback className="bg-sky-500 text-xs font-semibold text-white">
										{report.user.name?.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<p className="text-xs font-semibold text-neutral-800">
										Dilaporkan oleh {report.user.name}
									</p>
									<p className="truncate text-[11px] text-neutral-500">
										{report.user.email}
									</p>
								</div>
								{report.latitude != null && report.longitude != null ? (
									<Badge
										variant="outline"
										className="ml-auto gap-1 text-[10px] text-neutral-500"
									>
										<Target className="size-3" />
										{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
									</Badge>
								) : null}
							</div>
						)}
					</CardContent>
				</Card>

				{report.images.length > 0 && (
					<>
						{/* Latest Photo */}
						<Card className="border-0 shadow-sm">
							<CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
									<Eye className="size-4 text-sky-600" />
									Foto Terbaru
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-2">
								<button
									type="button"
									onClick={() => setLightbox(latestPhoto)}
									className="group block w-full overflow-hidden rounded-xl"
								>
									<img
										src={latestPhoto}
										alt={`${report.title} foto utama`}
										className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
									/>
								</button>
							</CardContent>
						</Card>

						{/* Photo Gallery */}
						<Card className="border-0 shadow-sm">
							<CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
									<Images className="size-4 text-sky-600" />
									Galeri Foto
								</CardTitle>
								<Badge
									variant="outline"
									className="text-[10px] text-neutral-500"
								>
									{report.images.length} foto
								</Badge>
							</CardHeader>
							<CardContent className="pt-2">
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
									{report.images.map((image, index) => (
										<button
											key={image}
											type="button"
											onClick={() => setLightbox(image)}
											className="group relative aspect-square w-full overflow-hidden rounded-xl"
										>
											<img
												src={image}
												alt={`${report.title} ${index + 1}`}
												className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
											/>
										</button>
									))}
								</div>
							</CardContent>
						</Card>
					</>
				)}

				{/* AI Detection Result */}
				<Card className="border-0 shadow-sm">
					<CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
						<CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
							<ScanSearch className="size-4 text-violet-600" />
							Hasil Deteksi AI
						</CardTitle>
						{ecolens?.visionModel && (
							<Badge
								variant="outline"
								className="ml-auto text-[10px] text-neutral-400"
							>
								{ecolens.visionModel}
							</Badge>
						)}
					</CardHeader>
					<CardContent className="pt-2">
						{ecolens ? (
							<div className="space-y-3">
								<div className="flex flex-wrap gap-2">
									<Badge
										className={
											categoryConfig[ecolens.category]?.className ??
											"bg-neutral-100 text-neutral-600"
										}
									>
										{ecolens.category}
									</Badge>
									<Badge variant="outline" className="text-[11px]">
										Urgensi: {ecolens.urgency}
									</Badge>
								</div>
								<p className="text-sm leading-6 text-neutral-600">
									{ecolens.summary}
								</p>
								{ecolens.suggestedDescription && (
									<div className="rounded-xl bg-violet-50/70 p-3">
										<p className="text-[11px] font-semibold text-violet-700">
											Deskripsi yang disarankan
										</p>
										<p className="mt-1 text-[13px] text-violet-900">
											{ecolens.suggestedDescription}
										</p>
									</div>
								)}

								{confidence != null && (
									<div>
										<div className="mb-1.5 flex items-center justify-between text-[11px]">
											<span className="font-medium text-neutral-500">
												Tingkat keyakinan deteksi
											</span>
											<span className="font-semibold text-violet-700">
												{confidence}%
											</span>
										</div>
										<Progress value={confidence} className="h-2" />
									</div>
								)}
							</div>
						) : (
							<p className="text-sm text-neutral-500">
								Analisis deteksi AI belum tersedia untuk laporan ini.
							</p>
						)}
					</CardContent>
				</Card>

				{/* Risk assessment */}
				{risk && (
					<Card className="border-0 shadow-sm">
						<CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
							<CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
								<ShieldAlert className="size-4 text-sky-600" />
								Analisis Risiko
							</CardTitle>
							<Badge className={`ml-auto ${assessmentStatus.className}`}>
								{assessmentStatus.label}
							</Badge>
						</CardHeader>
						<CardContent className="pt-2">
							{riskLevel && risk.score != null ? (
								<div className="flex flex-wrap items-center gap-3">
									<div className="flex items-baseline gap-1">
										<span className="text-3xl font-bold tabular-nums text-neutral-900">
											{Math.round(risk.score)}
										</span>
										<span className="text-xs text-neutral-400">/100</span>
									</div>
									<Badge className={riskLevel.className}>
										{riskLevel.label}
									</Badge>
									{riskConfidence != null && (
										<span className="text-[11px] text-neutral-500">
											Confidence {riskConfidence}%
										</span>
									)}
								</div>
							) : null}

							{risk.summary && (
								<p className="mt-3 text-sm leading-6 text-neutral-600">
									{risk.summary}
								</p>
							)}

							{risk.factors?.length ? (
								<div className="mt-3">
									<p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
										Faktor Risiko
									</p>
									<ul className="mt-1.5 space-y-1">
										{risk.factors.map((factor) => (
											<li
												key={factor}
												className="flex items-start gap-1.5 text-[13px] text-neutral-600"
											>
												<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-500" />
												{factor}
											</li>
										))}
									</ul>
								</div>
							) : null}

							{risk.recommendedActions?.length ? (
								<div className="mt-3">
									<p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
										Tindakan yang disarankan
									</p>
									<ul className="mt-1.5 space-y-1">
										{risk.recommendedActions.map((action) => (
											<li
												key={action}
												className="flex items-start gap-1.5 text-[13px] text-neutral-600"
											>
												<CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
												{action}
											</li>
										))}
									</ul>
								</div>
							) : null}
						</CardContent>
					</Card>
				)}

				{/* Timeline */}
				<Card className="border-0 shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
							<History className="size-4 text-sky-600" />
							Linimasa
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-2">
						<ol className="space-y-0">
							{timeline.map((event, index) => {
								const EventIcon = event.icon;
								return (
									<li
										key={index}
										className="relative flex gap-3 pb-4 last:pb-0"
									>
										{index < timeline.length - 1 && (
											<span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-neutral-200" />
										)}
										<div className="grid size-8 shrink-0 place-items-center rounded-full bg-sky-50 text-sky-600">
											<EventIcon className="size-4" />
										</div>
										<div className="pt-1">
											<p className="text-[13px] font-medium text-neutral-800">
												{event.label}
											</p>
											<p className="text-[11px] text-neutral-500">
												{event.sub}
											</p>
										</div>
									</li>
								);
							})}
						</ol>
					</CardContent>
				</Card>

				{/* User Confirmation */}
				<Card className="border-0 shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
							<Sparkles className="size-4 text-amber-500" />
							Konfirmasi Pelapor
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-2">
						<p className="text-xs text-neutral-500">
							Tandai poin yang sudah Anda pastikan. (Tersimpan di perangkat
							Anda.)
						</p>
						<ul className="mt-3 space-y-2">
							{confirmationItems.map((item) => {
								const ItemIcon = item.icon;
								const checked = Boolean(items[item.id]);
								return (
									<li key={item.id}>
										<button
											type="button"
											onClick={() => toggle(item.id)}
											className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${checked ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-200 bg-white hover:bg-neutral-50"}`}
										>
											<div
												className={`grid size-8 shrink-0 place-items-center rounded-lg ${checked ? "bg-emerald-500 text-white" : "bg-neutral-100 text-neutral-400"}`}
											>
												{checked ? (
													<CheckCircle2 className="size-4" />
												) : (
													<ItemIcon className="size-4" />
												)}
											</div>
											<span
												className={`text-[13px] ${checked ? "font-medium text-neutral-800" : "text-neutral-600"}`}
											>
												{item.label}
											</span>
										</button>
									</li>
								);
							})}
						</ul>
					</CardContent>
				</Card>
			</div>

			{/* Lightbox */}
			{lightbox && (
				<button
					type="button"
					onClick={() => setLightbox(null)}
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
					aria-label="Tutup foto"
				>
					<img
						src={lightbox}
						alt="Pratinjau laporan"
						className="max-h-[90vh] max-w-full rounded-xl object-contain"
					/>
				</button>
			)}
		</main>
	);
}
