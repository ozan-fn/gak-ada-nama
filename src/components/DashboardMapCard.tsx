import {
  Layers,
  Navigation,
  Minus,
  Plus,
  AlertTriangle,
  Factory,
  Thermometer,
  CloudRain,
  Wind,
  Droplet,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BaseEnvironmentMap } from "./maps/BaseEnvironmentMap";

export default function DashboardMapCard() {
  return (
    <BaseEnvironmentMap
      initialCenter={[106.8456, -6.2088]}
      initialZoom={12}
      autoFitStations={true}
      autoZoomOnLocate={true}
      autoLocateOnMount={true}
    >
      {({ alerts, locate, isLocating, handleZoom, showLayers, setShowLayers, showRainRadar, setShowRainRadar }) => {
        const activeAlertsCount = alerts.length;

        return (
          <>
            {/* Top Left Container: Active Alerts */}
            <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
              {activeAlertsCount > 0 && (
                <Link to="/dashboard/risk-map">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/60 px-3 py-2 shadow-sm backdrop-blur-md transition-colors hover:bg-white/80"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-neutral-800">
                      {activeAlertsCount} Active Alert
                      {activeAlertsCount > 1 ? "s" : ""}
                    </span>
                  </button>
                </Link>
              )}
            </div>

            {/* Bottom Left: Danger Summary */}
            {alerts.length > 0 && (
              <div className="absolute bottom-3 left-3 z-10 max-w-xs rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-md backdrop-blur-sm">
                <h3 className="mb-2 text-xs font-semibold text-neutral-800">
                  Dangers Nearby
                </h3>
                <div className="space-y-1.5">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={`${alert.type}-${alert.severity}`}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span className="shrink-0 mt-0.5">
                        {alert.type === "aqi" ? (
                          <Factory className="h-4 w-4 text-orange-500" />
                        ) : alert.type === "temperature" ? (
                          <Thermometer className="h-4 w-4 text-red-500" />
                        ) : alert.type === "rain" ? (
                          <CloudRain className="h-4 w-4 text-blue-500" />
                        ) : alert.type === "wind" ? (
                          <Wind className="h-4 w-4 text-gray-600" />
                        ) : alert.type === "humidity" ? (
                          <Droplet className="h-4 w-4 text-cyan-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </span>
                      <span className="flex-1 text-neutral-700">{alert.message}</span>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard/risk-map">
                  <button
                    type="button"
                    className="mt-2 w-full rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600"
                  >
                    View Risk Map →
                  </button>
                </Link>
              </div>
            )}

            {/* Top Right Controls: Layers, Locate Me */}
            <div className="absolute right-3 top-3 z-10 flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLayers(!showLayers)}
                  className="flex h-9 w-9 items-center justify-center border-b border-neutral-200 transition-colors hover:bg-neutral-50"
                  aria-label="Layers"
                >
                  <Layers className="h-4 w-4 text-neutral-700" />
                </button>
                {showLayers && (
                  <div className="absolute left-0 -translate-x-full top-0 mr-6 w-52 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg z-20">
                    <p className="mb-3 text-xs font-semibold text-neutral-700">Map Layers</p>
                    
                    <label className="flex items-center gap-2 text-sm text-neutral-700 mb-2">
                      <input 
                        type="checkbox" 
                        checked 
                        disabled 
                        className="h-4 w-4 rounded border-neutral-300"
                      />
                      <span>AQI Heatmap</span>
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showRainRadar} 
                        onChange={(e) => setShowRainRadar(e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 cursor-pointer"
                      />
                      <span>Rain Radar</span>
                    </label>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => locate()}
                disabled={isLocating}
                className="flex h-9 w-9 items-center justify-center border-b border-neutral-200 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Locate me"
              >
                <Navigation
                  className={`h-4 w-4 text-neutral-700 ${
                    isLocating ? "animate-pulse" : ""
                  }`}
                />
              </button>
            </div>

            {/* Bottom Right Controls: Zoom */}
            <div className="absolute bottom-3 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => handleZoom(-1)}
                className="flex h-9 w-9 items-center justify-center border-b border-neutral-200 transition-colors hover:bg-neutral-50"
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4 text-neutral-700" />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(1)}
                className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-neutral-50"
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4 text-neutral-700" />
              </button>
            </div>
          </>
        );
      }}
    </BaseEnvironmentMap>
  );
}
