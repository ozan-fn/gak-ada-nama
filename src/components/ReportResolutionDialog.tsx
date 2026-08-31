import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	AlertTriangle,
	Camera,
	CheckCircle2,
	LoaderCircle,
	LocateFixed,
	RefreshCcw,
	ScanSearch,
	Upload,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { processUploadedImage } from "#/components/ecolens/imageUtils";
import { useEcoLensCamera } from "#/components/ecolens/useEcoLensCamera";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import {
	analyzeResolutionEvidenceFn,
	submitResolutionValidationFn,
} from "#/lib/report-resolution.functions";
import { REPORT_RESOLUTION_MAX_DISTANCE_METERS } from "#/types/report-resolution";

type ResolutionStage =
	| "camera"
	| "analyzing"
	| "locating"
	| "form"
	| "rejected"
	| "error"
	| "submitting";

type ReportResolutionDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reportId: string;
	reportLatitude: number;
	reportLongitude: number;
};

type Coordinates = {
	latitude: number;
	longitude: number;
	accuracy: number;
};

function distanceMeters(
	latitudeA: number,
	longitudeA: number,
	latitudeB: number,
	longitudeB: number,
): number {
	const earthRadiusMeters = 6_371_000;
	const toRadians = (value: number) => (value * Math.PI) / 180;
	const latitudeDelta = toRadians(latitudeB - latitudeA);
	const longitudeDelta = toRadians(longitudeB - longitudeA);
	const startLatitude = toRadians(latitudeA);
	const endLatitude = toRadians(latitudeB);
	const haversine =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.cos(startLatitude) *
			Math.cos(endLatitude) *
			Math.sin(longitudeDelta / 2) ** 2;
	return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

function requestCurrentLocation(): Promise<Coordinates> {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error("Browser ini tidak mendukung GPS."));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
					accuracy: position.coords.accuracy,
				});
			},
			(error) => {
				if (error.code === error.PERMISSION_DENIED) {
					reject(
						new Error(
							"Izin lokasi ditolak. Aktifkan GPS untuk memvalidasi kondisi di lapangan.",
						),
					);
					return;
				}
				reject(
					new Error("Lokasi tidak dapat ditemukan. Coba aktifkan GPS kembali."),
				);
			},
			{ enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
		);
	});
}

