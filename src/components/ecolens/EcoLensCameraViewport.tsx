import { Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowLeft,
	Camera,
	CheckCircle2,
	FileSearch,
	ImageIcon,
	Leaf,
	LoaderCircle,
	LocateFixed,
	MapPin,
	RotateCcw,
	ScanLine,
	ShieldCheck,
	Sparkles,
	Upload,
} from "lucide-react";
import { type ChangeEvent, type DragEvent, type RefObject, useRef, useState } from "react";
import type {
	EcoLensCoordinates,
	EcoLensLocationStatus,
} from "#/components/ecolens/useEcoLensLocation";
import { Button } from "#/components/ui/button";

export type EcoLensStage =
	| "idle"
	| "requesting-camera"
	| "live"
	| "captured"
	| "analyzing"
	| "review"
	| "demo-success"
	| "error";

type EcoLensCameraViewportProps = {
	stage: EcoLensStage;
	videoRef: RefObject<HTMLVideoElement | null>;
	capturedImage: string | null;
	cameraError: string | null;
	isCameraReady: boolean;
	location: string;
	locationStatus: EcoLensLocationStatus;
	locationError: string | null;
	coordinates: EcoLensCoordinates | null;
	onLocationChange: (value: string) => void;
	onRequestLocation: () => void;
	onStartCamera: () => void;
	onCapture: () => void;
	onUploadImage: (file: File) => void;
	onOpenReview: () => void;
	onVideoReady: () => void;
};

const stageLabels: Record<EcoLensStage, string> = {
	idle: "Belum dimulai",
	"requesting-camera": "Meminta akses kamera",
	live: "Kamera aktif",
	captured: "Foto direkam",
	analyzing: "Menganalisis foto",
	review: "Siap direview",
	"demo-success": "Tersimpan",
	error: "Kamera terhenti",
};

const stageProgress: Record<EcoLensStage, number> = {
	idle: 0,
	"requesting-camera": 1,
	live: 1,
	captured: 2,
	analyzing: 2,
	review: 3,
	"demo-success": 4,
	error: 0,
};

const workflowSteps = [
	{ label: "Ambil/Unggah foto", note: "Gunakan kamera atau galeri" },
	{ label: "Analisis AI", note: "Klasifikasi kategori & urgensi" },
	{ label: "Review laporan", note: "Periksa dan lengkapi deskripsi" },
	{ label: "Simpan & Kirim", note: "Tersimpan ke database" },
];

