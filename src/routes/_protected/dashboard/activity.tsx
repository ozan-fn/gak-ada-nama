import { createFileRoute } from "@tanstack/react-router";
import {
  Activity as ActivityIcon,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_protected/dashboard/activity")({
  component: RouteComponent,
});

type EventType =
  | "verified"
  | "rejected"
  | "updated"
  | "risk-new"
  | "risk-resolved"
  | "community";

type ActivityEvent = {
  id: number;
  type: EventType;
  time: string;
  title: string;
  description: string;
};

type ActivityGroup = {
  day: string;
  events: ActivityEvent[];
};

const eventConfig: Record<
  EventType,
  { icon: typeof CheckCircle2; className: string }
> = {
  verified: {
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-600",
  },
  rejected: {
    icon: XCircle,
    className: "bg-red-50 text-red-500",
  },
  updated: {
    icon: RefreshCw,
    className: "bg-blue-50 text-blue-500",
  },
  "risk-new": {
    icon: AlertTriangle,
    className: "bg-amber-50 text-amber-600",
  },
  "risk-resolved": {
    icon: ShieldCheck,
    className: "bg-emerald-50 text-emerald-600",
  },
  community: {
    icon: Users,
    className: "bg-violet-50 text-violet-500",
  },
};

const groups: ActivityGroup[] = [
  {
    day: "Hari ini",
    events: [
      {
        id: 1,
        type: "verified",
        time: "14:32",
        title: "Laporan terverifikasi",
        description:
          '"Genangan di Jalan Sudirman" telah diverifikasi oleh sistem komunitas.',
      },
      {
        id: 2,
        type: "risk-new",
        time: "13:48",
        title: "Peringatan baru di sekitar",
        description: "Risiko genangan terdeteksi 850 m dari lokasi kamu.",
      },
      {
        id: 3,
        type: "updated",
        time: "12:20",
        title: "Laporan diperbarui",
        description: "2 laporan serupa ditemukan dan digabungkan.",
      },
    ],
  },
  {
    day: "Kemarin",
    events: [
      {
        id: 4,
        type: "risk-resolved",
        time: "18:42",
        title: "Peringatan selesai",
        description:
          "Risiko kualitas udara di sekitar lokasi kamu telah berakhir.",
      },
      {
        id: 5,
        type: "community",
        time: "16:20",
        title: "Laporanmu membantu memicu peringatan",
        description:
          '"Sampah menumpuk di area pasar" dijadikan salah satu dasar peringatan risiko sedang.',
      },
      {
        id: 6,
        type: "rejected",
        time: "09:05",
        title: "Laporan ditolak",
        description:
          '"Titik api kecil di lahan kosong" belum memiliki bukti yang cukup.',
      },
    ],
  },
];

function RouteComponent() {
  return (
    <main className="min-h-screen">
      <div className="flex flex-col gap-2 p-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-xl bg-muted/50 p-2">
          {/* Header */}
          <section className="rounded-lg bg-white p-4 shadow-sm">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <ActivityIcon className="h-3.5 w-3.5" />
              Aktivitas
            </div>

            <h1 className="mt-2.5 text-base font-semibold tracking-tight text-neutral-900">
              Aktivitas Terbaru
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Semua aktivitas terbaru yang berkaitan dengan laporan dan risiko
              di sekitarmu.
            </p>
          </section>

          {/* Timeline */}
          {groups.map((group) => (
            <section key={group.day} className="flex flex-col gap-3">
              <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                {group.day}
              </p>

              <div className="rounded-lg bg-white shadow-sm">
                {group.events.map((event, index) => {
                  const config = eventConfig[event.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={event.id}
                      className={`flex gap-3 p-4 ${
                        index !== group.events.length - 1
                          ? "border-b border-neutral-100"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.className}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {index !== group.events.length - 1 && (
                          <div className="mt-2 w-px flex-1 bg-neutral-100" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pb-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-neutral-400">
                            {event.time}
                          </p>
                        </div>
                        <h3 className="mt-1 text-sm font-semibold text-neutral-900">
                          {event.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