export function ReportResolutionDialog({
	open,
	onOpenChange,
	reportId,
	reportLatitude,
	reportLongitude,
}: ReportResolutionDialogProps) {
	const router = useRouter();
	const analyzeEvidence = useServerFn(analyzeResolutionEvidenceFn);
	const submitValidation = useServerFn(submitResolutionValidationFn);
	const camera = useEcoLensCamera();
	const mountedRef = useRef(false);
	const uploadInputRef = useRef<HTMLInputElement | null>(null);
	const [stage, setStage] = useState<ResolutionStage>("camera");
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [evidenceToken, setEvidenceToken] = useState<string | null>(null);
	const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
	const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
	const [distance, setDistance] = useState<number | null>(null);
	const [description, setDescription] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [guidance, setGuidance] = useState<string | null>(null);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (!open) {
			camera.stopCamera();
			return;
		}

		setStage("camera");
		setCapturedImage(null);
		setEvidenceToken(null);
		setAnalysisSummary(null);
		setCoordinates(null);
		setDistance(null);
		setDescription("");
		setMessage(null);
		setGuidance(null);
		void camera.startCamera().then((result) => {
			if (mountedRef.current && !result.success) {
				setMessage(result.message);
				setStage("error");
			}
		});
	}, [open, camera.startCamera, camera.stopCamera]);

	const handleRetake = async () => {
		setCapturedImage(null);
		setEvidenceToken(null);
		setAnalysisSummary(null);
		setCoordinates(null);
		setDistance(null);
		setMessage(null);
		setGuidance(null);
		setStage("camera");
		const result = await camera.startCamera();
		if (mountedRef.current && !result.success) {
			setMessage(result.message);
			setStage("error");
		}
	};

	const processEvidenceImage = async (imageDataUrl: string) => {
		try {
			camera.stopCamera();
			setCapturedImage(imageDataUrl);
			setStage("analyzing");
			setMessage(null);
			setGuidance(null);

			const result = await analyzeEvidence({
				data: { reportId, imageDataUrl },
			});
			if (!mountedRef.current) return;
			if (!result.success) {
				setMessage(result.message);
				setGuidance(result.guidance ?? null);
				setStage(
					result.code === "UNSUITABLE_EVIDENCE" ||
						result.code === "INVALID_IMAGE"
						? "rejected"
						: "error",
				);
				return;
			}

			setEvidenceToken(result.evidenceToken);
			setAnalysisSummary(result.summary);
			setStage("locating");
			const currentCoordinates = await requestCurrentLocation();
			if (!mountedRef.current) return;
			const currentDistance = distanceMeters(
				reportLatitude,
				reportLongitude,
				currentCoordinates.latitude,
				currentCoordinates.longitude,
			);
			setCoordinates(currentCoordinates);
			setDistance(currentDistance);
			if (currentDistance > REPORT_RESOLUTION_MAX_DISTANCE_METERS) {
				setMessage(
					`Lokasimu berjarak ${Math.round(currentDistance)} meter. Validasi harus dilakukan dalam radius 500 meter.`,
				);
				setStage("error");
				return;
			}
			setStage("form");
		} catch (error) {
			if (!mountedRef.current) return;
			setMessage(
				error instanceof Error
					? error.message
					: "Bukti belum dapat diproses. Coba lagi.",
			);
			setStage("error");
		}
	};

	const handleCapture = async () => {
		try {
			const imageDataUrl = camera.captureFrame();
			await processEvidenceImage(imageDataUrl);
		} catch {
			if (!mountedRef.current) return;
			setMessage(
				"Kamera belum siap mengambil foto. Tunggu sebentar lalu coba lagi.",
			);
			setStage("error");
		}
	};

	const handleUpload = async (file: File) => {
		try {
			camera.stopCamera();
			setStage("analyzing");
			setMessage(null);
			setGuidance(null);
			const imageDataUrl = await processUploadedImage(file);
			if (!mountedRef.current) return;
			await processEvidenceImage(imageDataUrl);
		} catch (error) {
			if (!mountedRef.current) return;
			setMessage(
				error instanceof Error
					? error.message
					: "Gambar yang diunggah belum dapat diproses.",
			);
			setStage("error");
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!capturedImage || !evidenceToken || !coordinates) return;
		setStage("submitting");
		setMessage(null);
		try {
			await submitValidation({
				data: {
					reportId,
					description,
					imageDataUrl: capturedImage,
					latitude: coordinates.latitude,
					longitude: coordinates.longitude,
					evidenceToken,
				},
			});
			await router.invalidate({ sync: true });
			if (mountedRef.current) onOpenChange(false);
		} catch (error) {
			if (!mountedRef.current) return;
			setMessage(
				error instanceof Error
					? error.message
					: "Validasi belum dapat disimpan. Coba lagi.",
			);
			setStage("form");
		}
	};

	const isBusy = ["analyzing", "locating", "submitting"].includes(stage);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!isBusy) onOpenChange(nextOpen);
			}}
		>
			<DialogContent
				className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-0 sm:max-w-xl"
				showCloseButton={!isBusy}
			>
				<input
					ref={uploadInputRef}
					type="file"
					accept="image/*"
					className="sr-only"
					onChange={(event) => {
						const file = event.currentTarget.files?.[0];
						event.currentTarget.value = "";
						if (file) void handleUpload(file);
					}}
					aria-label="Unggah gambar bukti penyelesaian"
				/>
				<div className="border-b border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_52%)] px-5 py-4 dark:border-emerald-950">
					<DialogHeader>
						<div className="mb-1 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
							<CheckCircle2 className="size-4" />
							<span className="text-[10px] font-bold uppercase tracking-[0.16em]">
								Bukti komunitas
							</span>
						</div>
						<DialogTitle className="text-lg font-semibold">
							Validasi kondisi terselesaikan
						</DialogTitle>
						<DialogDescription>
							Ambil atau unggah foto kondisi terbaru di lokasi. Bukti ini menjadi
							satu dari dua validasi yang dibutuhkan.
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="space-y-4 px-5 pb-5">
					<div className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-950 shadow-inner">
						<video
							ref={camera.videoRef}
							autoPlay
							playsInline
							muted
							onCanPlay={camera.markVideoReady}
							className={`h-full w-full object-cover ${stage === "camera" ? "opacity-100" : "opacity-0"}`}
							aria-label="Pratinjau kamera bukti penyelesaian"
						/>
						{capturedImage && stage !== "camera" ? (
							<img
								src={capturedImage}
								alt="Bukti kondisi terbaru"
								className="absolute inset-0 h-full w-full object-cover"
							/>
						) : null}

						{stage === "camera" ? (
							<div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-linear-to-t from-black/70 to-transparent pb-4 pt-12">
								<button
									type="button"
									onClick={() => void handleCapture()}
									disabled={!camera.isReady}
									className="grid size-16 place-items-center rounded-full border-4 border-white bg-emerald-500 text-white shadow-xl transition hover:scale-105 hover:bg-emerald-400 disabled:opacity-50"
									aria-label="Ambil foto bukti"
								>
									<Camera className="size-6" />
								</button>
							</div>
						) : null}

						{["analyzing", "locating", "submitting"].includes(stage) ? (
							<div className="absolute inset-0 grid place-items-center bg-neutral-950/65 text-white backdrop-blur-sm">
								<div className="text-center">
									<LoaderCircle className="mx-auto size-7 animate-spin text-emerald-400" />
									<p className="mt-2 text-xs font-semibold">
										{stage === "analyzing"
											? "EcoLens memeriksa bukti"
											: stage === "locating"
												? "Memastikan lokasi"
												: "Menyimpan validasi"}
									</p>
								</div>
							</div>
						) : null}
					</div>

					{stage === "camera" ? (
						<div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 p-3 sm:flex-row dark:border-neutral-800 dark:bg-neutral-900/40">
							<p className="text-center text-xs text-neutral-500 sm:text-left">
								Pastikan area yang sama terlihat jelas dan tidak tertutup objek
								lain.
							</p>
							<Button
								type="button"
								variant="outline"
								onClick={() => uploadInputRef.current?.click()}
								className="w-full shrink-0 gap-2 sm:w-auto"
							>
								<Upload className="size-3.5" />
								Unggah gambar
							</Button>
						</div>
					) : null}

					{message ? (
						<div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
							<div className="flex items-start gap-2">
								<AlertTriangle className="mt-0.5 size-4 shrink-0" />
								<div>
									<p className="text-xs font-semibold">{message}</p>
									{guidance ? (
										<p className="mt-1 text-[11px] opacity-80">{guidance}</p>
									) : null}
								</div>
							</div>
						</div>
					) : null}

					{stage === "form" || stage === "submitting" ? (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid gap-2 sm:grid-cols-2">
								<div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-950 dark:bg-emerald-950/30">
									<div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
										<ScanSearch className="size-4" />
										<span className="text-[10px] font-bold uppercase tracking-wide">
											Lolos EcoLens
										</span>
									</div>
									<p className="mt-1.5 text-[11px] leading-relaxed text-emerald-950 dark:text-emerald-100">
										{analysisSummary}
									</p>
								</div>
								<div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 dark:border-sky-950 dark:bg-sky-950/30">
									<div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
										<LocateFixed className="size-4" />
										<span className="text-[10px] font-bold uppercase tracking-wide">
											Lokasi sesuai
										</span>
									</div>
									<p className="mt-1.5 text-[11px] text-sky-950 dark:text-sky-100">
										{distance === null
											? "-"
											: `${Math.round(distance)} meter dari laporan`}
										{coordinates
											? ` · akurasi ±${Math.round(coordinates.accuracy)} m`
											: ""}
									</p>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="resolution-description">
									Keterangan kondisi terbaru
								</Label>
								<Textarea
									id="resolution-description"
									value={description}
									onChange={(event) => setDescription(event.target.value)}
									minLength={20}
									maxLength={500}
									required
									placeholder="Jelaskan perubahan yang terlihat dan kondisi area saat ini..."
									className="min-h-24 resize-none"
								/>
								<p className="text-right text-[10px] text-neutral-400">
									{description.length}/500
								</p>
							</div>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => void handleRetake()}
									disabled={stage === "submitting"}
									className="gap-2"
								>
									<RefreshCcw className="size-3.5" />
									Foto ulang
								</Button>
								<Button
									type="submit"
									disabled={
										description.trim().length < 20 || stage === "submitting"
									}
									className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
								>
									{stage === "submitting" ? (
										<LoaderCircle className="size-3.5 animate-spin" />
									) : (
										<CheckCircle2 className="size-3.5" />
									)}
									Kirim validasi
								</Button>
							</DialogFooter>
						</form>
					) : null}

					{stage === "rejected" || stage === "error" ? (
						<div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
							<Button
								type="button"
								variant="outline"
								onClick={() => uploadInputRef.current?.click()}
								className="gap-2"
							>
								<Upload className="size-3.5" />
								Pilih gambar lain
							</Button>
							<Button
								type="button"
								onClick={() => void handleRetake()}
								className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
							>
								<RefreshCcw className="size-3.5" />
								Ambil foto ulang
							</Button>
						</div>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
