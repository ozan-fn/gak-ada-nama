import { useState, useEffect } from "react";

export type NotificationSettings = {
  enableAqiWarnings: boolean;
  enableTempWarnings: boolean;
  enableRainWarnings: boolean;
  enableNearbyReports: boolean;
  aqiThreshold: number;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enableAqiWarnings: true,
  enableTempWarnings: true,
  enableRainWarnings: true,
  enableNearbyReports: true,
  aqiThreshold: 100,
};

const SETTINGS_KEY = "prita_notification_settings";

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch (e) {
        console.error("Failed to parse notification settings:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Listen to cross-tab changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY && e.newValue) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(e.newValue) });
        } catch (error) {
          console.error("Failed to parse updated settings from storage", error);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return { settings, updateSettings, isLoaded };
}
