import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	AlertTriangle,
	Brain,
	CheckCircle2,
	ChevronDown,
	Clock,
	Clock3,
	CloudRain,
	FileQuestion,
	Flame,
	MapPin,
	Plus,
	RefreshCw,
	Search,
	ShieldAlert,
	Sparkles,
	Trash2,
	Waves,
	Wind,
	XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	type CreateReportResult,
	getMyReportsFn,
	refreshReportAssessmentFn,
} from "#/lib/reports.functions";
import type {
	RiskAssessmentStatus,
	RiskLevel,
} from "#/types/report-assessment";

export const Route = createFileRoute("/_protected/dashboard/my-reports")({
	loader: async () => {
		return await getMyReportsFn();
	},
	component: MyReportsPage,
});

type ReportStatus = "verified" | "pending" | "rejected";

type ReportAssessmentDisplay = {
	status: RiskAssessmentStatus;
	score: number | null;
	level: RiskLevel | null;
	summary: string | null;
	nearbyReportCount: number;
	attemptCount: number;
	lastAttemptAt: Date | string | null;
};

type ReportDisplay = {
	id: string;
	title: string;
	category: string;
	location: string;
	status: ReportStatus;
	date: string;
	confidence?: number;
	supportingReports?: number;
	ecolensSummary?: string;
	assessment: ReportAssessmentDisplay | null;
};

type StoredAssessment = {
	status: string;
	score: number | null;
	level: string | null;
	summary: string | null;
	nearbyReportCount: number;
	attemptCount: number;
	lastAttemptAt: Date | string | null;
};

const ASSESSMENT_RETRY_COOLDOWN_MS = 5_000;
const MAX_AUTOMATIC_ATTEMPTS = 3;

const assessmentStatusConfig: Record<
	RiskAssessmentStatus,
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

const riskLevelConfig: Record<
	RiskLevel,
	{ label: string; className: string; scoreClassName: string }
