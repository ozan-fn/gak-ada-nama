import { useState, useEffect, useCallback } from "react";
import { useEnvironmentData } from "./useEnvironmentData";
import { useUserLocation } from "./useUserLocation";
import { useAQIStations } from "./useAQIStations";
import { useNotificationSettings } from "./useNotificationSettings";

export type NotificationType = "nearby_report" | "new_warning" | "report_verified" | "simulation_updated";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: Date;
  read: boolean;
};

const NOTIFICATION_KEY = "prita_notifications";
const MAX_NOTIFICATIONS = 10;
const NOTIFICATION_TTL = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Run cleanup every 5 minutes

// Thresholds untuk trigger warning (default fallback)
const WARNING_THRESHOLDS = {
  temp: 35,
  rain: 80,
};

export function useNotifications() {
  const userLocation = useUserLocation();
  const envData = useEnvironmentData(userLocation);
  const { stations } = useAQIStations({
    userLat: userLocation.latitude,
    userLon: userLocation.longitude,
    radiusKm: 50,
  });

  const { settings } = useNotificationSettings();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications dari localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const withDates = parsed.map((n: any) => ({
          ...n,
          time: new Date(n.time),
        }));
        setNotifications(withDates);
      } catch (e) {
        console.error("Failed to parse notifications:", e);
      }
    }
  }, []);

  // Save notifications ke localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  // Auto-cleanup old notifications (older than 3 hours)
  useEffect(() => {
    const cleanupOldNotifications = () => {
      const now = Date.now();
      setNotifications((prev) => 
        prev.filter((n) => now - n.time.getTime() < NOTIFICATION_TTL)
      );
    };

    // Run cleanup immediately on mount
    cleanupOldNotifications();

    // Then run cleanup every 5 minutes
    const interval = setInterval(cleanupOldNotifications, CLEANUP_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Upsert notification - update jika sudah ada, create jika baru
  const upsertNotification = useCallback((
    id: string,
    type: NotificationType,
    title: string,
    message: string
  ) => {
    setNotifications((prev) => {
      const existingIndex = prev.findIndex((n) => n.id === id);

      if (existingIndex !== -1) {
        // Update existing notification
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          title,
          message,
          time: new Date(), // Update timestamp
          // Keep read status
        };
        return updated;
      }

      // Create new notification
      const newNotif: Notification = {
        id,
        type,
        title,
        message,
        time: new Date(),
        read: false,
      };

      const updated = [newNotif, ...prev];
      return updated.slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  // Monitor AQI untuk warnings - 1 notification per location
  useEffect(() => {
    if (!envData.aqi || envData.loading || !userLocation.city) return;

    const currentAQI = envData.aqi.aqi;
    const notifId = `aqi-warning-${userLocation.city}`;

    if (settings.enableAqiWarnings && currentAQI > settings.aqiThreshold) {
      upsertNotification(
        notifId,
        "new_warning",
        "Peringatan Kualitas Udara",
        `AQI ${currentAQI} di ${userLocation.city}. Batasi aktivitas outdoor.`
      );
    } else {
      // Remove notification jika AQI sudah normal atau fitur dinonaktifkan
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    }
  }, [envData.aqi, envData.loading, userLocation.city, upsertNotification, settings.enableAqiWarnings, settings.aqiThreshold]);

  // Monitor temperature - 1 notification per location
  useEffect(() => {
    if (!envData.weather || envData.loading || !userLocation.city) return;

    const currentTemp = Math.round(envData.weather.current.temperature);
    const notifId = `temp-warning-${userLocation.city}`;

    if (settings.enableTempWarnings && currentTemp >= WARNING_THRESHOLDS.temp) {
      upsertNotification(
        notifId,
        "new_warning",
        "Peringatan Suhu Tinggi",
        `Suhu ${currentTemp}°C di ${userLocation.city}. Hindari aktivitas berat outdoor.`
      );
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    }
  }, [envData.weather, envData.loading, userLocation.city, upsertNotification, settings.enableTempWarnings]);

  // Monitor rain probability - 1 notification per location
  useEffect(() => {
    if (!envData.weather || envData.loading || !userLocation.city) return;

    const rainProb = Math.round(envData.weather.daily.precipitationProbability[0] || 0);
    const notifId = `rain-warning-${userLocation.city}`;

    if (settings.enableRainWarnings && rainProb >= WARNING_THRESHOLDS.rain) {
      upsertNotification(
        notifId,
        "new_warning",
        "Peringatan Hujan Lebat",
        `Probabilitas hujan ${rainProb}% hari ini. Siapkan payung.`
      );
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    }
  }, [envData.weather, envData.loading, userLocation.city, upsertNotification, settings.enableRainWarnings]);

  // Monitor nearby stations - max 3 nearby reports
  useEffect(() => {
    if (!stations || stations.length === 0) return;

    if (!settings.enableNearbyReports) {
      // Clear all nearby reports if disabled
      setNotifications((prev) => prev.filter((n) => n.type !== "nearby_report"));
      return;
    }

    const nearbyHighAQI = stations
      .filter((s) => s.aqi > settings.aqiThreshold && (s.distance ?? 0) < 10)
      .slice(0, 3); // Max 3 nearby reports

    // Update or create notifications untuk nearby stations
    nearbyHighAQI.forEach((station) => {
      const notifId = `nearby-${station.name}`;
      const distanceKm = station.distance ?? 0;
      upsertNotification(
        notifId,
        "nearby_report",
        "Laporan Kualitas Udara Terdekat",
        `AQI ${station.aqi} di ${station.name}, ${Math.round(distanceKm)}km dari Anda.`
      );
    });

    // Remove notifications untuk stations yang sudah tidak high AQI
    setNotifications((prev) =>
      prev.filter((n) => {
        if (n.type !== "nearby_report") return true;
        const stationName = n.id.replace("nearby-", "");
        return nearbyHighAQI.some((s) => s.name === stationName);
      })
    );
  }, [stations, upsertNotification, settings.enableNearbyReports, settings.aqiThreshold]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(NOTIFICATION_KEY);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
