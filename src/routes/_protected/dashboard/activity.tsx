import { createFileRoute } from "@tanstack/react-router";
import {
  Activity as ActivityIcon,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Users,
  Clock3,
} from "lucide-react";
import {
  type ActivityEvent,
  type ActivityGroup,
  getActivitiesFn,
} from "@/lib/activity.functions";

export const Route = createFileRoute("/_protected/dashboard/activity")({
  loader: () => getActivitiesFn(),
  component: RouteComponent,
});

type EventType =
  | "verified"
  | "rejected"
  | "updated"
  | "risk-new"
  | "risk-resolved"
  | "community";

const eventConfig: Record<
  EventType,
  {
    icon: typeof CheckCircle2;
    iconClassName: string;
    badgeClassName: string;
    label: string;
  }
> = {
  verified: {
    icon: CheckCircle2,
    iconClassName:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    badgeClassName:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    label: "Terverifikasi",
  },

  rejected: {
    icon: XCircle,
    iconClassName:
      "bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400",
    badgeClassName:
      "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    label: "Ditolak",
  },

  updated: {
    icon: RefreshCw,
    iconClassName:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    badgeClassName:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    label: "Diperbarui",
  },

  "risk-new": {
    icon: AlertTriangle,
    iconClassName:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    badgeClassName:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    label: "Peringatan baru",
  },

  "risk-resolved": {
    icon: ShieldCheck,
    iconClassName:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    badgeClassName:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    label: "Risiko selesai",
  },

  community: {
    icon: Users,
    iconClassName:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    badgeClassName:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    label: "Komunitas",
  },
};

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RouteComponent() {
  const groups = Route.useLoaderData();
  const totalActivities = groups.reduce(
    (total: number, group: { events: unknown[] }) => total + group.events.length,
    0,
  );

  return (
    <main className="min-h-screen">
      <div className="flex flex-col gap-2 p-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-xl bg-muted/50 p-2 dark:bg-muted/30">
          {/* =====================================================
              HEADER
          ====================================================== */}
          <section className="rounded-lg border border-neutral-200/60 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-800/80">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <ActivityIcon className="size-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                      Aktivitas terbaru
                    </h1>

                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                      {totalActivities} aktivitas
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Semua aktivitas yang berkaitan dengan laporan dan risiko di
                    sekitarmu.
                  </p>
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-500 dark:bg-neutral-900/70 dark:text-neutral-400 sm:flex">
                <Clock3 className="size-3" />
                Terbaru
              </div>
            </div>
          </section>

          {/* =====================================================
              ACTIVITY GROUPS
          ====================================================== */}
          <div className="flex flex-col gap-3">
            {groups.map((group: ActivityGroup) => (
              <section key={group.day}>
                {/* Day label */}
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    {group.day}
                  </span>

                  <div className="h-px flex-1 bg-neutral-200/70 dark:bg-neutral-700/60" />

                  <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                    {group.events.length} aktivitas
                  </span>
                </div>

                {/* Activity card */}
                <div className="overflow-hidden rounded-lg border border-neutral-200/60 bg-white/90 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-800/80">
                  <div className="divide-y divide-neutral-200/60 dark:divide-neutral-700/60">
                    {group.events.map((event: ActivityEvent, index: number) => {
                      const config = eventConfig[event.type];
                      const Icon = config.icon;

                      const isLast = index === group.events.length - 1;

                      return (
                        <article
                          key={event.id}
                          className="group relative flex gap-3 px-4 py-4 transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30"
                        >
                          {/* Timeline */}
                          <div className="relative flex w-9 shrink-0 justify-center">
                            {!isLast && (
                              <div className="absolute left-1/2 top-9 -bottom-4 w-px -translate-x-1/2 bg-neutral-200 dark:bg-neutral-700" />
                            )}

                            <div
                              className={`relative z-10 flex size-9 items-center justify-center rounded-lg ${config.iconClassName}`}
                            >
                              <Icon className="size-4" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1 pb-0.5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                    {event.title}
                                  </h2>

                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${config.badgeClassName}`}
                                  >
                                    {config.label}
                                  </span>
                                </div>

                                <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                                  {event.description}
                                </p>
                              </div>

                              <time className="shrink-0 text-xs font-medium text-neutral-400 dark:text-neutral-500">
                                {formatTime(event.time)}
                              </time>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* =====================================================
              FOOTER NOTE
          ====================================================== */}
          <section className="rounded-lg border border-dashed border-neutral-200/70 bg-neutral-50/60 px-4 py-3 dark:border-neutral-700/60 dark:bg-neutral-800/30">
            <div className="flex items-center justify-center gap-2 text-center">
              <ActivityIcon className="size-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />

              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Aktivitas akan diperbarui secara otomatis ketika ada perubahan
                pada laporan atau risiko di sekitarmu.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
