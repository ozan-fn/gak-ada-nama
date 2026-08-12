import { createFileRoute } from "@tanstack/react-router";
import DashboardMapCard from "#/components/DashboardMapCard";
import { ChartAQITrend } from "#/components/ChartAQITrend";
import RegionalExtreme from "#/components/RegionalExtreme";
import WeatherInformation from "#/components/WheatherInformation";
import DaysForecast from "#/components/DaysForecast";
import PrecipitationOverview from "#/components/PrecipitationOverview";

export const Route = createFileRoute("/_protected/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <main className="min-h-screen">
      <div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-stretch">
        {/* Left */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-2/3">
          {/* Map Integration */}
          <div className="h-110 overflow-hidden rounded-lg bg-white shadow-sm">
            <DashboardMapCard />
          </div>

          {/* Bottom */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            {/* Regional Extremes */}
            <div className="flex w-full items-center justify-center rounded-lg bg-white shadow-sm sm:w-[37.5%]">
              <RegionalExtreme />
            </div>

            {/* Chart AQI */}
            <div className="w-full overflow-hidden rounded-lg bg-white shadow-sm sm:w-[62.5%]">
              <ChartAQITrend />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-1/3">
          {/* Weather Information */}
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
            <WeatherInformation />
          </div>
          {/* 7 days forecast */}
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
            <DaysForecast />
          </div>
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
            <PrecipitationOverview />
          </div>
        </div>
      </div>
    </main>
  );
}
