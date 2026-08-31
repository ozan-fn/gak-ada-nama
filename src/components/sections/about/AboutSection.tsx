import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CloudRain,
  Droplets,
  MapPin,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wind,
} from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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

import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { getReportMapPinsFn } from "#/lib/reports.functions";

const chartConfig = {
  pm25: {
    label: "PM2.5",
    color: "hsl(199 89% 48%)",
    icon: Activity,
  },
} satisfies ChartConfig;

const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function formatNumber(num: number): string {
  if (num >= 1000) {
    return new Intl.NumberFormat("id-ID").format(num) + "+";
  }

  return num.toString();
}

export default function AboutSection() {
  const locationParams = useMemo(() => ({ city: "jakarta" }), []);

  const { weather, aqi, loading } = useEnvironmentData(locationParams);

  const { data: reportPins = [] } = useQuery({
    queryKey: ["reportMapPins"],
    queryFn: () => getReportMapPinsFn(),
    staleTime: 60_000,
  });

  const totalReports = reportPins.length;

  // Derive total unique report location names
  const uniqueRegions = new Set(
    reportPins.map((pin) => pin.locationName).filter(Boolean),
  ).size;

  const stats = [
    {
      label: "Lokasi terpantau",
      value: formatNumber(uniqueRegions),
      icon: MapPin,
    },
    {
      label: "Data real-time",
      value: "24/7",
      icon: Clock,
    },
    {
      label: "Laporan aktif",
      value: formatNumber(totalReports),
      icon: Activity,
    },
  ];

  const temp = weather ? Math.round(weather.current.temperature) : null;
  const humidity = weather ? Math.round(weather.current.humidity) : null;
  const windSpeed = weather
    ? Math.round(weather.current.windSpeed * 3.6)
    : null;
  const rainProb = weather
    ? Math.round(weather.daily.precipitationProbability[0] || 0)
    : null;

  const aqiValue = aqi?.aqi ?? null;

  // Dynamic styling variables based on active AQI threshold
  let aqiStatus = "Baik";
  let aqiColor = "text-sky-700";
  let aqiBgColor = "bg-sky-50";
  let aqiRing = "stroke-sky-500";
  let aqiTrend: "up" | "down" = "down";

  if (aqiValue !== null) {
    if (aqiValue > 100) {
      aqiStatus = "Tidak sehat";
      aqiColor = "text-red-700";
      aqiBgColor = "bg-red-50";
      aqiRing = "stroke-red-500";
      aqiTrend = "up";
    } else if (aqiValue > 50) {
      aqiStatus = "Sedang";
      aqiColor = "text-amber-700";
      aqiBgColor = "bg-amber-50";
      aqiRing = "stroke-amber-500";
      aqiTrend = "down";
    }
  }

  const aqiPct = aqiValue !== null ? Math.min(aqiValue / 150, 1) : 0;
  const ringCircumference = 2 * Math.PI * 26;

  // Format 7-day PM2.5 forecast chart data
  const pm25Chart = useMemo(() => {
    if (!aqi?.forecast?.pm25) {
      return [];
    }

    return aqi.forecast.pm25.slice(0, 7).map((item, index) => {
      const date = new Date(item.day);

      return {
        day:
          date.toLocaleDateString("id-ID", {
            weekday: "short",
          }) || dayNames[index],
        pm25: item.avg,
        date: item.day,
      };
    });
  }, [aqi]);

  const today = new Date();

  const jakartaToday = new Date(
    today.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    }),
  );

  const todayDateString = jakartaToday.toISOString().split("T")[0];

  // Find forecast data matching current Jakarta local date for reference line
  const todayChartData = pm25Chart.find((item) => {
    const forecastDate = new Date(item.date).toISOString().split("T")[0];

    return forecastDate === todayDateString;
  });

  const weatherMetrics = [
    {
      icon: Thermometer,
      iconColor: "text-orange-600",
      label: "Suhu",
      value: temp,
      unit: "°C",
    },
    {
      icon: Droplets,
      iconColor: "text-blue-600",
      label: "Kelembaban",
      value: humidity,
      unit: "%",
    },
    {
      icon: Wind,
      iconColor: "text-teal-600",
      label: "Angin",
      value: windSpeed,
      unit: "km/j",
    },
    {
      icon: CloudRain,
      iconColor: "text-sky-600",
      label: "Hujan",
      value: rainProb,
      unit: "%",
    },
  ];

  return (
    <section className="relative border-t border-gray-200 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="mb-6 flex items-end justify-between border-b border-gray-200 pb-6">
          <div>
            <span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-cyan-500 shadow-xs">
              Tentang kami
            </span>

            <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-gray-900 md:text-[2.75rem] md:leading-[1.1]">
              Masa depan monitoring lingkungan, ditenagai AI.
            </h1>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
          {/* Left Column: Mission Statement & Key Impact Stats */}
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              margin: "-80px",
            }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
          >
            <p className="max-w-lg text-[15px] leading-relaxed text-gray-500">
              Prita hadir untuk membantu masyarakat dan pemerintah memantau
              kondisi lingkungan melalui kecerdasan buatan. Dengan analisis
              otomatis, visualisasi interaktif, dan kolaborasi komunitas, kami
              ingin menciptakan pengambilan keputusan yang lebih cepat dan
              berbasis data.
            </p>

            <div className="mt-10 grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200 divide-x divide-gray-200">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group relative p-5 transition-colors hover:bg-sky-50/40"
                >
                  <stat.icon className="size-4 text-gray-400 transition-colors group-hover:text-sky-600" />

                  <div className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">
                    {stat.value}
                  </div>

                  <div className="mt-1 text-[11px] text-gray-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4 border-t border-gray-200 pt-8">
              {[
                {
                  title: "Analisis otomatis",
                  desc: "Model AI memproses data sensor dan laporan warga secara berkelanjutan.",
                },
                {
                  title: "Kolaborasi komunitas",
                  desc: "Laporan dari masyarakat memperkaya akurasi peta lingkungan secara real-time.",
                },
              ].map((point) => (
                <div key={point.title} className="flex items-start gap-3">
                  <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-sky-600" />

                  <div>
                    <div className="text-[13px] font-medium text-gray-900">
                      {point.title}
                    </div>

                    <div className="mt-0.5 text-[13px] text-gray-500">
                      {point.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Live Environmental Monitoring Widget */}
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              margin: "-80px",
            }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: 0.1,
            }}
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Wind className="size-3.5 text-gray-400" />

                  <span className="text-[11px] font-medium text-gray-900">
                    Stasiun Jakarta Pusat
                  </span>
                </div>

                <span className="flex items-center gap-1.5 text-[10px] font-medium text-sky-600">
                  <span className="size-1.5 animate-pulse rounded-full bg-sky-500" />
                  Live
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="mx-auto size-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />

                  <p className="mt-2 text-[10px] text-gray-400">
                    Memuat data real-time...
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_1.35fr] border-b border-gray-200">
                    {/* AQI Radial Gauge */}
                    <div className="border-r border-gray-200 p-4">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        Kualitas udara
                      </span>

                      <div className="mt-3 flex items-center gap-2.5">
                        <div className="relative flex size-14 shrink-0 items-center justify-center">
                          <svg
                            className="size-14 -rotate-90"
                            viewBox="0 0 64 64"
                            aria-label="AQI indicator"
                          >
                            <title>AQI Indicator</title>

                            <circle
                              cx="32"
                              cy="32"
                              r="26"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="5"
                              className="text-gray-100"
                            />

                            <circle
                              cx="32"
                              cy="32"
                              r="26"
                              fill="none"
                              strokeWidth="5"
                              strokeLinecap="round"
                              className={aqiRing}
                              strokeDasharray={ringCircumference}
                              strokeDashoffset={
                                ringCircumference * (1 - aqiPct)
                              }
                            />
                          </svg>

                          <span className="absolute text-lg font-semibold text-gray-900">
                            {aqiValue ?? "—"}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${aqiBgColor} ${aqiColor}`}
                          >
                            {aqiStatus}
                          </span>

                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400">
                            {aqiTrend === "down" ? (
                              <TrendingDown className="size-3 text-sky-600" />
                            ) : (
                              <TrendingUp className="size-3 text-red-600" />
                            )}
                            PM2.5
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Weather Metrics Grid */}
                    <div className="grid grid-cols-2">
                      {weatherMetrics.map((metric, index) => (
                        <div
                          key={metric.label}
                          className={`p-3 ${
                            index % 2 === 0 ? "border-r border-gray-200" : ""
                          } ${index < 2 ? "border-b border-gray-200" : ""}`}
                        >
                          <metric.icon
                            className={`size-3.5 ${metric.iconColor}`}
                          />

                          <div className="mt-2 flex items-baseline gap-0.5">
                            <span className="text-lg font-semibold text-gray-900">
                              {metric.value ?? "—"}
                            </span>

                            <span className="text-[9px] text-gray-400">
                              {metric.unit}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-500">
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 7-Day PM2.5 Forecast Area Chart */}
                  {pm25Chart.length > 0 && (
                    <div className="border-b border-gray-200">
                      <div className="flex items-center justify-between px-4 pt-3.5">
                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-400">
                          <Activity className="size-3" />
                          Tren PM2.5
                        </span>

                        <span className="text-[9px] text-gray-400">7 hari</span>
                      </div>

                      <div className="relative h-40 w-full px-1 pt-1">
                        <div
                          className="
                            pointer-events-none
                            absolute
                            inset-0
                            ml-9
                            mr-4
                            mt-4
                            mb-7
                            opacity-50
                            bg-[repeating-linear-gradient(-45deg,transparent,transparent_8px,hsl(0_0%_45%/0.05)_8px,hsl(0_0%_45%/0.05)_9px)]
                          "
                        />

                        <ChartContainer
                          config={chartConfig}
                          className="relative z-10 h-full w-full"
                        >
                          <AreaChart
                            accessibilityLayer
                            data={pm25Chart}
                            margin={{
                              left: 0,
                              right: 10,
                              top: 18,
                              bottom: 2,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="aboutPm25Gradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-pm25)"
                                  stopOpacity={0.45}
                                />

                                <stop
                                  offset="95%"
                                  stopColor="var(--color-pm25)"
                                  stopOpacity={0.03}
                                />
                              </linearGradient>
                            </defs>

                            <CartesianGrid
                              vertical={false}
                              strokeDasharray="3 3"
                              className="stroke-gray-200/70"
                            />

                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickMargin={3}
                              width={27}
                              tick={{
                                fontSize: 9,
                                fill: "#9ca3af",
                              }}
                              tickCount={3}
                              domain={[
                                0,
                                (dataMax: number) =>
                                  Math.ceil((dataMax + 10) / 10) * 10,
                              ]}
                            />

                            <XAxis
                              dataKey="day"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={7}
                              interval={0}
                              tick={{
                                fontSize: 9,
                                fill: "#9ca3af",
                              }}
                            />

                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent hideLabel />}
                            />

                            <Area
                              dataKey="pm25"
                              type="step"
                              fill="url(#aboutPm25Gradient)"
                              stroke="var(--color-pm25)"
                              strokeWidth={2}
                              activeDot={{
                                r: 4,
                                fill: "var(--color-pm25)",
                                stroke: "#ffffff",
                                strokeWidth: 2,
                              }}
                            />

                            {todayChartData && (
                              <ReferenceLine
                                x={todayChartData.day}
                                stroke="#ef4444"
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                                label={{
                                  value: "Hari ini",
                                  position: "insideTopLeft",
                                  offset: 6,
                                  fill: "#ef4444",
                                  fontSize: 9,
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </AreaChart>
                        </ChartContainer>
                      </div>
                    </div>
                  )}

                  {/* Environmental Advisory Banner */}
                  <div className="p-4">
                    <div
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 ${
                        aqiValue !== null && aqiValue > 50
                          ? "border-amber-200 bg-amber-50"
                          : "border-sky-200 bg-sky-50"
                      }`}
                    >
                      <AlertTriangle
                        className={`mt-0.5 size-3.5 shrink-0 ${
                          aqiValue !== null && aqiValue > 50
                            ? "text-amber-600"
                            : "text-sky-600"
                        }`}
                      />

                      <p
                        className={`text-[11.5px] leading-relaxed ${
                          aqiValue !== null && aqiValue > 50
                            ? "text-amber-900"
                            : "text-sky-900"
                        }`}
                      >
                        {aqiValue !== null && aqiValue > 50
                          ? "Kualitas udara sedang. Pertimbangkan membatasi aktivitas luar ruangan yang intens."
                          : "Kondisi lingkungan dalam keadaan baik. Aman untuk aktivitas luar ruangan."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <MapPin className="size-3" />
                      Jakarta Pusat
                    </span>

                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Clock className="size-3" />
                      Update real-time
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
