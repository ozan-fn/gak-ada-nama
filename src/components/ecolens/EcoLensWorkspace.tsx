import { useServerFn } from "@tanstack/react-start";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { useEcoLensLocationContext } from "#/contexts/EcoLensLocationContext";
import { analyzeEcoLens } from "#/lib/ecolens.functions";
import {
  type CreateReportResult,
  createReportFn,
  refreshReportAssessmentFn,
} from "#/lib/reports.functions";
import type { EcoLensAnalysis, EcoLensCategory } from "#/types/ecolens";

const EMPTY_CATEGORY: EcoLensCategory = "Lainnya";

export function EcoLensWorkspace() {
  const analyzeEcoLensFn = useServerFn(analyzeEcoLens);
  const createReport = useServerFn(createReportFn);
  const refreshReportAssessment = useServerFn(refreshReportAssessmentFn);

  const camera = useEcoLensCamera();
  const gps = useEcoLensLocation();

  const { location, setLocation, coordinates } = useEcoLensLocationContext();

  const mountedRef = useRef(false);
  const latestAnalysisRequest = useRef(0);
  const submitLockRef = useRef(false);
  const activeResultReportIdRef = useRef<string | null>(null);

  const [stage, setStage] = useState<EcoLensStage>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [analysis, setAnalysis] = useState<EcoLensAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [category, setCategory] = useState<EcoLensCategory>(EMPTY_CATEGORY);
  const [description, setDescription] = useState("");
  const [formErrors, setFormErrors] = useState<EcoLensFormErrors>({});
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<CreateReportResult | null>(null);

  // =========================================================
  // Camera startup
  // =========================================================

  // Kamera hanya dimulai sekali ketika workspace pertama kali dipasang.
  // biome-ignore lint/correctness/useExhaustiveDependencies: startup mount-only mencegah permintaan izin kamera berulang.
  useEffect(() => {
    mountedRef.current = true;
    void handleStartCamera();

    return () => {
      mountedRef.current = false;
      latestAnalysisRequest.current += 1;
    };
  }, []);

  // =========================================================
  // Location
  // =========================================================

  useEffect(() => {
    if (!gps.suggestedLocation) return;

    if (!location.trim()) {
      setLocation(gps.suggestedLocation);
    }
  }, [gps.suggestedLocation, location, setLocation]);

  // =========================================================
  // Draft
  // =========================================================

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
    setSubmissionResult(null);

    activeResultReportIdRef.current = null;
  };

  // =========================================================
  // Camera
  // =========================================================

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

  // =========================================================
  // AI Analysis
  // =========================================================

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

      if (latestAnalysisRequest.current !== requestId) {
        return;
      }

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
      if (latestAnalysisRequest.current !== requestId) {
        return;
      }

      console.error(
        "[EcoLens] Terjadi kesalahan saat memproses analisis:",
        error,
      );

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

  // =========================================================
  // Capture
  // =========================================================

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

  // =========================================================
  // Upload
  // =========================================================

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

  // =========================================================
  // Retake
  // =========================================================

  const handleRetake = async () => {
    clearDraft();

    setStage("requesting-camera");

    const result = await camera.startCamera();

    if (!mountedRef.current) return;

    setStage(result.success ? "live" : "error");
  };

  // =========================================================
  // Retry Analysis
  // =========================================================

  const handleRetryAnalysis = () => {
    if (capturedImage) {
      void runAnalysis(capturedImage);
    }
  };

  // =========================================================
  // Submit Report
  // =========================================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitLockRef.current) return;

    const nextErrors: EcoLensFormErrors = {};

    if (!location.trim()) {
      nextErrors.location = "Lokasi kejadian wajib diisi.";
    }

    if (!description.trim()) {
      nextErrors.description = "Deskripsi laporan wajib diisi.";
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmissionResult(null);
    activeResultReportIdRef.current = null;

    try {
      const result = await createReport({
        data: {
          title: `${category} di ${location.trim()}`,
          description: description.trim(),
          category,
          urgency: analysis?.urgency || "Sedang",

          locationName: location.trim(),

          latitude: coordinates?.latitude ?? gps.coordinates?.latitude,

          longitude: coordinates?.longitude ?? gps.coordinates?.longitude,

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

      activeResultReportIdRef.current = result.report.id;

      setSubmissionResult(result);
      setReviewOpen(false);
      setStage("demo-success");
    } catch (error) {
      if (!mountedRef.current) return;

      const message =
        error instanceof Error && error.message.includes("Unauthorized")
          ? "Silakan login terlebih dahulu untuk mengirim laporan."
          : "Gagal menyimpan laporan. Silakan coba beberapa saat lagi.";

      setFormErrors({
        description: message,
      });
    } finally {
      submitLockRef.current = false;

      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  // =========================================================
  // Assessment
  // =========================================================

  const handleRefreshAssessment = useCallback(
    async (reportId: string) => {
      const result = await refreshReportAssessment({
        data: { reportId },
      });

      if (mountedRef.current && activeResultReportIdRef.current === reportId) {
        setSubmissionResult(result);
      }

      return result;
    },
    [refreshReportAssessment],
  );

  // =========================================================
  // Create Another
  // =========================================================

  const handleCreateAnother = () => {
    clearDraft();
    void handleStartCamera();
  };

  // =========================================================
  // Description
  // =========================================================

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
    <main
      className="
        relative flex h-[calc(100dvh-3.5rem)]
        min-h-0 flex-col overflow-hidden
        bg-neutral-100
        transition-colors
        dark:bg-neutral-950
      "
    >
      {/* =====================================================
          Camera Workspace
          ===================================================== */}

      <div
        className="
          relative min-h-0 flex-1
          bg-neutral-100
          dark:bg-neutral-950
        "
      >
        <EcoLensCameraViewport
          stage={stage}
          videoRef={camera.videoRef}
          capturedImage={capturedImage}
          cameraError={camera.error || captureError}
          isCameraReady={camera.isReady}
          onStartCamera={() => void handleStartCamera()}
          onCapture={handleCapture}
          onUploadImage={(file) => void handleUploadImage(file)}
          onOpenReview={() => setReviewOpen(true)}
          onVideoReady={camera.markVideoReady}
        />
      </div>

      {/* =====================================================
          Review Drawer
          ===================================================== */}

      <EcoLensReviewDrawer
        open={reviewOpen && stage === "review"}
        analysis={analysis}
        analysisError={analysisError}
        category={category}
        description={description}
        errors={formErrors}
        isSubmitting={isSubmitting}
        onOpenChange={setReviewOpen}
        onCategoryChange={setCategory}
        onDescriptionChange={handleDescriptionChange}
        onRetryAnalysis={handleRetryAnalysis}
        onRetake={() => void handleRetake()}
        onSubmit={handleSubmit}
      />

      {/* =====================================================
          Success Dialog
          ===================================================== */}

      <EcoLensSuccessDialog
        open={stage === "demo-success"}
        result={submissionResult}
        onCreateAnother={handleCreateAnother}
        onRefreshAssessment={handleRefreshAssessment}
      />
    </main>
  );
}