export function EcoLensCameraViewport({
	stage,
	videoRef,
	capturedImage,
	cameraError,
	isCameraReady,
	location,
	locationStatus,
	locationError,
	coordinates,
	onLocationChange,
	onRequestLocation,
	onStartCamera,
	onCapture,
	onUploadImage,
	onOpenReview,
	onVideoReady,
}: EcoLensCameraViewportProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const showCapturedImage = Boolean(capturedImage && stage !== "live");
	const progress = stageProgress[stage];

	const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			onUploadImage(file);
		}
		// Reset input value to allow selecting same file again if needed
		event.target.value = "";
	};

	const handleTriggerUpload = () => {
		fileInputRef.current?.click();
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (stage === "idle" || stage === "error") {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const file = e.dataTransfer.files?.[0];
		if (file && file.type.startsWith("image/")) {
			onUploadImage(file);
		}
	};

	return (
		<section className="min-h-[calc(100dvh-3.5rem)] text-neutral-900">
			{/* Hidden file input for uploading images */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileInputChange}
			/>

			{/* Parent Layout */}
			<div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-stretch">
				{/* Kolom Kiri (Viewport & Kontrol Kamera/Upload) */}
				<div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-2/3">
					{/* Header Top Bar */}
					<div className="flex flex-col gap-2 rounded-lg bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-3 sm:py-2 shadow-xs">
						<div className="flex min-w-0 items-center gap-3">
							<Link
								to="/dashboard"
								className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
								aria-label="Kembali ke dashboard"
							>
								<ArrowLeft className="size-3.5" />
							</Link>
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
										<Leaf className="size-3" />
										EcoLens AI
									</span>
									<span className="text-xs font-medium text-neutral-800">
										Dokumentasikan kondisi lingkungan di sekitar Anda
									</span>
								</div>
							</div>
						</div>

						<div className="flex shrink-0 items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleTriggerUpload}
								className="h-8 gap-1.5 rounded-lg border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
							>
								<Upload className="size-3.5 text-sky-600" />
								<span>Unggah Gambar</span>
							</Button>

							<div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700">
								<span
									className={`size-2 rounded-full ${
										stage === "error"
											? "bg-red-500"
											: stage === "live"
												? "bg-emerald-500 animate-pulse"
												: "bg-sky-500"
									}`}
								/>
								<span>{stageLabels[stage]}</span>
							</div>
						</div>
					</div>

					{/* Viewport Frame */}
					<div
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`relative min-h-[32rem] flex-1 overflow-hidden rounded-lg border bg-white shadow-xs transition-colors lg:min-h-[38rem] ${
							isDragging ? "border-sky-500 bg-sky-50/40" : "border-neutral-200/80"
						}`}
					>
						{/* Background subtle light pattern */}
						<div
							className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-50/30 via-white to-neutral-50/60"
							aria-hidden="true"
						/>

						{/* Live Video Preview */}
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							onCanPlay={onVideoReady}
							className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
								stage === "live" ? "opacity-100" : "opacity-0 pointer-events-none"
							}`}
							aria-label="Pratinjau kamera Eco Lens"
						/>

						{/* Captured Image Preview */}
						{showCapturedImage && capturedImage && (
							<img
								src={capturedImage}
								alt="Foto kondisi lingkungan yang diambil"
								className="absolute inset-0 h-full w-full object-cover"
							/>
						)}

						{/* Live Camera Guidelines Overlay */}
						{stage === "live" && (
							<>
								<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-8 pb-24 pt-16">
									<div className="relative aspect-[4/3] w-full max-w-[30rem] rounded-2xl border border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.15)]">
										<span className="absolute left-0 top-0 size-8 rounded-tl-2xl border-l-4 border-t-4 border-sky-500" />
										<span className="absolute right-0 top-0 size-8 rounded-tr-2xl border-r-4 border-t-4 border-sky-500" />
										<span className="absolute bottom-0 left-0 size-8 rounded-bl-2xl border-b-4 border-l-4 border-sky-500" />
										<span className="absolute bottom-0 right-0 size-9 rounded-br-2xl border-b-4 border-r-4 border-sky-500" />
									</div>
								</div>

								{/* Top floating label & Switch to Upload */}
								<div className="absolute left-3 top-3 z-20 flex items-center gap-2">
									<div className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-xs backdrop-blur-md">
										<ScanLine className="size-3.5 text-sky-600" />
										Posisikan objek masalah di dalam bingkai
									</div>
									<Button
										type="button"
										variant="outline"
										onClick={handleTriggerUpload}
										className="h-7 gap-1 rounded-lg border-neutral-200/80 bg-white/90 px-2 text-[11px] font-medium text-neutral-700 shadow-xs backdrop-blur-md hover:bg-white"
									>
										<Upload className="size-3 text-sky-600" />
										Pilih File
									</Button>
								</div>

								{/* Shutter Button & Helper Text */}
								<div className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-3">
									<div className="rounded-lg border border-neutral-200/80 bg-white/90 px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-xs backdrop-blur-md">
										{cameraError ||
											(isCameraReady
												? "Kamera siap, tekan tombol untuk memotret"
												: "Menyiapkan sensor kamera...")}
									</div>

									<button
										type="button"
										onClick={onCapture}
										disabled={!isCameraReady}
										aria-label="Ambil foto kondisi lingkungan"
										className="group grid size-16 place-items-center rounded-full border-4 border-sky-500 bg-white p-1 shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
									>
										<span className="grid size-full place-items-center rounded-full bg-sky-50 transition-colors group-hover:bg-sky-100">
											<Camera className="size-6 text-sky-600" />
										</span>
									</button>
								</div>
							</>
						)}

						{/* State: IDLE */}
						{stage === "idle" && (
							<div className="relative z-10 flex h-full min-h-[32rem] flex-col items-center justify-center px-6 py-12 text-center lg:min-h-[38rem]">
								<div className="grid size-16 place-items-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600 shadow-xs">
									<Camera className="size-8" />
								</div>
								<span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
									<Sparkles className="size-3" />
									Deteksi Cerdas AI
								</span>
								<h2 className="mt-2.5 max-w-md text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
									Ambil atau Unggah Bukti Visual
								</h2>
								<p className="mt-2 max-w-md text-xs leading-relaxed text-neutral-500">
									Ambil foto langsung melalui kamera atau pilih gambar dari galeri Anda. AI akan menganalisis kategori, urgensi, dan membuat draf laporan otomatis.
								</p>

								<div className="mt-5 flex max-w-sm items-start gap-2.5 rounded-lg border border-neutral-200/80 bg-white p-3 text-left shadow-xs">
									<ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
									<p className="text-[11px] leading-4 text-neutral-600">
										Mendukung file JPG, PNG, dan WebP. Anda juga dapat melakukan <i>drag-and-drop</i> gambar ke area ini.
									</p>
								</div>

								{/* Action Buttons: Kamera & Upload Gambar */}
								<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
									<Button
										type="button"
										onClick={onStartCamera}
										className="h-10 gap-2 rounded-lg bg-sky-500 px-5 text-xs font-semibold text-white shadow-xs hover:bg-sky-600"
									>
										<Camera className="size-4" />
										<span>Aktifkan Kamera</span>
									</Button>

									<Button
										type="button"
										variant="outline"
										onClick={handleTriggerUpload}
										className="h-10 gap-2 rounded-lg border-neutral-200 bg-white px-5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-neutral-900"
									>
										<Upload className="size-4 text-sky-600" />
										<span>Unggah Gambar</span>
									</Button>
								</div>
							</div>
						)}

						{/* State: REQUESTING CAMERA */}
						{stage === "requesting-camera" && (
							<div className="relative z-10 flex h-full min-h-[32rem] flex-col items-center justify-center px-6 text-center lg:min-h-[38rem]">
								<div className="grid size-14 place-items-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600 shadow-xs">
									<LoaderCircle className="size-7 motion-safe:animate-spin" />
								</div>
								<h2 className="mt-4 text-base font-bold text-neutral-900">
									Menghubungkan Kamera
								</h2>
								<p className="mt-1.5 text-xs text-neutral-500">
									Izinkan akses kamera pada browser Anda untuk melanjutkan.
								</p>
								<Button
									type="button"
									variant="outline"
									onClick={handleTriggerUpload}
									className="mt-4 h-8 gap-1.5 text-xs text-neutral-700"
								>
									<Upload className="size-3.5 text-sky-600" />
									Atau Unggah Gambar dari Perangkat
								</Button>
							</div>
						)}

						{/* State: ERROR */}
						{stage === "error" && (
							<div className="relative z-10 flex h-full min-h-[32rem] flex-col items-center justify-center px-6 text-center lg:min-h-[38rem]">
								<div className="grid size-14 place-items-center rounded-2xl border border-red-100 bg-red-50 text-red-600 shadow-xs">
									<AlertTriangle className="size-7" />
								</div>
								<h2 className="mt-4 text-base font-bold text-neutral-900">
									Kamera Belum Dapat Diakses
								</h2>
								<p className="mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500">
									{cameraError || "Pastikan kamera perangkat terhubung dan izin telah diberikan."}
								</p>
								<div className="mt-5 flex flex-wrap justify-center gap-2">
									<Button
										type="button"
										onClick={onStartCamera}
										className="h-9 rounded-lg bg-sky-500 px-4 text-xs font-medium text-white hover:bg-sky-600"
									>
										Coba Kamera Lagi
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={handleTriggerUpload}
										className="h-9 gap-1.5 rounded-lg border-neutral-200 bg-white px-4 text-xs text-neutral-700 hover:bg-neutral-50"
									>
										<Upload className="size-3.5 text-sky-600" />
										Unggah Gambar
									</Button>
									<Button
										render={<Link to="/dashboard" />}
										variant="ghost"
										className="h-9 rounded-lg px-4 text-xs text-neutral-500 hover:bg-neutral-100"
									>
										Kembali
									</Button>
								</div>
							</div>
						)}

						{/* State: ANALYZING */}
						{stage === "analyzing" && (
							<div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 px-6 text-center backdrop-blur-md">
								<div className="relative grid size-16 place-items-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600 shadow-xs">
									<Sparkles className="size-8 motion-safe:animate-bounce" />
								</div>
								<span className="mt-4 inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
									EcoLens AI Vision
								</span>
								<h2 className="mt-2 text-lg font-bold text-neutral-900">
									Menganalisis Bukti Visual...
								</h2>
								<p className="mt-1 max-w-xs text-xs text-neutral-500 leading-relaxed">
									AI sedang mendeteksi kategori masalah, tingkat urgensi, dan menyusun draf deskripsi laporan.
								</p>
							</div>
						)}

						{/* State: REVIEW BUTTON IN VIEWPORT */}
						{stage === "review" && (
							<div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2 px-4">
								<Button
									type="button"
									variant="outline"
									onClick={handleTriggerUpload}
									className="h-10 rounded-lg border-neutral-200 bg-white/90 px-4 text-xs font-medium text-neutral-700 shadow-md backdrop-blur-md hover:bg-white"
								>
									<Upload className="size-3.5 text-sky-600" />
									Ganti Gambar
								</Button>
								<Button
									type="button"
									onClick={onOpenReview}
									className="h-10 rounded-lg bg-sky-500 px-5 text-xs font-semibold text-white shadow-md hover:bg-sky-600 gap-2"
								>
									<FileSearch className="size-4" />
									Buka Form Review Laporan
								</Button>
							</div>
						)}
					</div>
				</div>

				{/* Kolom Kanan: Detail & Panduan */}
				<aside className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-1/3">
					<div className="flex items-center justify-between px-1 py-1.5">
						<h2 className="text-sm font-semibold text-neutral-900">
							Detail Pelaporan
						</h2>
						<span className="text-xs font-medium text-neutral-500">
							Langkah {Math.min(progress, 4)} dari 4
						</span>
					</div>

					{/* Card Lokasi */}
					<div className="rounded-lg bg-white p-3.5 shadow-xs border border-neutral-100">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="text-[11px] font-medium text-neutral-400">
									Lokasi Kejadian
								</p>
								<h3 className="mt-0.5 text-xs font-semibold text-neutral-800">
									Tentukan Titik Laporan
								</h3>
							</div>
							<div className="grid size-8 place-items-center rounded-lg bg-sky-50 text-sky-600">
								<MapPin className="size-4" />
							</div>
						</div>

						<div className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-1 focus-within:border-sky-400 focus-within:bg-white">
							<input
								type="text"
								value={location}
								maxLength={240}
								onChange={(event) => onLocationChange(event.target.value)}
								placeholder="Nama jalan, area, atau patokan lokasi"
								className="h-8 min-w-0 flex-1 bg-transparent px-2 text-xs text-neutral-700 outline-none placeholder:text-neutral-400"
								aria-label="Lokasi kejadian"
							/>
							<Button
								type="button"
								onClick={onRequestLocation}
								disabled={locationStatus === "requesting"}
								variant="outline"
								className="h-7 shrink-0 rounded-md border-neutral-200 bg-white px-2 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
								aria-label="Gunakan lokasi GPS saya"
							>
								{locationStatus === "requesting" ? (
									<LoaderCircle className="size-3 motion-safe:animate-spin" />
								) : (
									<LocateFixed className="size-3 text-sky-600" />
								)}
								<span>GPS</span>
							</Button>
						</div>

						{(locationError || coordinates) && (
							<div
								className={`mt-2 flex items-center gap-1 text-[11px] ${
									locationError ? "text-amber-600" : "text-emerald-600"
								}`}
							>
								<CheckCircle2 className="size-3 shrink-0" />
								<span>
									{locationError ||
										`Lokasi GPS terdeteksi (Akurasi ±${Math.round(coordinates?.accuracy ?? 0)} m)`}
								</span>
							</div>
						)}
					</div>

					{/* Card Alur Pelaporan */}
					<div className="rounded-lg bg-white p-3.5 shadow-xs border border-neutral-100">
						<div className="flex items-center justify-between">
							<h3 className="text-xs font-semibold text-neutral-900">
								Alur Pelaporan
							</h3>
							<span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
								Proses Aktif
							</span>
						</div>

						<div className="mt-3 divide-y divide-neutral-100">
							{workflowSteps.map((step, index) => {
								const stepNumber = index + 1;
								const isComplete =
									progress > stepNumber || stage === "demo-success";
								const isActive = !isComplete && progress === stepNumber;

								return (
									<div
										key={step.label}
										className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1"
									>
										<div
											className={`grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-semibold ${
												isComplete
													? "bg-emerald-50 text-emerald-600"
													: isActive
														? "bg-sky-500 text-white"
														: "bg-neutral-100 text-neutral-400"
											}`}
										>
											{isComplete ? (
												<CheckCircle2 className="size-3.5" />
											) : (
												stepNumber
											)}
										</div>
										<div className="min-w-0">
											<p
												className={`text-xs font-medium ${
													isActive || isComplete
														? "text-neutral-800"
														: "text-neutral-400"
												}`}
											>
												{step.label}
											</p>
											<p className="truncate text-[10px] text-neutral-400">
												{step.note}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Card Informasi / Panduan */}
					<div className="rounded-lg border border-sky-100 bg-sky-50/70 p-3.5">
						<div className="flex items-start gap-2.5">
							<ShieldCheck className="mt-0.5 size-4 shrink-0 text-sky-600" />
							<div>
								<p className="text-xs font-semibold text-sky-950">
									Privasi & Keamanan Data
								</p>
								<p className="mt-1 text-[11px] leading-relaxed text-sky-800/80">
									Foto dan titik koordinat disimpan secara aman di database untuk verifikasi penanganan masalah lingkungan.
								</p>
							</div>
						</div>
					</div>
				</aside>
			</div>
		</section>
	);
}
