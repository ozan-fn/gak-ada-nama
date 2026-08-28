import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Camera,
  FileSearch,
  ImageIcon,
  LoaderCircle,
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
    <section className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col bg-neutral-50/60 text-neutral-900">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 p-2 sm:p-3 lg:p-4">
        <div
          role="button"
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleTriggerUpload();
            }
          }}
          className={`
            relative flex min-h-0 w-full flex-1
            overflow-hidden rounded-xl
            border
            shadow-[0_1px_3px_rgba(0,0,0,0.04)]
            transition-all duration-200
            ${
              stage === "live"
                ? "border-neutral-800 bg-neutral-950"
                : "border-neutral-200/80 bg-white"
            }
            ${isDragging ? "border-sky-400 bg-sky-50/30" : ""}
          `}
        >
          {/* Soft background */}
          {stage !== "live" && (
            <div
              className="
                pointer-events-none absolute inset-0
                bg-[radial-gradient(circle_at_50%_25%,rgba(14,165,233,0.07),transparent_38%)]
              "
              aria-hidden="true"
            />
          )}

          {/* Camera */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={onVideoReady}
            className={`
              absolute inset-0 h-full w-full object-cover
              transition-opacity duration-300
              ${
                stage === "live"
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }
            `}
            aria-label="Pratinjau kamera Eco Lens"
          />

          {/* Captured image */}
          {showCapturedImage && capturedImage && (
            <img
              src={capturedImage}
              alt="Foto kondisi lingkungan yang diambil"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Live camera */}
          {stage === "live" && (
            <>
              {/* Camera guide */}
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 pb-32 pt-20 sm:px-10">
                <div className="relative aspect-4/3 w-full max-w-2xl rounded-xl border border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]">
                  <span className="absolute left-0 top-0 size-7 rounded-tl-xl border-l-[3px] border-t-[3px] border-sky-400" />
                  <span className="absolute right-0 top-0 size-7 rounded-tr-xl border-r-[3px] border-t-[3px] border-sky-400" />
                  <span className="absolute bottom-0 left-0 size-7 rounded-bl-xl border-b-[3px] border-l-[3px] border-sky-400" />
                  <span className="absolute bottom-0 right-0 size-7 rounded-br-xl border-b-[3px] border-r-[3px] border-sky-400" />

                  <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
                </div>
              </div>

              {/* Camera controls */}
              <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-5 sm:px-8 sm:pb-7">
                <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
                  {/* Helper */}
                  <div className="rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-[10px] font-medium text-white shadow-lg backdrop-blur-md sm:text-[11px]">
                    {cameraError ||
                      (isCameraReady
                        ? "Arahkan kamera ke objek yang ingin dilaporkan"
                        : "Menyiapkan kamera...")}
                  </div>

                  {/* Controls */}
                  <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
                    <span aria-hidden="true" />

                    {/* Shutter */}
                    <button
                      type="button"
                      onClick={onCapture}
                      disabled={!isCameraReady}
                      aria-label="Ambil foto kondisi lingkungan"
                      className="
                        group relative
                        grid size-18
                        place-items-center
                        rounded-full
                        border-[3px] border-white/95
                        bg-white/10
                        p-1.5
                        shadow-[0_8px_30px_rgba(0,0,0,0.28)]
                        backdrop-blur-sm
                        transition-all duration-150
                        hover:scale-105
                        hover:bg-white/15
                        active:scale-90
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-sky-400
                        focus-visible:ring-offset-2
                        focus-visible:ring-offset-transparent
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        disabled:hover:scale-100
                      "
                    >
                      {/* Outer glow */}
                      <span
                        className="
                          pointer-events-none
                          absolute -inset-1.25
                          rounded-full
                          border border-white/20
                          opacity-0
                          transition-opacity duration-200
                          group-hover:opacity-100
                        "
                      />

                      {/* Shutter surface */}
                      <span
                        className="
                          grid size-full
                          place-items-center
                          rounded-full
                          bg-white
                          shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]
                          transition-all duration-150
                          group-hover:bg-sky-50
                          group-active:scale-95
                        "
                      >
                        <Camera
                          className="
                            size-6
                            text-sky-600
                            transition-transform duration-150
                            group-hover:scale-105
                          "
                        />
                      </span>
                    </button>

                    {/* Gallery */}
                    <button
                      type="button"
                      onClick={handleTriggerUpload}
                      aria-label="Unggah gambar dari galeri"
                      className="
                        group flex size-11
                        shrink-0
                        justify-self-end
                        items-center justify-center
                        rounded-full
                        border border-white/30
                        bg-black/35
                        text-white
                        shadow-lg
                        backdrop-blur-md
                        transition-all duration-150
                        hover:scale-105
                        hover:border-white/45
                        hover:bg-black/55
                        active:scale-90
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-sky-400
                        focus-visible:ring-offset-2
                        focus-visible:ring-offset-transparent
                      "
                    >
                      <ImageIcon
                        className="
                          size-4.5
                          transition-transform duration-150
                          group-hover:scale-105
                          group-hover:text-sky-300
                        "
                      />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Idle */}
          {stage === "idle" && (
            <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-8 text-center">
              <div className="grid size-14 place-items-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                <Camera className="size-7" />
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700">
                <Sparkles className="size-3" />
                EcoLens AI
              </div>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                Dokumentasikan kondisi lingkungan
              </h2>

              <p className="mt-2 max-w-lg text-xs leading-relaxed text-neutral-500 sm:text-[13px]">
                Ambil foto menggunakan kamera atau unggah gambar dari perangkat.
                EcoLens akan membantu mengenali kategori, tingkat urgensi, dan
                menyusun draf laporan.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <Button
                  type="button"
                  onClick={onStartCamera}
                  className="
                    h-9 gap-2 rounded-lg
                    bg-sky-500 px-4
                    text-xs font-semibold text-white
                    shadow-xs
                    hover:bg-sky-600
                  "
                >
                  <Camera className="size-3.5" />
                  Aktifkan Kamera
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTriggerUpload}
                  className="
                    h-9 gap-2 rounded-lg
                    border-neutral-200
                    bg-white px-4
                    text-xs font-medium text-neutral-700
                    shadow-xs
                    hover:bg-neutral-50
                  "
                >
                  <Upload className="size-3.5 text-sky-600" />
                  Unggah Gambar
                </Button>
              </div>

              <p className="mt-5 text-[10px] text-neutral-400">
                JPG, PNG, atau WEBP
              </p>
            </div>
          )}

          {/* Requesting camera */}
          {stage === "requesting-camera" && (
            <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="grid size-14 place-items-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                <LoaderCircle className="size-6 motion-safe:animate-spin" />
              </div>

              <h2 className="mt-4 text-base font-semibold text-neutral-900">
                Menyiapkan kamera
              </h2>

              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500">
                Izinkan akses kamera pada browser untuk mulai mengambil foto.
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={handleTriggerUpload}
                className="
                  mt-4 h-8 gap-1.5
                  rounded-lg
                  border-neutral-200
                  px-3
                  text-[11px]
                  text-neutral-700
                "
              >
                <Upload className="size-3.5 text-sky-600" />
                Unggah dari perangkat
              </Button>
            </div>
          )}

          {/* Error */}
          {stage === "error" && (
            <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="grid size-14 place-items-center rounded-xl border border-red-100 bg-red-50 text-red-500">
                <AlertTriangle className="size-6" />
              </div>

              <h2 className="mt-4 text-base font-semibold text-neutral-900">
                Kamera tidak dapat digunakan
              </h2>

              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500">
                {cameraError ||
                  "Pastikan kamera perangkat tersedia dan izin kamera telah diberikan."}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  onClick={onStartCamera}
                  className="
                    h-9 rounded-lg
                    bg-sky-500 px-4
                    text-xs font-medium text-white
                    hover:bg-sky-600
                  "
                >
                  Coba lagi
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTriggerUpload}
                  className="
                    h-9 gap-1.5 rounded-lg
                    border-neutral-200
                    bg-white px-4
                    text-xs text-neutral-700
                    hover:bg-neutral-50
                  "
                >
                  <Upload className="size-3.5 text-sky-600" />
                  Unggah gambar
                </Button>

                <Button
                  render={<Link to="/dashboard" />}
                  variant="ghost"
                  className="
                    h-9 rounded-lg
                    px-4
                    text-xs text-neutral-500
                    hover:bg-neutral-100
                  "
                >
                  Kembali
                </Button>
              </div>
            </div>
          )}

          {/* Analyzing */}
          {stage === "analyzing" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/92 px-6 text-center backdrop-blur-md">
              <div className="relative grid size-14 place-items-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                <Sparkles className="size-7 motion-safe:animate-pulse" />
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700">
                <Sparkles className="size-3" />
                EcoLens AI Vision
              </div>

              <h2 className="mt-2.5 text-lg font-semibold text-neutral-900">
                Menganalisis foto
              </h2>

              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500">
                Sedang mengenali kondisi, menentukan tingkat urgensi, dan
                menyusun draf laporan untukmu.
              </p>

              <div className="mt-5 h-1 w-32 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-sky-400" />
              </div>
            </div>
          )}

          {/* Review */}
          {stage === "review" && (
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-5 sm:pb-7">
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white/95 p-1.5 shadow-lg backdrop-blur-md">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onStartCamera}
                  className="
                    h-9 gap-1.5
                    rounded-lg
                    border-neutral-200
                    bg-white
                    px-3
                    text-xs font-medium text-neutral-700
                    hover:bg-neutral-50
                  "
                >
                  <RotateCcw className="size-3.5 text-sky-600" />
                  Ulangi
                </Button>

                <Button
                  type="button"
                  onClick={onOpenReview}
                  className="
                    h-9 gap-1.5
                    rounded-lg
                    bg-sky-500
                    px-4
                    text-xs font-semibold text-white
                    shadow-xs
                    hover:bg-sky-600
                  "
                >
                  <FileSearch className="size-3.5" />
                  Review laporan
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
