import { Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	CheckCircle2,
	Clock3,
	Leaf,
	MapPin,
	RefreshCw,
	RotateCcw,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import type { CreateReportResult } from "#/lib/reports.functions";
import type { RiskLevel } from "#/types/report-assessment";

const AUTO_RETRY_DELAY_MS = 5_500;

const HORIZON_META = [
	{ key: "24H", label: "24 jam", caption: "Respons cepat" },
	{ key: "72H", label: "72 jam", caption: "Perkembangan" },
	{ key: "7D", label: "7 hari", caption: "Dampak lanjutan" },
] as const;

const RISK_TONES: Record<
	RiskLevel,
	{
		label: string;
		badge: string;
		score: string;
		border: string;
	}
> = {
	LOW: {
		label: "Rendah",
		badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		score: "text-emerald-700",
		border: "border-emerald-200",
	},
	MODERATE: {
		label: "Sedang",
		badge: "bg-amber-50 text-amber-700 ring-amber-200",
		score: "text-amber-700",
		border: "border-amber-200",
	},
	HIGH: {
		label: "Tinggi",
		badge: "bg-orange-50 text-orange-700 ring-orange-200",
		score: "text-orange-700",
		border: "border-orange-200",
	},
	CRITICAL: {
		label: "Kritis",
		badge: "bg-rose-50 text-rose-700 ring-rose-200",
		score: "text-rose-700",
		border: "border-rose-200",
	},
};

type RetryMode = "automatic" | "manual";
type AutoRetryPhase = "idle" | "scheduled" | "running" | "done";

type EcoLensSuccessDialogProps = {
	open: boolean;
	result: CreateReportResult | null;
	onCreateAnother: () => void;
	onRefreshAssessment: (reportId: string) => Promise<CreateReportResult>;
};

function normalizeScore(score: number) {
	return Math.round(Math.min(100, Math.max(0, score)));
}

function RiskLevelBadge({ level }: { level: RiskLevel }) {
	const tone = RISK_TONES[level];
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ring-inset ${tone.badge}`}
		>
			{tone.label}
		</span>
	);
}

export function EcoLensSuccessDialog({
	open,
	result,
	onCreateAnother,
	onRefreshAssessment,
}: EcoLensSuccessDialogProps) {
	const refreshHandlerRef = useRef(onRefreshAssessment);
	const automaticReportRef = useRef<string | null>(null);
	const retryLockRef = useRef(false);
	const [autoRetryPhase, setAutoRetryPhase] = useState<AutoRetryPhase>("idle");
	const [retryMode, setRetryMode] = useState<RetryMode | null>(null);
	const [retryError, setRetryError] = useState<string | null>(null);

	useEffect(() => {
		refreshHandlerRef.current = onRefreshAssessment;
	}, [onRefreshAssessment]);

	const runRefresh = useCallback(async (reportId: string, mode: RetryMode) => {
		if (retryLockRef.current) return;

		retryLockRef.current = true;
		setRetryMode(mode);
		setRetryError(null);
		if (mode === "automatic") setAutoRetryPhase("running");

		try {
			await refreshHandlerRef.current(reportId);
		} catch (error) {
			console.error("[EcoLens] Gagal memperbarui analisis risiko:", error);
			setRetryError(
				"Analisis belum dapat diperbarui. Tunggu sebentar lalu coba kembali.",
			);
		} finally {
			retryLockRef.current = false;
			setRetryMode(null);
			if (mode === "automatic") setAutoRetryPhase("done");
		}
	}, []);

	const reportId = result?.report.id ?? null;
	const assessmentStatus = result?.assessment.status ?? null;

	useEffect(() => {
		if (!open) {
			automaticReportRef.current = null;
			setAutoRetryPhase("idle");
			setRetryMode(null);
			setRetryError(null);
			return;
		}

		if (
			!reportId ||
			assessmentStatus !== "PENDING" ||
			automaticReportRef.current === reportId
		) {
			return;
		}

		automaticReportRef.current = reportId;
		setAutoRetryPhase("scheduled");
		const retryTimer = window.setTimeout(() => {
			void runRefresh(reportId, "automatic");
		}, AUTO_RETRY_DELAY_MS);

		return () => window.clearTimeout(retryTimer);
	}, [assessmentStatus, open, reportId, runRefresh]);

	const assessment = result?.assessment ?? null;
	const risk = assessment?.risk ?? null;
	const isRefreshing = retryMode !== null;
	const canRetryManually =
		assessment?.status === "FAILED" ||
		(assessment?.status === "PENDING" && autoRetryPhase === "done");

	return (
		<Dialog open={open}>
			<DialogContent
				showCloseButton={false}
				className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto bg-white p-0 text-neutral-900 ring-1 ring-neutral-200 sm:max-w-2xl"
			>
				<div className="relative overflow-hidden border-b border-neutral-100 bg-[linear-gradient(135deg,#f8fffc_0%,#f7fbff_55%,#fff_100%)] px-5 py-5 sm:px-6">
					<div
						className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full border-[24px] border-sky-100/45"
						aria-hidden="true"
					/>
					<div className="relative flex items-start gap-3.5">
						<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-[0_8px_22px_rgba(5,150,105,.2)]">
							<CheckCircle2 className="size-5" aria-hidden="true" />
						</div>
						<DialogHeader className="min-w-0 flex-1 text-left">
							<div className="flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-inset ring-emerald-200">
									<Leaf className="size-3" aria-hidden="true" />
									Laporan tersimpan
								</span>
								{assessment?.status === "COMPLETE" && (
									<span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
										<ShieldCheck className="size-3" aria-hidden="true" />
										Analisis lengkap
									</span>
								)}
							</div>
							<DialogTitle className="mt-1.5 text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
								Laporan berhasil dikirim
							</DialogTitle>
							<DialogDescription className="max-w-xl text-xs leading-5 text-neutral-500">
								Laporan sudah aman tersimpan. Kondisi sekitar turut dianalisis
								untuk membantu menentukan risiko penanganan.
							</DialogDescription>
						</DialogHeader>
					</div>
				</div>

				<div className="space-y-3 bg-neutral-50/55 px-5 py-4 sm:px-6">
					{!result && (
						<div
							className="flex items-center gap-3 rounded-xl border border-sky-100 bg-white p-4 text-neutral-600"
							aria-live="polite"
						>
							<RefreshCw className="size-4 animate-spin text-sky-600" />
							<span className="text-xs font-medium">
								Menyiapkan hasil laporan...
							</span>
						</div>
					)}

					{assessment?.status === "PARTIAL" && (
						<div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-3 text-amber-900">
							<AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
							<div>
								<p className="text-xs font-semibold">
									Sebagian data lingkungan belum tersedia
								</p>
								<p className="mt-0.5 text-[11px] leading-4 text-amber-800">
									Analisis tetap dibuat dari sumber yang berhasil dikumpulkan
									{assessment.providerErrors.length > 0
										? ` (${assessment.providerErrors.length} sumber terkendala).`
										: "."}
								</p>
							</div>
						</div>
					)}

					{assessment &&
						(assessment.status === "PENDING" ||
							assessment.status === "FAILED") && (
							<div
								className="rounded-xl border border-sky-200 bg-white p-4 shadow-xs"
								aria-live="polite"
							>
								<div className="flex items-start gap-3">
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700">
										{assessment.status === "PENDING" ? (
											<Clock3 className="size-4" aria-hidden="true" />
										) : (
											<AlertTriangle className="size-4" aria-hidden="true" />
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs font-semibold text-neutral-900">
											{assessment.status === "PENDING"
												? "Analisis risiko sedang dilengkapi"
												: "Analisis risiko belum tersedia"}
										</p>
										<p className="mt-1 text-[11px] leading-4 text-neutral-500">
											Laporan tetap berhasil tersimpan dan dapat dilihat di
											halaman laporan Anda.
										</p>
										{assessment.status === "PENDING" &&
											(autoRetryPhase === "scheduled" ||
												autoRetryPhase === "running") && (
												<div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-sky-700">
													<RefreshCw
														className={`size-3 ${autoRetryPhase === "running" ? "animate-spin" : ""}`}
														aria-hidden="true"
													/>
													{autoRetryPhase === "running"
														? "Memperbarui analisis..."
														: "Akan dicoba kembali secara otomatis"}
												</div>
											)}
									</div>
								</div>
							</div>
						)}

					{risk && (
						<section
							className={`overflow-hidden rounded-xl border bg-white shadow-xs ${RISK_TONES[risk.level].border}`}
							aria-labelledby="ecolens-risk-heading"
						>
							<div className="grid sm:grid-cols-[8rem_1fr]">
								<div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/70 px-4 py-3 sm:block sm:border-b-0 sm:border-r sm:py-4">
									<div>
										<p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
											Skor risiko
										</p>
										<p
											className={`mt-0.5 font-mono text-3xl font-bold leading-none tabular-nums ${RISK_TONES[risk.level].score}`}
										>
											{normalizeScore(risk.score)}
											<span className="ml-0.5 text-[10px] font-medium text-neutral-400">
												/100
											</span>
										</p>
									</div>
									<div className="sm:mt-2.5">
										<RiskLevelBadge level={risk.level} />
										<p className="mt-1 text-[9px] text-neutral-400">
											Keyakinan {Math.round(risk.confidence * 100)}%
										</p>
									</div>
								</div>

								<div className="px-4 py-3.5 sm:px-5">
									<div className="flex items-center gap-1.5">
										<Sparkles
											className="size-3.5 text-sky-600"
											aria-hidden="true"
										/>
										<h2
											id="ecolens-risk-heading"
											className="text-xs font-semibold text-neutral-950"
										>
											Analisis risiko kontekstual
										</h2>
									</div>
									<p className="mt-1.5 text-xs leading-5 text-neutral-600">
										{risk.summary}
									</p>

									{risk.factors.length > 0 && (
										<div className="mt-3 border-t border-neutral-100 pt-2.5">
											<p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
												Faktor utama
											</p>
											<ul className="mt-1.5 grid gap-1.5 text-[11px] leading-4 text-neutral-600 sm:grid-cols-3">
												{[...new Set(risk.factors)]
													.slice(0, 3)
													.map((factor) => (
														<li
															key={factor}
															className="flex items-start gap-1.5"
														>
															<span
																className="mt-1.5 size-1 shrink-0 rounded-full bg-sky-500"
																aria-hidden="true"
															/>
															<span>{factor}</span>
														</li>
													))}
											</ul>
										</div>
									)}
								</div>
							</div>

							<div className="grid border-t border-neutral-100 sm:grid-cols-3 sm:divide-x sm:divide-neutral-100">
								{HORIZON_META.map((item) => {
									const horizon = risk.horizons[item.key];
									return (
										<div
											key={item.key}
											className="border-b border-neutral-100 px-3.5 py-3 last:border-b-0 sm:border-b-0"
										>
											<div className="flex items-start justify-between gap-2">
												<div>
													<p className="text-[10px] font-bold text-neutral-800">
														{item.label}
													</p>
													<p className="text-[9px] text-neutral-400">
														{item.caption}
													</p>
												</div>
												<div className="text-right">
													<span className="font-mono text-xs font-bold tabular-nums text-neutral-700">
														{normalizeScore(horizon.score)}
													</span>
													<p
														className={`text-[8px] font-bold uppercase tracking-wide ${RISK_TONES[horizon.level].score}`}
													>
														{RISK_TONES[horizon.level].label}
													</p>
												</div>
											</div>
											<p className="mt-1.5 text-[10px] leading-4 text-neutral-500">
												{horizon.summary}
											</p>
										</div>
									);
								})}
							</div>
						</section>
					)}

					{assessment && (
						<div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5">
							<div className="flex min-w-0 items-center gap-2 text-[11px] text-neutral-600">
								<MapPin
									className="size-3.5 shrink-0 text-sky-600"
									aria-hidden="true"
								/>
								<span>
									<strong className="font-semibold text-neutral-900">
										{assessment.nearbyReportCount}
									</strong>{" "}
									laporan aktif di sekitar digunakan sebagai konteks
								</span>
							</div>
							{assessment.incidentClusterId && (
								<span className="hidden shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[9px] text-neutral-500 sm:inline">
									Insiden terkait
								</span>
							)}
						</div>
					)}

					{retryError && (
						<p
							className="text-center text-[11px] font-medium text-rose-600"
							role="alert"
						>
							{retryError}
						</p>
					)}

					{canRetryManually && result && (
						<div className="flex justify-center">
							<Button
								type="button"
								variant="outline"
								disabled={isRefreshing}
								onClick={() => void runRefresh(result.report.id, "manual")}
								className="h-8 rounded-lg border-sky-200 bg-white px-3 text-[11px] font-semibold text-sky-700 hover:bg-sky-50 hover:text-sky-800"
							>
								<RefreshCw
									className={`size-3.5 ${retryMode === "manual" ? "animate-spin" : ""}`}
								/>
								{retryMode === "manual"
									? "Mencoba analisis..."
									: "Coba analisis lagi"}
							</Button>
						</div>
					)}
				</div>

				<DialogFooter className="grid gap-2 border-t border-neutral-100 bg-white px-5 pb-5 pt-4 sm:grid-cols-2 sm:px-6">
					<Button
						type="button"
						variant="outline"
						onClick={onCreateAnother}
						className="h-9 rounded-lg border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
					>
						<RotateCcw className="size-3.5" />
						Buat Laporan Baru
					</Button>
					<Button
						render={<Link to="/dashboard/my-reports" />}
						className="h-9 rounded-lg bg-sky-600 font-medium text-white hover:bg-sky-700"
					>
						Lihat Laporan Saya
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
