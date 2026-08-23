import { useServerFn } from "@tanstack/react-start";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
	EcoLensCameraViewport,
	type EcoLensStage,
} from "#/components/ecolens/EcoLensCameraViewport";
import {
	type EcoLensFormErrors,
	EcoLensReviewDrawer,
} from "#/components/ecolens/EcoLensReviewDrawer";
import { EcoLensSuccessDialog } from "#/components/ecolens/EcoLensSuccessDialog";
import { processUploadedImage } from "#/components/ecolens/imageUtils";
import { useEcoLensCamera } from "#/components/ecolens/useEcoLensCamera";
import { useEcoLensLocation } from "#/components/ecolens/useEcoLensLocation";
import { analyzeEcoLens } from "#/lib/ecolens.functions";
import { createReportFn } from "#/lib/reports.functions";
import type { EcoLensAnalysis, EcoLensCategory } from "#/types/ecolens";

const EMPTY_CATEGORY: EcoLensCategory = "Lainnya";

export function EcoLensWorkspace() {
	const analyzeEcoLensFn = useServerFn(analyzeEcoLens);
	const createReport = useServerFn(createReportFn);
	const camera = useEcoLensCamera();
	const gps = useEcoLensLocation();
	const mountedRef = useRef(false);
	const latestAnalysisRequest = useRef(0);

	const [stage, setStage] = useState<EcoLensStage>("idle");
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [reviewOpen, setReviewOpen] = useState(false);
	const [analysis, setAnalysis] = useState<EcoLensAnalysis | null>(null);
	const [analysisError, setAnalysisError] = useState<string | null>(null);
	const [category, setCategory] = useState<EcoLensCategory>(EMPTY_CATEGORY);
	const [description, setDescription] = useState("");
	const [location, setLocation] = useState("");
	const [formErrors, setFormErrors] = useState<EcoLensFormErrors>({});
	const [captureError, setCaptureError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		mountedRef.current = true;

		return () => {
			mountedRef.current = false;
			latestAnalysisRequest.current += 1;
		};
	}, []);

	useEffect(() => {
		if (!gps.suggestedLocation) return;
		setLocation((currentLocation) =>
			currentLocation.trim() ? currentLocation : gps.suggestedLocation || "",
		);
	}, [gps.suggestedLocation]);

	const clearDraft = () => {
		latestAnalysisRequest.current += 1;
		setCapturedImage(null);
		setAnalysis(null);
		setAnalysisError(null);
		setCategory(EMPTY_CATEGORY);
		setDescription("");
		setFormErrors({});
		setCaptureError(null);
		setReviewOpen(false);
	};

	const handleStartCamera = async () => {
		clearDraft();
		setStage("requesting-camera");
		const result = await camera.startCamera();
		if (!mountedRef.current) return;

		if (result.success) {
			setStage("live");
		} else {
			setStage("error");
		}
	};

	const runAnalysis = async (imageDataUrl: string) => {
		const requestId = latestAnalysisRequest.current + 1;
		latestAnalysisRequest.current = requestId;
		setAnalysisError(null);
		setReviewOpen(false);
		setStage("analyzing");

		try {
			const result = await analyzeEcoLensFn({
				data: {
					imageDataUrl,
					location: location.trim() || undefined,
				},
			});

			if (latestAnalysisRequest.current !== requestId) return;

			if (result.success) {
				setAnalysis(result.analysis);
				setCategory(result.analysis.category);
				setDescription(result.analysis.suggestedDescription);
			} else {
				console.error("[EcoLens] Analisis otomatis gagal:", {
					code: result.code,
					message: result.message,
					details: result.details,
					rawResult: result,
				});
				setAnalysis(null);
				setAnalysisError(result.message);
			}
		} catch (error) {
			if (latestAnalysisRequest.current !== requestId) return;

			console.error("[EcoLens] Terjadi kesalahan saat memproses analisis:", error);
			setAnalysis(null);
			setAnalysisError(
				"Analisis tidak dapat dijalankan saat ini. Kamu tetap dapat melengkapi draf secara manual.",
			);
		}

		if (latestAnalysisRequest.current === requestId) {
			setStage("review");
			setReviewOpen(true);
		}
	};

	const handleCapture = () => {
		try {
			setCaptureError(null);
			const imageDataUrl = camera.captureFrame();
			camera.stopCamera();
			setCapturedImage(imageDataUrl);
			setStage("captured");
			void runAnalysis(imageDataUrl);
		} catch (error) {
			const isOversized =
				error instanceof Error && error.message === "IMAGE_TOO_LARGE";
			setCaptureError(
				isOversized
					? "Foto terlalu besar untuk diproses. Coba arahkan kamera kembali dan ambil ulang."
					: "Kamera belum siap mengambil foto. Tunggu sebentar lalu coba lagi.",
			);
		}
	};

	const handleUploadImage = async (file: File) => {
		try {
			setCaptureError(null);
			camera.stopCamera();
			setStage("captured");
			const imageDataUrl = await processUploadedImage(file);
			if (!mountedRef.current) return;
			setCapturedImage(imageDataUrl);
			void runAnalysis(imageDataUrl);
		} catch (error) {
			if (!mountedRef.current) return;
			const message =
				error instanceof Error
					? error.message
					: "Gagal memproses gambar yang diunggah.";
			setCaptureError(message);
			setStage("error");
		}
	};

	const handleRetake = async () => {
		clearDraft();
		setStage("requesting-camera");
		const result = await camera.startCamera();
		if (!mountedRef.current) return;
		setStage(result.success ? "live" : "error");
	};

	const handleRetryAnalysis = () => {
		if (capturedImage) void runAnalysis(capturedImage);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const nextErrors: EcoLensFormErrors = {};
		if (!location.trim()) {
			nextErrors.location = "Lokasi kejadian wajib diisi.";
		}
		if (!description.trim()) {
			nextErrors.description = "Deskripsi laporan wajib diisi.";
		}

		setFormErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		setIsSubmitting(true);
		try {
			await createReport({
				data: {
					title: `${category} di ${location.trim()}`,
					description: description.trim(),
					category,
					urgency: analysis?.urgency || "Sedang",
					locationName: location.trim(),
					latitude: gps.coordinates?.latitude,
					longitude: gps.coordinates?.longitude,
					images: capturedImage ? [capturedImage] : [],
					ecolensAnalysis: analysis
						? {
								category: analysis.category,
								urgency: analysis.urgency,
								summary: analysis.summary,
								suggestedDescription: analysis.suggestedDescription,
							}
						: undefined,
				},
			});

			if (!mountedRef.current) return;
			setReviewOpen(false);
			setStage("demo-success");
		} catch (error) {
			if (!mountedRef.current) return;
			const message =
				error instanceof Error && error.message.includes("Unauthorized")
					? "Silakan login terlebih dahulu untuk mengirim laporan."
					: "Gagal menyimpan laporan. Silakan coba beberapa saat lagi.";
			setFormErrors({ description: message });
		} finally {
			if (mountedRef.current) {
				setIsSubmitting(false);
			}
		}
	};

	const handleCreateAnother = () => {
		camera.stopCamera();
		clearDraft();
		setStage("idle");
	};

	const handleLocationChange = (value: string) => {
		setLocation(value);
		if (formErrors.location && value.trim()) {
			setFormErrors((currentErrors) => ({
				...currentErrors,
				location: undefined,
			}));
		}
	};

	const handleDescriptionChange = (value: string) => {
		setDescription(value);
		if (formErrors.description && value.trim()) {
			setFormErrors((currentErrors) => ({
				...currentErrors,
				description: undefined,
			}));
		}
	};

	return (
		<main className="min-h-[calc(100dvh-3.5rem)] bg-neutral-50/40">
			<EcoLensCameraViewport
				stage={stage}
				videoRef={camera.videoRef}
				capturedImage={capturedImage}
				cameraError={camera.error || captureError}
				isCameraReady={camera.isReady}
				location={location}
				locationStatus={gps.status}
				locationError={gps.error}
				coordinates={gps.coordinates}
				onLocationChange={handleLocationChange}
				onRequestLocation={gps.requestLocation}
				onStartCamera={() => void handleStartCamera()}
				onCapture={handleCapture}
				onUploadImage={(file) => void handleUploadImage(file)}
				onOpenReview={() => setReviewOpen(true)}
				onVideoReady={camera.markVideoReady}
			/>

			<EcoLensReviewDrawer
				open={reviewOpen && stage === "review"}
				analysis={analysis}
				analysisError={analysisError}
				category={category}
				description={description}
				location={location}
				errors={formErrors}
				isSubmitting={isSubmitting}
				onOpenChange={setReviewOpen}
				onCategoryChange={setCategory}
				onDescriptionChange={handleDescriptionChange}
				onLocationChange={handleLocationChange}
				onRetryAnalysis={handleRetryAnalysis}
				onRetake={() => void handleRetake()}
				onSubmit={handleSubmit}
			/>

			<EcoLensSuccessDialog
				open={stage === "demo-success"}
				onCreateAnother={handleCreateAnother}
			/>
		</main>
	);
}
