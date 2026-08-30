import { Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { ChartAQITrendSkeleton } from "./skeletons/ChartAQITrendSkeleton";

const chartConfig = {
  aqi: {
    label: "PM2.5",
    color: "hsl(142.1 76.2% 36.3%)",
    icon: Activity,
  },
} satisfies ChartConfig;

type LocationParams =
  { latitude: number; longitude: number } | { city: string };

type ChartAQITrendProps = {
  location?: LocationParams;
};

export function ChartAQITrend({ location }: ChartAQITrendProps) {
  const { aqi, loading } = useEnvironmentData(location);

  if (loading || !aqi || !aqi.forecast) {
    return <ChartAQITrendSkeleton />;
  }

  // Get today's date in Jakarta timezone
  const today = new Date();

  const jakartaToday = new Date(
    today.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    }),
  );

  const todayDateString = jakartaToday.toISOString().split("T")[0];

  // Use PM2.5 forecast data (7 days)
  const chartData = aqi.forecast.pm25.slice(0, 7).map((item) => {
    const forecastDate = new Date(item.day);

    const forecastDateString = forecastDate.toISOString().split("T")[0];

    const dayName = forecastDate.toLocaleDateString("id-ID", {
      weekday: "short",
    });

    const isToday = forecastDateString === todayDateString;

    return {
      day: dayName,
      aqi: item.avg,
      isToday,
    };
  });

  const todayData = chartData.find((d) => d.isToday);

  // Determine status based on current AQI
  let status = "Baik";

  let statusColor =
    "bg-emerald-50/90 border-emerald-100 text-emerald-600 " +
    "dark:bg-emerald-900/30 dark:border-emerald-900/50 dark:text-emerald-400";

  if (aqi.aqi > 100) {
    status = "Tidak Sehat";

    statusColor =
      "bg-red-50/90 border-red-100 text-red-600 " +
      "dark:bg-red-900/30 dark:border-red-900/50 dark:text-red-400";
  } else if (aqi.aqi > 50) {
    status = "Sedang";

    statusColor =
      "bg-amber-50/90 border-amber-100 text-amber-600 " +
      "dark:bg-amber-900/30 dark:border-amber-900/50 dark:text-amber-400";
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/60 p-2 dark:border-neutral-700 md:px-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Tren Kualitas Udara (PM2.5)
          </h3>

          <span
            className={`
              rounded-sm
              border
              px-2
              py-0.5
              text-[10px]
              font-medium
              ${statusColor}
            `}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Chart Content */}
      <div className="relative flex-1 px-1 py-1 md:px-2">
        {/* Background diagonal pattern */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            ml-8
            mr-3
            mt-6
            mb-8
            bg-[repeating-linear-gradient(-45deg,transparent,transparent_8px,hsl(var(--muted-foreground)/0.08)_8px,hsl(var(--muted-foreground)/0.08)_9px)]
          "
        />

        <ChartContainer
          config={chartConfig}
          className="relative z-10 h-full w-full"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 12,
              top: 24,
              bottom: 4,
            }}
          >
            <defs>
              <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-aqi)"
                  stopOpacity={0.5}
                />

                <stop
                  offset="95%"
                  stopColor="var(--color-aqi)"
                  stopOpacity={0.03}
                />
              </linearGradient>
            </defs>

            {/* Grid */}
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-neutral-200/70 dark:stroke-neutral-700/70"
            />

            {/* Y Axis */}
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={25}
              tick={{
                fontSize: 11,
                fill: "currentColor",
              }}
              tickCount={4}
              domain={[
                0,
                (dataMax: number) => Math.ceil((dataMax + 10) / 10) * 10,
              ]}
              className="text-neutral-500 dark:text-neutral-300"
            />

            {/* X Axis */}
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={0}
              tick={{
                fontSize: 12,
                fill: "currentColor",
              }}
              className="text-neutral-500 dark:text-neutral-300"
            />

            {/* Tooltip */}
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            {/* AQI Area */}
            <Area
              dataKey="aqi"
              type="step"
              fill="url(#aqiGradient)"
              stroke="var(--color-aqi)"
              strokeWidth={2}
            />

            {/* Today Reference Line */}
            {todayData && (
              <ReferenceLine
                x={todayData.day}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: "Hari ini",
                  position: "insideTopLeft",
                  offset: 10,
                  fill: "#ef4444",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