> = {
	LOW: {
		label: "Rendah",
		className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		scoreClassName: "text-emerald-700",
	},
	MODERATE: {
		label: "Sedang",
		className: "bg-amber-50 text-amber-700 ring-amber-200",
		scoreClassName: "text-amber-700",
	},
	HIGH: {
		label: "Tinggi",
		className: "bg-orange-50 text-orange-700 ring-orange-200",
		scoreClassName: "text-orange-700",
	},
	CRITICAL: {
		label: "Kritis",
		className: "bg-rose-50 text-rose-700 ring-rose-200",
		scoreClassName: "text-rose-700",
	},
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
		note: "Sedang dianalisis",
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

const categoryIconMap: Record<
	string,
	{ icon: typeof Waves; className: string }
> = {
	Banjir: { icon: Waves, className: "bg-blue-50 text-blue-500" },
	"Drainase/Banjir": { icon: Waves, className: "bg-blue-50 text-blue-500" },
	Cuaca: { icon: CloudRain, className: "bg-sky-50 text-sky-500" },
	"Kualitas Udara": { icon: Wind, className: "bg-violet-50 text-violet-500" },
	Polusi: { icon: Wind, className: "bg-violet-50 text-violet-500" },
	Sampah: { icon: Trash2, className: "bg-emerald-50 text-emerald-500" },
	Kebakaran: { icon: Flame, className: "bg-orange-50 text-orange-500" },
	"Fasilitas Rusak": {
		icon: AlertTriangle,
		className: "bg-amber-50 text-amber-500",
	},
	Lainnya: { icon: FileQuestion, className: "bg-neutral-50 text-neutral-500" },
};

function formatStatus(status: string): ReportStatus {
	if (status === "VERIFIED") return "verified";
	if (status === "REJECTED") return "rejected";
	return "pending";
}

function formatDate(dateInput: string | Date): string {
	const date = new Date(dateInput);
	return new Intl.DateTimeFormat("id-ID", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function normalizeAssessmentStatus(status: string): RiskAssessmentStatus {
	if (status === "COMPLETE" || status === "PARTIAL" || status === "FAILED") {
		return status;
	}
	return "PENDING";
}

function normalizeRiskLevel(level: string | null): RiskLevel | null {
	if (
		level === "LOW" ||
		level === "MODERATE" ||
		level === "HIGH" ||
		level === "CRITICAL"
	) {
		return level;
	}
	return null;
}

function storedAssessmentToDisplay(
	assessment: StoredAssessment | null | undefined,
): ReportAssessmentDisplay | null {
	if (!assessment) return null;

	return {
		status: normalizeAssessmentStatus(assessment.status),
		score: assessment.score,
		level: normalizeRiskLevel(assessment.level),
		summary: assessment.summary,
		nearbyReportCount: assessment.nearbyReportCount,
		attemptCount: assessment.attemptCount,
		lastAttemptAt: assessment.lastAttemptAt,
	};
}

function refreshedAssessmentToDisplay(
	result: CreateReportResult,
): ReportAssessmentDisplay {
	const storedAssessment = result.report.riskAssessment;

	return {
		status: result.assessment.status,
		score: result.assessment.risk?.score ?? storedAssessment?.score ?? null,
		level:
			result.assessment.risk?.level ??
			normalizeRiskLevel(storedAssessment?.level ?? null),
		summary:
			result.assessment.risk?.summary ?? storedAssessment?.summary ?? null,
		nearbyReportCount: result.assessment.nearbyReportCount,
		attemptCount: storedAssessment?.attemptCount ?? 0,
		lastAttemptAt: storedAssessment?.lastAttemptAt ?? null,
	};
}

function canAutomaticallyRetry(
	assessment: ReportAssessmentDisplay | null,
): boolean {
	if (
		!assessment ||
		assessment.status !== "PENDING" ||
		assessment.attemptCount >= MAX_AUTOMATIC_ATTEMPTS
	) {
		return false;
	}

	if (!assessment.lastAttemptAt) return true;

	const lastAttemptTime = new Date(assessment.lastAttemptAt).getTime();
	return (
		!Number.isFinite(lastAttemptTime) ||
		Date.now() - lastAttemptTime >= ASSESSMENT_RETRY_COOLDOWN_MS
	);
}

function normalizeScore(score: number): number {
	return Math.round(Math.min(100, Math.max(0, score)));
}

const filters = ["Semua", "Menunggu Verifikasi", "Terverifikasi", "Ditolak"];

function MyReportsPage() {
	const dbReports = Route.useLoaderData();
	const refreshReportAssessment = useServerFn(refreshReportAssessmentFn);
	const retryLocksRef = useRef(new Set<string>());
	const automaticRetriesRef = useRef(new Set<string>());
	const [activeFilter, setActiveFilter] = useState("Semua");
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
	const [assessmentOverrides, setAssessmentOverrides] = useState<
		Record<string, ReportAssessmentDisplay>
	>({});
	const [refreshingReportIds, setRefreshingReportIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [assessmentErrors, setAssessmentErrors] = useState<
		Record<string, string | null>
	>({});

	const reports: ReportDisplay[] = (dbReports || []).map((item) => ({
		id: item.id,
		title: item.title,
		category: item.category,
		location: item.locationName,
		status: formatStatus(item.status),
		date: formatDate(item.createdAt),
		confidence: item.ecolensAnalysis?.confidence
			? Math.round(item.ecolensAnalysis.confidence * 100)
			: undefined,
		ecolensSummary: item.ecolensAnalysis?.summary,
		assessment:
			assessmentOverrides[item.id] ??
			storedAssessmentToDisplay(item.riskAssessment),
	}));

	const refreshAssessment = async (reportId: string) => {
		if (retryLocksRef.current.has(reportId)) return;

		retryLocksRef.current.add(reportId);
		setRefreshingReportIds((current) => new Set(current).add(reportId));
		setAssessmentErrors((current) => ({ ...current, [reportId]: null }));

		try {
			const result = await refreshReportAssessment({ data: { reportId } });
			setAssessmentOverrides((current) => ({
				...current,
				[reportId]: refreshedAssessmentToDisplay(result),
			}));
		} catch (error) {
			console.error("[MyReports] Gagal memperbarui analisis risiko:", error);
			setAssessmentErrors((current) => ({
				...current,
				[reportId]:
					"Analisis belum dapat diperbarui. Tunggu sebentar lalu coba lagi.",
			}));
		} finally {
			retryLocksRef.current.delete(reportId);
			setRefreshingReportIds((current) => {
				const next = new Set(current);
				next.delete(reportId);
				return next;
			});
		}
	};

	const toggleAssessment = (report: ReportDisplay) => {
		const willOpen = expandedReportId !== report.id;
		setExpandedReportId(willOpen ? report.id : null);

		if (
			willOpen &&
			canAutomaticallyRetry(report.assessment) &&
			!automaticRetriesRef.current.has(report.id)
		) {
			automaticRetriesRef.current.add(report.id);
			void refreshAssessment(report.id);
		}
	};

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
			<div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
				{/* Kolom Kiri */}
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
						{filteredReports.length > 0 ? (
							<>
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

								<div className="flex flex-col divide-y divide-neutral-100">
									{filteredReports.map((report) => {
										const status = statusConfig[report.status];
										const StatusIcon = status.icon;
										const categoryData =
											categoryIconMap[report.category] ||
											categoryIconMap.Lainnya;
										const CategoryIcon = categoryData.icon;
										const assessment = report.assessment;
										const assessmentMeta = assessment
											? assessmentStatusConfig[assessment.status]
											: null;
										const riskTone = assessment?.level
											? riskLevelConfig[assessment.level]
											: null;
										const isExpanded = expandedReportId === report.id;
										const isRefreshing = refreshingReportIds.has(report.id);
										const assessmentError = assessmentErrors[report.id];
										const assessmentRegionId = `risk-assessment-${report.id}`;
										const assessmentControlId = `risk-assessment-control-${report.id}`;

										return (
											<article
												key={report.id}
												className="group transition-colors hover:bg-neutral-50/70"
											>
												<div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
													<div
														className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${categoryData.className}`}
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
														</div>
													</div>

													<div className="flex shrink-0 items-center justify-between gap-3 self-stretch sm:self-auto">
														<div className="text-left sm:text-right">
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
															id={assessmentControlId}
															type="button"
															aria-expanded={isExpanded}
															aria-controls={assessmentRegionId}
															onClick={() => toggleAssessment(report)}
															className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 text-[10px] font-semibold text-sky-700 outline-none transition-colors hover:border-sky-300 hover:bg-sky-100 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
														>
															<ShieldAlert
																className="size-3.5"
																aria-hidden="true"
															/>
															Analisis risiko
															<ChevronDown
																className={`size-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
																aria-hidden="true"
															/>
														</button>
													</div>
												</div>

												{isExpanded && (
													<section
														id={assessmentRegionId}
														aria-labelledby={assessmentControlId}
														aria-live="polite"
														className="border-t border-neutral-100 bg-[linear-gradient(135deg,rgba(240,249,255,.72),rgba(255,255,255,.92))] px-4 py-3.5"
													>
														<div className="rounded-xl border border-sky-100 bg-white p-3.5 shadow-xs">
															<div className="flex flex-wrap items-center justify-between gap-2">
																<div className="flex items-center gap-2">
																	<div className="grid size-7 place-items-center rounded-lg bg-sky-50 text-sky-700">
																		<Sparkles
																			className="size-3.5"
																			aria-hidden="true"
																		/>
																	</div>
																	<div>
																		<p className="text-[11px] font-semibold text-neutral-900">
																			Analisis risiko kontekstual
																		</p>
																		{assessment && (
																			<p className="text-[9px] text-neutral-400">
																				{assessment.nearbyReportCount} laporan
																				aktif di sekitar
																			</p>
																		)}
																	</div>
																</div>

																{assessmentMeta && (
																	<span
																		className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ring-1 ring-inset ${assessmentMeta.className}`}
																	>
																		{assessmentMeta.label}
																	</span>
																)}
															</div>

															{isRefreshing && (
																<div className="mt-3 flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-[10px] font-semibold text-sky-700">
																	<RefreshCw
																		className="size-3 animate-spin"
																		aria-hidden="true"
																	/>
																	Memperbarui analisis dari kondisi terbaru...
																</div>
															)}

															{assessment?.score !== null &&
															assessment?.score !== undefined &&
															assessment.summary &&
															riskTone ? (
																<div className="mt-3 grid gap-3 sm:grid-cols-[6rem_1fr]">
																	<div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
																		<p className="text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400">
																			Skor risiko
																		</p>
																		<p
																			className={`mt-1 font-mono text-2xl font-bold leading-none tabular-nums ${riskTone.scoreClassName}`}
																		>
																			{normalizeScore(assessment.score)}
																			<span className="ml-0.5 text-[9px] font-medium text-neutral-400">
																				/100
																			</span>
																		</p>
																		<span
																			className={`mt-2 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset ${riskTone.className}`}
																		>
																			{riskTone.label}
																		</span>
																	</div>
																	<div className="min-w-0">
																		<p className="text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400">
																			Ringkasan
																		</p>
																		<p className="mt-1 text-[11px] leading-5 text-neutral-600">
																			{assessment.summary}
																		</p>
																		{assessment.status === "PARTIAL" && (
																			<p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-700">
																				<AlertTriangle
																					className="size-3"
																					aria-hidden="true"
																				/>
																				Sebagian sumber lingkungan belum
																				tersedia.
																			</p>
																		)}
																	</div>
																</div>
															) : (
																!isRefreshing && (
																	<p className="mt-3 text-[11px] leading-5 text-neutral-500">
																		{assessment?.status === "FAILED"
																			? "Analisis risiko belum berhasil dibuat. Laporan Anda tetap tersimpan dan dapat dianalisis kembali."
																			: assessment?.status === "PENDING"
																				? "Analisis risiko masih menunggu data lingkungan atau respons layanan AI."
																				: "Analisis risiko belum tersedia untuk laporan ini."}
																	</p>
																)
															)}

															{assessmentError && (
																<p
																	className="mt-2 text-[10px] font-medium text-rose-600"
																	role="alert"
																>
																	{assessmentError}
																</p>
															)}

															{assessment?.status === "FAILED" && (
																<Button
																	type="button"
																	variant="outline"
																	disabled={isRefreshing}
																	onClick={() =>
																		void refreshAssessment(report.id)
																	}
																	className="mt-3 h-8 rounded-lg border-sky-200 px-3 text-[10px] font-semibold text-sky-700 hover:bg-sky-50 hover:text-sky-800"
																>
																	<RefreshCw
																		className={`size-3 ${isRefreshing ? "animate-spin" : ""}`}
																		aria-hidden="true"
																	/>
																	{isRefreshing
																		? "Mencoba kembali..."
																		: "Coba analisis lagi"}
																</Button>
															)}
														</div>
													</section>
												)}
											</article>
										);
									})}
								</div>
							</>
						) : (
							<div className="flex flex-col items-center justify-center p-12 text-center">
								<div className="grid size-12 place-items-center rounded-full bg-neutral-100 text-neutral-400">
									<Plus className="size-6" />
								</div>
								<h3 className="mt-3 text-sm font-semibold text-neutral-900">
									Belum Ada Laporan
								</h3>
								<p className="mt-1 max-w-xs text-xs text-neutral-500">
									Anda belum memiliki laporan yang tersimpan. Gunakan EcoLens
									untuk membuat laporan pertama Anda.
								</p>
								<Button
									render={<Link to="/dashboard/report" />}
									className="mt-4 gap-2 bg-sky-500 text-white hover:bg-sky-600 text-xs h-8"
								>
									<Plus className="size-3.5" />
									Mulai dengan EcoLens
								</Button>
							</div>
						)}
					</div>
				</div>

				{/* Kolom Kanan */}
				<div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2.5 lg:w-1/3">
					{/* Card Putih 1: Tombol Laporan */}
					<div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-xs">
						<div className="flex items-center gap-3">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-500">
								<Brain className="size-5" />
							</div>
							<div>
								<h3 className="text-sm font-semibold text-neutral-900">
									Buat Laporan Cerdas
								</h3>
								<p className="text-xs text-neutral-500">
									Deteksi otomatis dengan EcoLens
								</p>
							</div>
						</div>
						<Button
							render={<Link to="/dashboard/report" />}
							variant="default"
							className="mt-1 w-full gap-2 font-medium bg-sky-500 hover:bg-sky-600 text-white"
						>
							<Plus className="size-4" />
							Buat Laporan Baru
						</Button>
					</div>

					{/* Card Putih 2: Ringkasan Statistik */}
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
