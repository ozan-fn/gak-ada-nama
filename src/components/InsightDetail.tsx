import {
	ArrowLeft,
	ArrowRight,
	Clock,
	FileText,
	MapPin,
	ShieldAlert,
	Target,
	TrendingUp,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { InsightDetailView } from "#/lib/insight.functions";

type InsightDetailProps = {
	insight: InsightDetailView;
};

function timeAgo(date: Date): string {
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
	if (seconds < 60) return "baru saja";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} menit lalu`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} jam lalu`;
	const days = Math.floor(hours / 24);
	return `${days} hari lalu`;
}

const categoryColors: Record<string, string> = {
	Sampah: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
	"Drainase/Banjir": "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
	Polusi: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
	Kebakaran: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
	"Fasilitas Rusak": "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
};

const statusLabels: Record<string, string> = {
	PENDING: "Menunggu",
	VERIFIED: "Tervalidasi",
	IN_PROGRESS: "Diproses",
	RESOLVED: "Selesai",
	REJECTED: "Ditolak",
};

export default function InsightDetail({ insight }: InsightDetailProps) {
	const navigate = useNavigate();

	const scoreColor =
		insight.impactScore >= 70
			? "text-red-600"
			: insight.impactScore >= 40
				? "text-amber-600"
				: "text-emerald-600";

	const scoreBg =
		insight.impactScore >= 70
			? "border-red-200 dark:border-red-900"
			: insight.impactScore >= 40
				? "border-amber-200 dark:border-amber-900"
				: "border-emerald-200 dark:border-emerald-900";

	return (
		<main className="min-h-screen">
			<div className="mx-auto max-w-4xl p-4 lg:p-6">
				{/* Back button */}
				<Link
					to="/dashboard/insights"
					className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
				>
					<ArrowLeft className="size-4" />
					Kembali ke Insight
				</Link>

				{/* Header */}
				<div className="mb-6">
					<div className="flex flex-wrap items-center gap-2 mb-3">
						<span
							className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
								insight.impact === "Tinggi"
									? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
									: insight.impact === "Sedang"
										? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
										: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
							}`}
						>
							<ShieldAlert className="size-3" />
							Dampak {insight.impact}
						</span>
						<span className="text-xs text-neutral-400">
							prioritas #{1}
						</span>
						<span
							className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
								categoryColors[insight.category] ?? "bg-neutral-100 text-neutral-600"
							}`}
						>
							{insight.category}
						</span>
					</div>

					<h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 lg:text-3xl">
						{insight.title}
					</h1>

					<div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
						<span className="flex items-center gap-1.5">
							<MapPin className="size-4" />
							{insight.locationName}
						</span>
						<span className="flex items-center gap-1.5">
							<Clock className="size-4" />
							{timeAgo(insight.generatedAt)}
						</span>
					</div>
				</div>

				{/* Stats bar */}
				<div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
						<p className="text-xs text-neutral-500">Laporan</p>
						<p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
							{insight.reportCount}
						</p>
					</div>
					<div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
						<p className="text-xs text-neutral-500">Tervalidasi</p>
						<p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
							{insight.validatedCount}
						</p>
					</div>
					<div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
						<p className="text-xs text-neutral-500">Jangkauan</p>
						<p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
							{insight.affectedRadiusKm ?? "-"} km
						</p>
					</div>
					<div className={`rounded-xl border bg-white p-4 dark:bg-neutral-900 ${scoreBg}`}>
						<p className="text-xs text-neutral-500">Impact Score</p>
						<p className={`mt-1 text-2xl font-semibold ${scoreColor}`}>
							{insight.impactScore}
						</p>
					</div>
				</div>

				{/* Trend indicator */}
				<div className="mb-6 flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/50">
					<TrendingUp
						className={`size-4 ${
							insight.trend === "up"
								? "text-red-500"
								: insight.trend === "down"
									? "text-emerald-500"
									: "text-neutral-400"
						}`}
					/>
					<span className="text-sm text-neutral-600 dark:text-neutral-300">
						Tren:{" "}
						<span className="font-medium">
							{insight.trend === "up"
								? "Meningkat"
								: insight.trend === "down"
									? "Menurun"
									: "Stabil"}
						</span>
					</span>
				</div>

				{/* AI Summary */}
				<div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
					<div className="flex items-center gap-2 mb-3">
						<ShieldAlert className="size-4 text-neutral-400" />
						<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
							Deskripsi Insight
						</h2>
					</div>
					<p className="text-sm leading-7 text-neutral-600 dark:text-neutral-400">
						{insight.summary}
					</p>
				</div>

				{/* Why risks increasing */}
				{insight.whyRisks.length > 0 && (
					<div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
						<div className="flex items-center gap-2 mb-3">
							<Target className="size-4 text-neutral-400" />
							<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
								Mengapa risiko ini meningkat?
							</h2>
						</div>
						<ul className="space-y-2">
							{insight.whyRisks.map((reason, i) => (
								<li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
									<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neutral-400" />
									{reason}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Potential impacts */}
				{insight.potentialImpacts.length > 0 && (
					<div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
						<div className="flex items-center gap-2 mb-3">
							<ShieldAlert className="size-4 text-neutral-400" />
							<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
								Dampak yang Berpotensi Terjadi
							</h2>
						</div>
						<ul className="space-y-2">
							{insight.potentialImpacts.map((impact, i) => (
								<li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
									<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
									{impact}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Contributing factors */}
				{insight.factors.length > 0 && (
					<div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
						<div className="flex items-center gap-2 mb-3">
							<TrendingUp className="size-4 text-neutral-400" />
							<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
								Faktor Penyebab
							</h2>
						</div>
						<ul className="space-y-2">
							{insight.factors.map((factor, i) => (
								<li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
									<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
									{factor}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Supporting reports */}
				{insight.reports.length > 0 && (
					<div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
						<div className="flex items-center gap-2 mb-3">
							<FileText className="size-4 text-neutral-400" />
							<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
								Laporan Pendukung ({insight.reports.length})
							</h2>
						</div>
						<div className="space-y-2">
							{insight.reports.map((report) => (
								<button
									key={report.id}
									type="button"
									onClick={() =>
										navigate({
											to: "/dashboard/report-detail/$reportId",
											params: { reportId: report.id },
										})
									}
									className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:border-neutral-700"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
											{report.title}
										</p>
										<div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-400">
											<span>{report.category}</span>
											<span>·</span>
											<span>{report.urgency}</span>
											<span>·</span>
											<span>{statusLabels[report.status] ?? report.status}</span>
										</div>
									</div>
									<ArrowRight className="size-4 shrink-0 text-neutral-400" />
								</button>
							))}
						</div>
					</div>
				)}

				{/* Action: View on risk map */}
				<div className="flex justify-end">
					<Link
						to="/dashboard/risk-map"
						search={{
							lat: insight.centerLatitude,
							lng: insight.centerLongitude,
							city: insight.locationName,
						}}
						className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-500/20 transition-colors hover:bg-sky-400 hover:shadow-sky-500/30"
					>
						Lihat di Peta Risiko
						<ArrowRight className="size-4" />
					</Link>
				</div>
			</div>
		</main>
	);
}
