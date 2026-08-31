import { AlertTriangle, ChevronDown, Flame, MapPin, Wind } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "./ui/skeleton";

export default function AlertWidget() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <Skeleton className="h-8 w-32 mx-auto rounded-full" />
        <Skeleton className="h-40 w-40 rounded-full mx-auto mt-6" />
        <Skeleton className="h-10 w-full rounded-lg mt-6" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      {/* Location pill */}
      <div className="flex justify-center">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition-all duration-200 hover:bg-neutral-50 hover:shadow-md hover:border-neutral-300"
        >
          <MapPin className="h-3 w-3 text-neutral-400 transition-colors duration-200" />
          Jakarta, ID
          <ChevronDown className="h-3 w-3 text-neutral-400 transition-transform duration-200 group-hover:rotate-180" />
        </button>
      </div>

      {/* Radar area */}
      <div className="relative mt-6 flex items-center justify-center">
        {/* Concentric dashed circles with fade animation */}
        <div className="absolute h-44 w-44 rounded-full border border-dashed border-neutral-200 animate-[pulse_3s_ease-in-out_infinite]" />
        <div className="absolute h-32 w-32 rounded-full border border-dashed border-neutral-200/80 animate-[pulse_3s_ease-in-out_0.5s_infinite]" />

        {/* Left stat pill */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-medium text-neutral-600 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
          <Flame className="h-3 w-3 text-red-500" />3 hotspot
        </div>

        {/* Right stat pill */}
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-medium text-neutral-600 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
          <Wind className="h-3 w-3 text-sky-500" />
          45km/h
        </div>

        {/* Pulsing threat marker with smooth animation */}
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-red-100 transition-all duration-300 hover:shadow-lg hover:scale-110">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400/30 opacity-75"
            style={{ animationDuration: "2s" }}
          />
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400/20 opacity-60"
            style={{ animationDuration: "2s", animationDelay: "0.5s" }}
          />
          <AlertTriangle className="relative h-5 w-5 text-red-500 transition-transform duration-300 hover:rotate-12" />
        </div>
      </div>

      {/* Warning banner with slide-in animation */}
      <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 transition-all duration-300 hover:bg-amber-100 hover:border-amber-300 animate-[fadeIn_0.5s_ease-out]">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 animate-[pulse_2s_ease-in-out_infinite]" />
        <p className="text-xs font-medium text-amber-700">
          Titik Api Terdeteksi — 3 Lokasi
        </p>
      </div>
    </div>
  );
}
