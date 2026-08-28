import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  FileSearch,
  ImageIcon,
  LoaderCircle,
  LocateFixed,
  MapPin,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type RefObject,
  useRef,
  useState,
} from "react";
import type { EcoLensLocationStatus } from "#/components/ecolens/useEcoLensLocation";
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
  onLocationChange: (value: string) => void;
  onRequestLocation: () => void;
  onStartCamera: () => void;
  onCapture: () => void;
  onUploadImage: (file: File) => void;
  onOpenReview: () => void;
  onVideoReady: () => void;
};

export function EcoLensCameraViewport({
  stage,
  videoRef,
  capturedImage,
  cameraError,
  isCameraReady,
  location,
  locationStatus,
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

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadImage(file);
    }
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
    <section className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden text-neutral-900">
      {/* Hidden file input for uploading images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Parent Layout */}
      <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col min-h-0 p-2 sm:p-3">
        {/* Viewport Frame */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex h-full w-full flex-1 min-h-0 overflow-hidden rounded-2xl border shadow-xs transition-colors ${
            stage === "live"
              ? "bg-black border-neutral-900"
              : "bg-white border-neutral-200/80"
          } ${isDragging ? "border-sky-500 bg-sky-50/40" : ""}`}
        >
          {/* Background subtle light pattern when not live */}
          {stage !== "live" && (
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-b from-sky-50/30 via-white to-neutral-50/60"
              aria-hidden="true"
            />
          )}

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

          {/* Top Bar: Navigasi, Lokasi Kejadian, & Upload Gambar (Selalu Muncul) */}
          <div className="absolute inset-x-2.5 top-2.5 z-30 flex flex-col gap-1.5 sm:inset-x-4 sm:top-4">
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-black/50 text-white shadow-md backdrop-blur-md transition-colors hover:bg-black/70 hover:text-white"
                aria-label="Kembali ke dashboard"
              >
                <ArrowLeft className="size-4" />
              </Link>

              {/* Input Lokasi Kejadian */}
              <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-white/25 bg-black/50 px-2 py-1 shadow-md backdrop-blur-md focus-within:border-sky-400 focus-within:bg-black/75">
                <MapPin className="size-4 shrink-0 text-sky-400" />
                <input
                  type="text"
                  value={location}
                  maxLength={240}
                  onChange={(event) => onLocationChange(event.target.value)}
                  placeholder="Tentukan lokasi kejadian..."
                  className="h-7 min-w-0 flex-1 bg-transparent text-xs text-white placeholder:text-white/60 outline-none"
                  aria-label="Lokasi kejadian"
                />
                <Button
                  type="button"
                  onClick={onRequestLocation}
                  disabled={locationStatus === "requesting"}
                  variant="ghost"
                  className="h-7 shrink-0 gap-1 rounded-lg bg-white/10 px-2 text-[11px] font-medium text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
                  aria-label="Gunakan lokasi GPS saya"
                >
                  {locationStatus === "requesting" ? (
                    <LoaderCircle className="size-3 motion-safe:animate-spin" />
                  ) : (
                    <LocateFixed className="size-3 text-sky-400" />
                  )}
                  <span className="hidden sm:inline">GPS</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Live Camera Guidelines Overlay */}
          {stage === "live" && (
            <>
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-8 pb-24 pt-20">
                <div className="relative aspect-4/3 w-full max-w-120 rounded-2xl border border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]">
                  <span className="absolute left-0 top-0 size-8 rounded-tl-2xl border-l-4 border-t-4 border-sky-400" />
                  <span className="absolute right-0 top-0 size-8 rounded-tr-2xl border-r-4 border-t-4 border-sky-400" />
                  <span className="absolute bottom-0 left-0 size-8 rounded-bl-2xl border-b-4 border-l-4 border-sky-400" />
                  <span className="absolute bottom-0 right-0 size-9 rounded-br-2xl border-b-4 border-r-4 border-sky-400" />
                </div>
              </div>

              {/* Shutter, Gallery Button, & Helper Text */}
              <div className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-3">
                <div className="rounded-full border border-white/20 bg-black/60 px-3.5 py-1 text-[11px] font-medium text-white shadow-md backdrop-blur-md">
                  {cameraError ||
                    (isCameraReady
                      ? "Arahkan ke objek & tekan tombol untuk memotret"
                      : "Menyiapkan sensor kamera...")}
                </div>

                <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8">
                  <span aria-hidden="true" />

                  <button
                    type="button"
                    onClick={onCapture}
                    disabled={!isCameraReady}
                    aria-label="Ambil foto kondisi lingkungan"
                    className="group grid size-16 place-items-center rounded-full border-4 border-sky-400 bg-white p-1 shadow-xl transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="grid size-full place-items-center rounded-full bg-sky-50 transition-colors group-hover:bg-sky-100">
                      <Camera className="size-6 text-sky-600" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerUpload}
                    aria-label="Unggah gambar dari galeri"
                    className="group grid size-11 justify-self-end place-items-center rounded-full border border-white/35 bg-black/55 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-black/75 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <ImageIcon className="size-5 transition-colors group-hover:text-sky-300" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* State: IDLE */}
          {stage === "idle" && (
            <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col items-center justify-center px-6 py-8 text-center">
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
                Ambil foto langsung melalui kamera atau pilih gambar dari galeri
                Anda. AI akan menganalisis kategori, urgensi, dan membuat draf
                laporan otomatis.
              </p>

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
            <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
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
            <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="grid size-14 place-items-center rounded-2xl border border-red-100 bg-red-50 text-red-600 shadow-xs">
                <AlertTriangle className="size-7" />
              </div>
              <h2 className="mt-4 text-base font-bold text-neutral-900">
                Kamera Belum Dapat Diakses
              </h2>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500">
                {cameraError ||
                  "Pastikan kamera perangkat terhubung dan izin telah diberikan."}
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
                AI sedang mendeteksi kategori masalah, tingkat urgensi, dan
                menyusun draf deskripsi laporan.
              </p>
            </div>
          )}

          {/* State: REVIEW BUTTON IN VIEWPORT */}
          {stage === "review" && (
            <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2 px-4">
              <Button
                type="button"
                variant="outline"
                onClick={onStartCamera}
                className="h-10 rounded-lg border-neutral-200 bg-white/90 px-4 text-xs font-medium text-neutral-700 shadow-md backdrop-blur-md hover:bg-white"
              >
                <RotateCcw className="size-3.5 text-sky-600" />
                Ulangi Foto
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
    </section>
  );
}
