import {
  Bell,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Activity,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationType } from "@/hooks/useNotifications";

const notificationIcons: Record<NotificationType, typeof MapPin> = {
  nearby_report: MapPin,
  new_warning: AlertTriangle,
  report_verified: CheckCircle,
  simulation_updated: Activity,
};

const notificationColors: Record<NotificationType, string> = {
  nearby_report: "text-blue-600",
  new_warning: "text-amber-600",
  report_verified: "text-green-600",
  simulation_updated: "text-purple-600",
};

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${diffDays} hari lalu`;
}

export default function NotificationBar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100/60 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900 transition-colors dark:bg-neutral-800/60 dark:text-neutral-400 dark:hover:bg-neutral-700/80 dark:hover:text-neutral-100"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800 z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {unreadCount} belum dibaca
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowDropdown(false)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type];
                  const iconColor = notificationColors[notification.type];

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors ${
                        !notification.read
                          ? "bg-blue-50/30 dark:bg-blue-900/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`shrink-0 ${iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {notification.title}
                          </p>
                          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                            {formatRelativeTime(notification.time)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="shrink-0">
                            <span className="h-2 w-2 rounded-full bg-blue-500 block" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <Bell className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Tidak ada notifikasi
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="border-t border-neutral-100 dark:border-neutral-700 px-4 py-2">
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Tandai semua sudah dibaca
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
