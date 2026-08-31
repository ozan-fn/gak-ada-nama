import {
  AlertCircle,
  Brain,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EcoLensLocationSearch from "@/components/ecolens/EcoLensLocationSearch";
import { useEcoLensLocationContextSafe } from "@/contexts/EcoLensLocationContext";
import { useEcoLensLocation } from "@/components/ecolens/useEcoLensLocation";
import {
  ECO_LENS_CATEGORIES,
  type EcoLensAnalysis,
  type EcoLensCategory,
} from "@/types/ecolens";

export type EcoLensFormErrors = {
  location?: string;
  description?: string;
};

type EcoLensReviewDrawerProps = {
  open: boolean;
  analysis: EcoLensAnalysis | null;
  analysisError: string | null;
  category: EcoLensCategory;
  description: string;
  errors: EcoLensFormErrors;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryChange: (category: EcoLensCategory) => void;
  onDescriptionChange: (description: string) => void;
  onRetryAnalysis: () => void;
  onRetake: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EcoLensReviewDrawer({
  open,
  analysis,
  analysisError,
  category,
  description,
  errors,
  isSubmitting = false,
  onOpenChange,
  onCategoryChange,
  onDescriptionChange,
  onRetryAnalysis,
  onRetake,
  onSubmit,
}: EcoLensReviewDrawerProps) {
  const context = useEcoLensLocationContextSafe();
  const location = context?.location ?? "";
  const gps = useEcoLensLocation();
  const hasTriggeredGpsRef = useRef(false);

  useEffect(() => {
    if (open && !location.trim() && !hasTriggeredGpsRef.current) {
      hasTriggeredGpsRef.current = true;
      gps.requestLocation();
    }

    if (!open) {
      hasTriggeredGpsRef.current = false;
    }
  }, [open, location, gps]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
      <DrawerContent
        className="
          border-neutral-200/80
          bg-neutral-50
          text-neutral-900
          shadow-[0_-12px_50px_rgba(15,23,42,0.12)]
          [--drawer-bleed-background:#fafafa]

          dark:border-neutral-800
          dark:bg-neutral-950
          dark:text-neutral-100
          dark:shadow-[0_-12px_50px_rgba(0,0,0,0.45)]
          dark:[--drawer-bleed-background:#0a0a0a]

          [--drawer-content-max-height:min(92dvh,54rem)]
          md:[--drawer-content-max-height:min(90dvh,48rem)]
        "
      >
        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden">
          {/* Header */}
          <DrawerHeader
            className="
              shrink-0
              border-b border-neutral-200/70
              bg-white
              px-4 pb-3 pt-2.5
              sm:px-6 sm:pb-3.5
              lg:px-8 lg:pt-2

              dark:border-neutral-800
              dark:bg-neutral-900
            "
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="
                        grid size-8 shrink-0 place-items-center
                        rounded-lg
                        border border-sky-100
                        bg-sky-50
                        text-sky-600

                        dark:border-sky-900/70
                        dark:bg-sky-950/60
                        dark:text-sky-400
                      "
                    >
                      <Brain className="size-4" />
                    </div>

                    <DrawerTitle
                      className="
                        text-sm font-semibold tracking-tight
                        text-neutral-900
                        sm:text-base

                        dark:text-neutral-100
                      "
                    >
                      Review laporan
                    </DrawerTitle>
                  </div>

                  <span
                    className="
                      inline-flex items-center gap-1
                      rounded-full
                      border border-sky-100
                      bg-sky-50
                      px-2 py-1
                      text-[9px] font-semibold
                      text-sky-700

                      dark:border-sky-900/70
                      dark:bg-sky-950/60
                      dark:text-sky-300
                    "
                  >
                    <Sparkles className="size-2.5" />
                    AI Vision
                  </span>
                </div>

                <DrawerDescription
                  className="
                    mt-1.5 max-w-2xl text-left
                    text-[11px] leading-relaxed
                    text-neutral-500
                    sm:text-xs

                    dark:text-neutral-400
                  "
                >
                  Periksa hasil deteksi dan pastikan informasi laporan sudah
                  sesuai sebelum dikirim.
                </DrawerDescription>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                className="
                  size-8 shrink-0 rounded-lg
                  text-neutral-400
                  hover:bg-neutral-100
                  hover:text-neutral-700

                  dark:text-neutral-500
                  dark:hover:bg-neutral-800
                  dark:hover:text-neutral-200
                "
                aria-label="Tutup review laporan"
              >
                <X className="size-4" />
              </Button>
            </div>
          </DrawerHeader>

          {/* Content */}
          <form
            onSubmit={onSubmit}
            className="
              min-h-0
              flex-1
              overflow-y-auto
              overscroll-contain
              px-3 py-3

              sm:px-5 sm:py-4

              md:overflow-hidden
              md:px-6
              md:py-4

              lg:px-8
              lg:py-4
            "
          >
            <div
              className="
                mx-auto
                grid
                max-w-5xl
                gap-3

                md:h-full
                md:grid-cols-[0.9fr_1.1fr]

                lg:gap-4
              "
            >
              {/* AI INSIGHT */}
              <section
                className="
                  flex
                  min-h-0
                  flex-col
                  overflow-hidden
                  rounded-xl
                  border border-neutral-200/80
                  bg-white
                  shadow-[0_1px_2px_rgba(0,0,0,0.03)]

                  dark:border-neutral-800
                  dark:bg-neutral-900
                  dark:shadow-[0_1px_2px_rgba(0,0,0,0.18)]
                "
              >
                <div
                  className="
                    flex shrink-0 items-center justify-between
                    border-b border-neutral-100
                    px-4 py-3

                    dark:border-neutral-800
                  "
                >
                  <div>
                    <p
                      className="
                        text-xs font-semibold
                        text-neutral-900

                        dark:text-neutral-100
                      "
                    >
                      Hasil deteksi
                    </p>

                    <p
                      className="
                        mt-0.5 text-[10px]
                        text-neutral-400

                        dark:text-neutral-500
                      "
                    >
                      Insight dari EcoLens AI
                    </p>
                  </div>

                  {analysis?.urgency && (
                    <span
                      className={`
                        inline-flex items-center rounded-full
                        px-2 py-1
                        text-[9px] font-semibold

                        ${
                          analysis.urgency === "Sangat Tinggi" ||
                          analysis.urgency === "Tinggi"
                            ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                            : analysis.urgency === "Sedang"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        }
                      `}
                    >
                      {analysis.urgency}
                    </span>
                  )}
                </div>

                <div
                  className="
                    min-h-0
                    flex-1
                    overflow-auto
                    p-4
                    md:overflow-hidden
                  "
                >
                  {/* Analysis Error */}
                  {analysisError && (
                    <div
                      aria-live="polite"
                      className="
                        rounded-lg
                        border border-amber-200/80
                        bg-amber-50/70
                        p-3

                        dark:border-amber-900/70
                        dark:bg-amber-950/30
                      "
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className="
                            grid size-7 shrink-0 place-items-center
                            rounded-md
                            bg-white
                            text-amber-600
                            shadow-xs

                            dark:bg-amber-950/70
                            dark:text-amber-400
                          "
                        >
                          <AlertCircle className="size-3.5" />
                        </div>

                        <div className="min-w-0">
                          <p
                            className="
                              text-[11px] font-semibold
                              text-amber-900

                              dark:text-amber-200
                            "
                          >
                            Analisis belum tersedia
                          </p>

                          <p
                            className="
                              mt-1 text-[10px] leading-relaxed
                              text-amber-800

                              dark:text-amber-300/90
                            "
                          >
                            {analysisError}
                          </p>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={onRetryAnalysis}
                            className="
                              mt-2.5 h-7 rounded-md
                              border-amber-200
                              bg-white
                              px-2.5
                              text-[10px]
                              font-medium
                              text-amber-800
                              hover:bg-amber-100

                              dark:border-amber-900
                              dark:bg-amber-950/50
                              dark:text-amber-300
                              dark:hover:bg-amber-950
                            "
                          >
                            <RefreshCw className="size-3" />
                            Coba analisis lagi
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {analysis && (
                    <div className="space-y-3">
                      <div
                        className="
                          rounded-lg
                          border border-sky-100
                          bg-sky-50/60
                          p-3.5

                          dark:border-sky-900/70
                          dark:bg-sky-950/30
                        "
                      >
                        <div
                          className="
                            flex items-center gap-1.5
                            text-sky-700

                            dark:text-sky-300
                          "
                        >
                          <Sparkles className="size-3" />

                          <p className="text-[9px] font-semibold tracking-wide">
                            Ringkasan visual
                          </p>
                        </div>

                        <p
                          className="
                            mt-2 text-xs leading-[1.7]
                            text-neutral-700

                            dark:text-neutral-300
                          "
                        >
                          {analysis.summary}
                        </p>
                      </div>

                      <div
                        className="
                          flex items-start gap-2.5
                          rounded-lg
                          border border-emerald-100
                          bg-emerald-50/50
                          p-3

                          dark:border-emerald-900/70
                          dark:bg-emerald-950/25
                        "
                      >
                        <CheckCircle2
                          className="
                            mt-0.5 size-3.5 shrink-0
                            text-emerald-600

                            dark:text-emerald-400
                          "
                        />

                        <p
                          className="
                            text-[10px] leading-relaxed
                            text-emerald-800

                            dark:text-emerald-300
                          "
                        >
                          Kategori dan deskripsi awal telah disiapkan
                          berdasarkan hasil analisis foto.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* No Analysis */}
                  {!analysis && !analysisError && (
                    <div
                      className="
                        flex min-h-32
                        items-center justify-center
                        rounded-lg
                        border border-dashed
                        border-neutral-200
                        bg-neutral-50
                        px-5
                        text-center

                        dark:border-neutral-800
                        dark:bg-neutral-950
                      "
                    >
                      <div>
                        <div
                          className="
                            mx-auto grid size-9 place-items-center
                            rounded-lg
                            bg-white
                            text-neutral-400
                            shadow-xs

                            dark:bg-neutral-900
                            dark:text-neutral-500
                          "
                        >
                          <Brain className="size-4" />
                        </div>

                        <p
                          className="
                            mt-2 text-[11px] font-medium
                            text-neutral-600

                            dark:text-neutral-300
                          "
                        >
                          Foto siap ditinjau
                        </p>

                        <p
                          className="
                            mt-1 text-[10px] leading-relaxed
                            text-neutral-400

                            dark:text-neutral-500
                          "
                        >
                          Kamu tetap dapat melengkapi informasi secara manual.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* FORM */}
              <section
                className="
                  flex
                  min-h-0
                  flex-col
                  overflow-hidden
                  rounded-xl
                  border border-neutral-200/80
                  bg-white
                  shadow-[0_1px_2px_rgba(0,0,0,0.03)]

                  dark:border-neutral-800
                  dark:bg-neutral-900
                  dark:shadow-[0_1px_2px_rgba(0,0,0,0.18)]
                "
              >
                <div
                  className="
                    shrink-0
                    border-b border-neutral-100
                    px-4 py-3

                    dark:border-neutral-800
                  "
                >
                  <p
                    className="
                      text-xs font-semibold
                      text-neutral-900

                      dark:text-neutral-100
                    "
                  >
                    Detail laporan
                  </p>

                  <p
                    className="
                      mt-0.5 text-[10px]
                      text-neutral-400

                      dark:text-neutral-500
                    "
                  >
                    Pastikan informasi berikut sudah benar.
                  </p>
                </div>

                <div
                  className="
                    min-h-0
                    flex-1
                    overflow-auto
                    p-4
                    md:overflow-hidden
                  "
                >
                  <div className="flex h-full flex-col">
                    {/* Category */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="ecolens-category"
                        className="
                          text-[11px] font-medium
                          text-neutral-700

                          dark:text-neutral-300
                        "
                      >
                        Kategori masalah
                      </Label>

                      <select
                        id="ecolens-category"
                        value={category}
                        disabled={isSubmitting}
                        onChange={(event) => {
                          const selectedCategory = ECO_LENS_CATEGORIES.find(
                            (item) => item === event.target.value,
                          );

                          if (selectedCategory) {
                            onCategoryChange(selectedCategory);
                          }
                        }}
                        className="
                          h-10 w-full appearance-none
                          rounded-lg
                          border border-neutral-200
                          bg-neutral-50/70
                          px-3
                          text-xs
                          text-neutral-700
                          outline-none
                          transition

                          hover:border-neutral-300

                          focus:border-sky-500
                          focus:bg-white
                          focus:ring-2
                          focus:ring-sky-100

                          disabled:cursor-not-allowed
                          disabled:opacity-60

                          dark:border-neutral-700
                          dark:bg-neutral-950
                          dark:text-neutral-200
                          dark:hover:border-neutral-600
                          dark:focus:border-sky-500
                          dark:focus:bg-neutral-900
                          dark:focus:ring-sky-950
                        "
                      >
                        {ECO_LENS_CATEGORIES.map((item) => (
                          <option
                            key={item}
                            value={item}
                            className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                          >
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Location */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="ecolens-location"
                          className="
                            text-[11px] font-medium
                            text-neutral-700

                            dark:text-neutral-300
                          "
                        >
                          Lokasi kejadian
                        </Label>

                        <span
                          className="
                            text-[9px]
                            text-neutral-400

                            dark:text-neutral-500
                          "
                        >
                          GPS digunakan jika tersedia
                        </span>
                      </div>

                      <EcoLensLocationSearch variant="compact" disabled />

                      {errors.location && (
                        <p
                          id="ecolens-location-error"
                          className="
                            text-[10px]
                            text-red-600

                            dark:text-red-400
                          "
                        >
                          {errors.location}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="mt-4 flex min-h-0 flex-1 flex-col space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="ecolens-description"
                          className="
                            text-[11px] font-medium
                            text-neutral-700

                            dark:text-neutral-300
                          "
                        >
                          Deskripsi laporan
                        </Label>

                        <span
                          className="
                            text-[9px]
                            text-neutral-400

                            dark:text-neutral-500
                          "
                        >
                          Maks. 1000 karakter
                        </span>
                      </div>

                      <Textarea
                        id="ecolens-description"
                        value={description}
                        maxLength={1_000}
                        rows={5}
                        disabled={isSubmitting}
                        onChange={(event) =>
                          onDescriptionChange(event.target.value)
                        }
                        placeholder="Jelaskan kondisi yang terlihat pada foto..."
                        aria-invalid={Boolean(errors.description)}
                        aria-describedby={
                          errors.description
                            ? "ecolens-description-error"
                            : undefined
                        }
                        className="
                          min-h-28
                          flex-1
                          resize-none
                          rounded-lg
                          border-neutral-200
                          bg-neutral-50/70
                          px-3 py-2.5
                          text-xs
                          leading-relaxed
                          text-neutral-700
                          placeholder:text-neutral-400
                          transition

                          focus-visible:border-sky-500
                          focus-visible:bg-white
                          focus-visible:ring-sky-100

                          md:min-h-24

                          dark:border-neutral-700
                          dark:bg-neutral-950
                          dark:text-neutral-200
                          dark:placeholder:text-neutral-600
                          dark:focus-visible:border-sky-500
                          dark:focus-visible:bg-neutral-900
                          dark:focus-visible:ring-sky-950
                        "
                      />

                      <div className="flex shrink-0 items-start justify-between gap-3">
                        <p
                          id="ecolens-description-error"
                          className="
                            text-[10px]
                            text-red-600

                            dark:text-red-400
                          "
                        >
                          {errors.description}
                        </p>

                        <span
                          className="
                            shrink-0
                            text-[10px]
                            tabular-nums
                            text-neutral-400

                            dark:text-neutral-500
                          "
                        >
                          {description.length}/1000
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="
                        mt-4
                        shrink-0
                        border-t
                        border-neutral-100
                        pt-4

                        dark:border-neutral-800
                      "
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSubmitting}
                          onClick={onRetake}
                          className="
                            h-10
                            rounded-lg
                            border-neutral-200
                            bg-white
                            px-4
                            text-xs
                            font-medium
                            text-neutral-700
                            hover:bg-neutral-50

                            dark:border-neutral-700
                            dark:bg-neutral-900
                            dark:text-neutral-300
                            dark:hover:bg-neutral-800

                            sm:min-w-28
                          "
                        >
                          <RotateCcw
                            className="
                              size-3.5
                              text-neutral-500

                              dark:text-neutral-400
                            "
                          />
                          Foto ulang
                        </Button>

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="
                            h-10
                            rounded-lg
                            bg-sky-500
                            px-4
                            text-xs
                            font-semibold
                            text-white
                            shadow-sm
                            transition-all
                            hover:bg-sky-600
                            hover:shadow-md
                            active:scale-[0.99]

                            disabled:cursor-not-allowed
                            disabled:opacity-50

                            dark:bg-sky-600
                            dark:hover:bg-sky-500
                          "
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin" />

                              <span className="leading-4">
                                Menyimpan laporan...
                              </span>
                            </>
                          ) : (
                            <>
                              <Send className="size-3.5" />
                              Kirim laporan
                            </>
                          )}
                        </Button>
                      </div>

                      <p
                        className="
                          mt-2.5
                          text-center
                          text-[9px]
                          leading-relaxed
                          text-neutral-400

                          dark:text-neutral-500
                        "
                      >
                        Laporan akan disimpan bersama konteks lingkungan dan
                        analisis risiko.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
