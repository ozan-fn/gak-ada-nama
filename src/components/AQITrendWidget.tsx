import { Activity, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "./ui/skeleton";

const chartConfig = {
  aqi: {
    label: "PM2.5",
    color: "#10b981",
    icon: Activity,
  },
} satisfies ChartConfig;

export default function AQITrendWidget() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="relative -right-10 mx-auto flex w-full max-w-xl gap-5 max-lg:right-0">
        {/* ================= CHART SKELETON ================= */}
        <div className="w-full flex-1 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>

          <Skeleton className="mt-4 h-32 w-full rounded-md" />

          <div className="mt-2 flex justify-between">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={`day-${i}`} className="h-2.5 w-5 rounded-sm" />
            ))}
          </div>
        </div>

        {/* ================= STATUS SKELETON ================= */}
        <div className="relative hidden w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm lg:flex">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>

        {/* ================= RIGHT FADE ================= */}
        <div
          className="
            pointer-events-none
            absolute
            left-[calc(100%-5.5rem)]
            top-0
            z-30
            hidden
            h-full
            w-24
            bg-linear-to-l
            from-white
            via-white/75
            to-transparent
            lg:block
          "
        />
      </div>
    );
  }

  // ================= DATA =================

  const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const todayIndex = 3;

  const chartData = days.map((day, i) => {
    let aqi = 0;

    if (i < 2) {
      aqi = Math.random() * 30 + 10;
    } else if (i < 5) {
      aqi = Math.random() * 30 + 50;
    } else {
      aqi = Math.random() * 40 + 80;
    }

    return {
      day,
      aqi: Math.round(aqi),
      isToday: i === todayIndex,
    };
  });

  const todayData = chartData[todayIndex];
  const currentAQI = todayData.aqi;

  const prevData = chartData[todayIndex - 1];

  const changePercent = prevData
    ? (((currentAQI - prevData.aqi) / prevData.aqi) * 100).toFixed(1)
    : "0.0";

  const isPositive = Number(changePercent) >= 0;

  // ================= STATUS =================

  let status = "Baik";
  let statusColor = "bg-emerald-50 border-emerald-200 text-emerald-600";
  let dotColor = "bg-emerald-500";

  if (currentAQI > 100) {
    status = "Tidak Sehat";
    statusColor = "bg-red-50 border-red-200 text-red-600";
    dotColor = "bg-red-500";
  } else if (currentAQI > 50) {
    status = "Sedang";
    statusColor = "bg-amber-50 border-amber-200 text-amber-600";
    dotColor = "bg-amber-500";
  }

  return (
    <div className="relative -right-10 mx-auto flex w-full max-w-xl gap-5 max-lg:right-0">
      {/* ================= CHART PANEL ================= */}
      <div className="w-full flex-1 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">
            Air Quality Index (AQI) Trends
          </h3>

          <button
            type="button"
            className="
              flex
              h-6
              w-6
              items-center
              justify-center
              rounded-md
              text-neutral-400
              transition-colors
              hover:bg-neutral-100
              hover:text-neutral-600
            "
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ================= CHART ================= */}
        <ChartContainer config={chartConfig} className="mt-2 h-32 w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 8,
              top: 22,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-aqi)"
                  stopOpacity={0.3}
                />

                <stop
                  offset="95%"
                  stopColor="var(--color-aqi)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

            {/* ================= GRID ================= */}
            <CartesianGrid
              vertical={true}
              horizontal={true}
              strokeDasharray="3 3"
              className="stroke-neutral-200/70"
            />

            {/* ================= Y AXIS ================= */}
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={24}
              tick={{
                fontSize: 9,
                fill: "#a3a3a3",
              }}
              tickCount={3}
              domain={[0, (max: number) => Math.ceil((max + 10) / 10) * 10]}
            />

            {/* ================= X AXIS ================= */}
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={{
                fontSize: 10,
                fill: "#a3a3a3",
              }}
            />

            {/* ================= TOOLTIP ================= */}
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            {/* ================= STEP AREA ================= */}
            <Area
              dataKey="aqi"
              type="step"
              fill="url(#aqiGradient)"
              stroke="var(--color-aqi)"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, index } = props;

                if (
                  cx === undefined ||
                  cy === undefined ||
                  index === undefined ||
                  index !== todayIndex
                ) {
                  return null;
                }

                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={false}
            />

            {/* ================= TODAY LINE ================= */}
            <ReferenceLine
              x={todayData.day}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{
                value: "Hari ini",
                position: "insideTopLeft",
                offset: 8,
                fill: "#ef4444",
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          </AreaChart>
        </ChartContainer>

        {/* ================= TODAY SUMMARY ================= */}
        <div className="mt-1 flex items-center justify-between px-1">
          <span className="text-[10px] text-neutral-400">Hari ini</span>

          <span className="text-xs font-semibold text-neutral-900">
            {currentAQI}{" "}
            <span
              className={`font-medium ${
                isPositive ? "text-emerald-500" : "text-red-500"
              }`}
            >
              ({isPositive ? "+" : ""}
              {changePercent}%)
            </span>
          </span>
        </div>
      </div>

      {/* ================= STATUS PANEL ================= */}
      <div className="relative hidden w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm lg:flex">
        {/* Icon */}
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
          <Activity className="h-4.5 w-4.5 text-emerald-500" />
        </div>

        {/* Status */}
        <span
          className={`
            inline-flex
            items-center
            gap-1
            rounded-full
            border
            px-2.5
            py-1
            text-[11px]
            font-medium
            ${statusColor}
          `}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />

          {status}
        </span>

        {/* AQI */}
        <p className="text-center text-[9px] leading-tight text-neutral-400">
          {currentAQI} AQI hari ini
        </p>
      </div>

      {/* ================= RIGHT FADE ================= */}
      <div
        className="
          pointer-events-none
          absolute
          left-[calc(100%-5.5rem)]
          top-0
          z-30
          hidden
          h-full
          w-24
          bg-linear-to-l
          from-white
          via-white/75
          to-transparent
          lg:block
        "
      />
    </div>
  );
}
