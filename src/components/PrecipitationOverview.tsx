import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  ReferenceLine,
  Cell,
} from "recharts";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { PrecipitationOverviewSkeleton } from "./skeletons/PrecipitationOverviewSkeleton";

type LocationParams =
  { latitude: number; longitude: number } | { city: string };

type PrecipitationOverviewProps = {
  location?: LocationParams;
};

export default function PrecipitationOverview({
  location,
}: PrecipitationOverviewProps) {
  const { weather, loading } = useEnvironmentData(location);

  if (loading || !weather) {
    return <PrecipitationOverviewSkeleton />;
  }

  // Get current hour in user's local timezone
  const localNow = new Date();
  const currentHour = localNow.getHours();
  const currentTime = `${currentHour.toString().padStart(2, "0")}.00`;

  // Get hourly precipitation data (24 hours window)
  const precipitationData = weather.hourly.precipitation
    .slice(0, 24)
    .map((precip: number, index: number) => {
      const date = new Date(weather.hourly.time[index]);
      const hour = date.getHours();
      const actualMm = Math.round(precip * 10) / 10;

      return {
        time: `${hour.toString().padStart(2, "0")}.00`,
        mm: actualMm === 0 ? 0.01 : actualMm,
        actualMm,
      };
    });

  // Generate dynamic ticks
  const dynamicTicks: string[] = [];

  for (let i = 0; i < precipitationData.length; i += 2) {
    dynamicTicks.push(precipitationData[i].time);
  }

  const totalRainToday = Math.round(weather.daily.rainSum[0] * 10) / 10;

  // Find current hour
  const nowPoint =
    precipitationData.find((d) => d.time === currentTime) ||
    precipitationData[0];

  return (
    <div className="flex min-h-70 w-full flex-col bg-white p-2 dark:bg-neutral-800 md:p-4">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Intensitas Hujan
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            Pembaruan estimasi curah hujan setiap jam
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-1 shrink-0">
        <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
          Total Curah Hujan
        </p>

        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {totalRainToday} mm
          </p>

          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
            hari ini
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-1 h-35 w-full min-w-0 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={precipitationData}
            barSize={18}
            margin={{
              top: 20,
              right: 18,
              left: 0,
              bottom: 0,
            }}
          >
            {/* X Axis */}
            <XAxis
              dataKey="time"
              ticks={dynamicTicks}
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: "currentColor",
              }}
              className="text-neutral-400 dark:text-neutral-500"
              dy={8}
            />

            {/* Precipitation */}
            <Bar dataKey="mm" radius={[3, 3, 0, 0]}>
              {precipitationData.map(
                ({
                  time,
                  mm,
                  actualMm,
                }: {
                  time: string;
                  mm: number;
                  actualMm: number;
                }) => (
                  <Cell
                    key={time}
                    className={
                      actualMm <= 0
                        ? "fill-neutral-200 dark:fill-neutral-700"
                        : "fill-sky-500 dark:fill-sky-400"
                    }
                  />
                ),
              )}
            </Bar>

            {/* Current Time */}
            <ReferenceLine
              x={nowPoint.time}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              label={{
                value: "Sekarang",
                position: "top",
                offset: 10,
                fill: "#ef4444",
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
