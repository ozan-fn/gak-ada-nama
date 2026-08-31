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
  XCircle,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type RefObject,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";

export type EcoLensStage =
  | "idle"
  | "requesting-camera"
  | "live"
  | "captured"
  | "analyzing"
  | "rejected"
  | "review"
  | "demo-success"
  | "error";

type EcoLensCameraViewportProps = {
  stage: EcoLensStage;
  videoRef: RefObject<HTMLVideoElement | null>;
  capturedImage: string | null;
  cameraError: string | null;
  rejection: { reason: string; guidance: string } | null;
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
  rejection,
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

    if (file?.type.startsWith("image/")) {
      onUploadImage(file);
    }
  };

  return (
    <section className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 p-2 sm:p-3 lg:p-4">
        <section
          aria-label="Area foto laporan EcoLens"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative flex min-h-0 w-full flex-1
            overflow-hidden rounded-2xl
            border
            shadow-sm
            transition-all duration-200
            ${
              stage === "live"
                ? "border-neutral-800 bg-neutral-950 shadow-black/20"
                : "border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            }
            ${
              isDragging
                ? "border-sky-400 bg-sky-50/40 dark:border-sky-500 dark:bg-sky-950/20"
                : ""
            }
          `}
        >
          {/* Soft background */}
          {stage !== "live" && (
            <div
              className="
                pointer-events-none absolute inset-0
                bg-[radial-gradient(circle_at_50%_18%,rgba(14,165,233,0.08),transparent_40%)]
                dark:bg-[radial-gradient(circle_at_50%_18%,rgba(14,165,233,0.10),transparent_42%)]
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
                <div className="relative aspect-4/3 w-full max-w-2xl rounded-2xl border border-white/65 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]">
                  <span className="absolute left-0 top-0 size-8 rounded-tl-2xl border-l-[3px] border-t-[3px] border-sky-400" />
                  <span className="absolute right-0 top-0 size-8 rounded-tr-2xl border-r-[3px] border-t-[3px] border-sky-400" />
                  <span className="absolute bottom-0 left-0 size-8 rounded-bl-2xl border-b-[3px] border-l-[3px] border-sky-400" />
                  <span className="absolute bottom-0 right-0 size-8 rounded-br-2xl border-b-[3px] border-r-[3px] border-sky-400" />

                  <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 shadow-sm" />
                </div>
              </div>

              {/* Camera controls */}
              <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-5 sm:px-8 sm:pb-7">
                <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
                  {/* Helper */}
                  <div className="rounded-full border border-white/15 bg-black/45 px-3.5 py-1.5 text-[10px] font-medium text-white shadow-lg backdrop-blur-xl sm:text-[11px]">
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
                        border-[3px] border-white/90
                        bg-white/10
                        p-1.5
                        shadow-[0_10px_35px_rgba(0,0,0,0.3)]
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
                      <span
                        className="
                          pointer-events-none
                          absolute -inset-1.5
                          rounded-full
                          border border-white/15
                          opacity-0
                          transition-opacity duration-200
                          group-hover:opacity-100
                        "
                      />

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
                        border border-white/20
                        bg-black/40
                        text-white
                        shadow-lg
                        backdrop-blur-xl
                        transition-all duration-150
                        hover:scale-105
                        hover:border-white/35
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
              <div className="grid size-14 place-items-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-400">
                <Camera className="size-6.5" />
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-400">
                <Sparkles className="size-3" />
                EcoLens AI
              </div>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                Dokumentasikan kondisi lingkungan
              </h2>

              <p className="mt-2 max-w-lg text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-[13px]">
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
                    shadow-sm
                    hover:bg-sky-600
                    dark:bg-sky-500
                    dark:hover:bg-sky-400
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
                    shadow-sm
                    hover:bg-neutral-50
                    dark:border-neutral-700
                    dark:bg-neutral-900
                    dark:text-neutral-300
                    dark:hover:bg-neutral-800
                  "
                >
                  <Upload className="size-3.5 text-sky-600 dark:text-sky-400" />
                  Unggah Gambar
                </Button>
              </div>

              <p className="mt-5 text-[10px] text-neutral-400 dark:text-neutral-500">
                JPG, PNG, atau WEBP
              </p>
            </div>
          )}

          {/* Requesting camera */}
          {stage === "requesting-camera" && (
            <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="grid size-14 place-items-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-400">
                <LoaderCircle className="size-6 motion-safe:animate-spin" />
              </div>

              <h2 className="mt-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Menyiapkan kamera
              </h2>

              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
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
                  bg-white
                  px-3
                  text-[11px]
                  text-neutral-700
                  hover:bg-neutral-50
                  dark:border-neutral-700
                  dark:bg-neutral-900
                  dark:text-neutral-300
                  dark:hover:bg-neutral-800
                "
              >
                <Upload className="size-3.5 text-sky-600 dark:text-sky-400" />
                Unggah dari perangkat
              </Button>
            </div>
          )}

          {/* Error */}
          {stage === "error" && (
            <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="grid size-14 place-items-center rounded-2xl border border-red-100 bg-red-50 text-red-500 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                <AlertTriangle className="size-6" />
              </div>

              <h2 className="mt-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Kamera tidak dapat digunakan
              </h2>

              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
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
                    shadow-sm
                    hover:bg-sky-600
                    dark:bg-sky-500
                    dark:hover:bg-sky-400
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
                    dark:border-neutral-700
                    dark:bg-neutral-900
                    dark:text-neutral-300
                    dark:hover:bg-neutral-800
                  "
                >
                  <Upload className="size-3.5 text-sky-600 dark:text-sky-400" />
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
                    dark:text-neutral-400
                    dark:hover:bg-neutral-800
                  "
                >
                  Kembali
                </Button>
              </div>
            </div>
          )}

          {/* Analyzing */}
          {stage === "analyzing" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/94 px-6 text-center backdrop-blur-md dark:bg-neutral-950/94">
              <div className="relative grid size-14 place-items-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600 shadow-sm dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-400">
                <Sparkles className="size-6.5 motion-safe:animate-pulse" />
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-400">
                <Sparkles className="size-3" />
                EcoLens AI Vision
              </div>

              <h2 className="mt-2.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Menganalisis foto
              </h2>

              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Sedang mengenali kondisi, menentukan tingkat urgensi, dan
                menyusun draf laporan untukmu.
              </p>

              <div className="mt-5 h-1 w-32 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-sky-400 dark:bg-sky-500" />
              </div>
            </div>
          )}

          {/* Rejected image */}
          {stage === "rejected" && rejection && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/72 px-5 text-center backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-red-300/30 bg-white/96 p-5 shadow-2xl dark:border-red-800/60 dark:bg-neutral-950/96 sm:p-6">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-950/60 dark:text-red-400 dark:ring-red-900">
                  <XCircle className="size-6" />
                </div>

                <div className="mt-3 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  Foto ditolak EcoLens
                </div>

                <h2 className="mt-3 text-lg font-semibold text-neutral-950 dark:text-white">
                  Foto belum layak untuk laporan
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {rejection.reason}
                </p>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-left dark:border-amber-900/70 dark:bg-amber-950/30">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300">
                    Panduan foto ulang
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
                    {rejection.guidance}
                  </p>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    onClick={onStartCamera}
                    className="h-10 gap-2 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    <Camera className="size-4" />
                    Ambil foto ulang
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTriggerUpload}
                    className="h-10 gap-2 rounded-lg border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                  >
                    <Upload className="size-4" />
                    Pilih foto lain
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Review */}
          {stage === "review" && (
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-5 sm:pb-7">
              <div
                className="
                  flex items-center gap-2
                  rounded-xl
                  border border-neutral-200/80
                  bg-white/95
                  p-1.5
                  shadow-lg
                  backdrop-blur-xl
                  dark:border-neutral-700/80
                  dark:bg-neutral-900/95
                "
              >
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
                    dark:border-neutral-700
                    dark:bg-neutral-900
                    dark:text-neutral-300
                    dark:hover:bg-neutral-800
                  "
                >
                  <RotateCcw className="size-3.5 text-sky-600 dark:text-sky-400" />
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
                    shadow-sm
                    hover:bg-sky-600
                    dark:bg-sky-500
                    dark:hover:bg-sky-400
                  "
                >
                  <FileSearch className="size-3.5" />
                  Review laporan
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
