import {
	BadgeCheck,
	Camera,
	Clock3,
	LockKeyhole,
	MapPinCheck,
	Users,
} from "lucide-react";
import { useState } from "react";
import { ReportResolutionDialog } from "#/components/ReportResolutionDialog";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { ReportResolutionSummary } from "#/types/report-resolution";

type ReportResolutionCardProps = {
	reportId: string;
	reportLatitude: number | null;
	reportLongitude: number | null;
	resolution: ReportResolutionSummary;
	onViewImage: (image: string) => void;
};

function formatValidationDate(value: Date | string): string {
	return new Date(value).toLocaleString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function ReportResolutionCard({
	reportId,
	reportLatitude,
	reportLongitude,
	resolution,
	onViewImage,
}: ReportResolutionCardProps) {
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<>
			<Card className="overflow-hidden border-0 shadow-sm">
				<div className="h-1 bg-linear-to-r from-emerald-500 via-teal-400 to-sky-400" />
				<CardHeader className="pb-2">
					<div>
						<CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
							<Users className="size-4 text-emerald-600" />
							Validasi Penyelesaian Komunitas
						</CardTitle>
						<p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
							Bukti kondisi terbaru dari observasi komunitas.
						</p>
					</div>
				</CardHeader>
				<CardContent className="pt-2">
					<div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
						<div className="flex items-center gap-3">
							<div className="grid size-10 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-neutral-900">
								{resolution.isResolved ? (
									<BadgeCheck className="size-5" />
								) : (
									<MapPinCheck className="size-5" />
								)}
							</div>
							<div>
								<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
									{resolution.validCount} validasi terselesaikan
								</p>
								<p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
									{resolution.isResolved
										? "Kondisi telah dikonfirmasi oleh komunitas."
										: "Bukti lapangan telah diterima dari komunitas."}
								</p>
							</div>
						</div>
					</div>

					{resolution.validations.length > 0 ? (
						<div className="mt-4 space-y-3">
							{resolution.validations.map((validation, index) => (
								<article
									key={validation.id}
									className="grid gap-3 rounded-2xl border border-neutral-200 p-3 sm:grid-cols-[7rem_1fr] dark:border-neutral-800"
								>
									<button
										type="button"
										onClick={() => onViewImage(validation.image)}
										className="group relative aspect-video overflow-hidden rounded-xl bg-neutral-100 sm:aspect-square"
									>
										<img
											src={validation.image}
											alt={`Bukti penyelesaian ${index + 1}`}
											className="h-full w-full object-cover transition-transform group-hover:scale-105"
										/>
										<span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-white">
											Bukti {index + 1}
										</span>
									</button>
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<Avatar className="size-7">
												<AvatarImage
													src={validation.user.image ?? undefined}
													alt={validation.user.name}
												/>
												<AvatarFallback className="bg-emerald-100 text-[9px] font-bold text-emerald-700">
													{validation.user.name.slice(0, 2).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
												{validation.user.name}
											</span>
											<span className="inline-flex items-center gap-1 text-[10px] text-neutral-400">
												<Clock3 className="size-3" />
												{formatValidationDate(validation.createdAt)}
											</span>
										</div>
										<p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
											{validation.description}
										</p>
										<div className="mt-2 flex flex-wrap gap-2 text-[10px] text-neutral-500">
											<span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
												{Math.round(validation.distanceMeters)} m dari laporan
											</span>
											<span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
												Lolos pemeriksaan EcoLens
											</span>
										</div>
									</div>
								</article>
							))}
						</div>
					) : null}

					<div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
						{resolution.viewerCanValidate ? (
							<p className="text-[11px] text-neutral-500">
								Kamu berada di lapangan? Bantu komunitas memastikan kondisinya.
							</p>
						) : (
							<p className="flex items-start gap-1.5 text-[11px] text-neutral-500">
								<LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
								{resolution.viewerBlockReason}
							</p>
						)}
						{resolution.viewerCanValidate ? (
							<Button
								type="button"
								onClick={() => setDialogOpen(true)}
								className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
							>
								<Camera className="size-3.5" />
								Laporkan sudah terselesaikan
							</Button>
						) : null}
					</div>
				</CardContent>
			</Card>

			{resolution.viewerCanValidate &&
			typeof reportLatitude === "number" &&
			typeof reportLongitude === "number" ? (
				<ReportResolutionDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					reportId={reportId}
					reportLatitude={reportLatitude}
					reportLongitude={reportLongitude}
				/>
			) : null}
		</>
	);
}
