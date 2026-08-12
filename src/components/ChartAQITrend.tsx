import { Activity, MoreVertical } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { month: "January", aqi: 45 },
  { month: "February", aqi: 62 },
  { month: "March", aqi: 51 },
  { month: "April", aqi: 38 },
  { month: "May", aqi: 55 },
  { month: "June", aqi: 48 },
  { month: "July", aqi: 42 },
  { month: "August", aqi: 40 },
  { month: "September", aqi: 45 },
];

const chartConfig = {
  aqi: {
    label: "AQI",
    color: "hsl(142.1 76.2% 36.3%)",
    icon: Activity,
  },
} satisfies ChartConfig;

export function ChartAQITrend() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">
            Air Quality Index (AQI) Trends
          </h3>
          <span className="rounded-sm border border-cyan-100 bg-cyan-50/90 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
            Normal
          </span>
        </div>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100"
          aria-label="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Chart Content */}
      <div className="flex-1 px-2 py-1 relative">
        {/* Background diagonal pattern - CSS based */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 8px,
              hsl(var(--muted-foreground) / 0.08) 8px,
              hsl(var(--muted-foreground) / 0.08) 9px
            )`,
            marginLeft: "32px",
            marginTop: "8px",
            marginBottom: "32px",
            marginRight: "12px",
          }}
        />
        <ChartContainer
          config={chartConfig}
          className="h-full w-full relative z-10"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 12,
              top: 8,
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

            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            {/* Data vertikal di kiri berdasarkan tinggi AQI */}
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={25}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickCount={4}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={0}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey="aqi"
              type="step"
              fill="url(#aqiGradient)"
              stroke="var(--color-aqi)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
