import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Lock,
  Mail,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  User,
  Bell,
  CloudRain,
  Thermometer,
  Wind,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import SettingsNav from "#/components/SettingsNav";
import { useNotificationSettings } from "#/hooks/useNotificationSettings";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_protected/dashboard/settings")({
  component: Settings,
});

type SettingsTab = "profile" | "security" | "notification" | "appearance";

function Settings() {
  const { user } = Route.useRouteContext();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // =========================================================
  // Profile
  // =========================================================

  const [name, setName] = useState(user.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  // =========================================================
  // Security
  // =========================================================

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // =========================================================
  // Notification
  // =========================================================

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  const {
    settings: notifSettings,
    updateSettings: updateNotifSettings,
    isLoaded: isNotifLoaded,
  } = useNotificationSettings();

  // =========================================================
  // Appearance
  // =========================================================

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const isDark = theme === "dark";

    setIsDarkMode(isDark);

    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);

    document.documentElement.classList.toggle("dark", checked);

    localStorage.setItem("theme", checked ? "dark" : "light");
  };

  // =========================================================
  // Profile
  // =========================================================

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    setNameError("");
    setNameSuccess(false);
    setNameLoading(true);

    try {
      const result = await authClient.updateUser({
        name,
      });

      if (result.error) {
        setNameError(result.error.message || "Gagal memperbarui profil.");
      } else {
        setNameSuccess(true);
      }
    } catch {
      setNameError("Gagal memperbarui profil.");
    } finally {
      setNameLoading(false);
    }
  };

  // =========================================================
  // Password
  // =========================================================

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Password baru tidak cocok.");
      return;
    }

    setPasswordLoading(true);

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (result.error) {
        setPasswordError(result.error.message || "Gagal mengubah password.");
      } else {
        setPasswordSuccess(true);

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("Gagal mengubah password. Periksa password saat ini.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // =========================================================
  // Notification
  // =========================================================

  const handleSaveNotifSettings = () => {
    setNotifLoading(true);
    setNotifSuccess(false);

    setTimeout(() => {
      setNotifLoading(false);
      setNotifSuccess(true);

      setTimeout(() => {
        setNotifSuccess(false);
      }, 3000);
    }, 500);
  };

  return (
    <main className="min-h-screen bg-neutral-50/60 dark:bg-neutral-950">
      <div className="mx-auto w-full p-4 lg:p-6">
        {/* Page Header */}
        <header className="mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <User className="h-4 w-4" />
            </div>

            <div>
              <h1 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Pengaturan
              </h1>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Kelola akun, keamanan, notifikasi, dan tampilan aplikasi.
              </p>
            </div>
          </div>
        </header>

        {/* Settings Layout */}
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="h-fit rounded-xl border border-neutral-200/80 bg-white p-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <SettingsNav
              user={user}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </aside>

          {/* Content */}
          <div className="min-w-0">
            {/* =====================================================
                PROFILE
            ====================================================== */}
            {activeTab === "profile" && (
              <section className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                {/* Section Header */}
                <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                      <User className="h-4 w-4" />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Informasi profil
                      </h2>

                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        Perbarui informasi dasar yang digunakan pada akun kamu.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile}>
                  <div className="space-y-5 p-5">
                    {/* Email */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-neutral-400" />

                        <Label
                          htmlFor="email"
                          className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Email
                        </Label>
                      </div>

                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        disabled
                        className="h-9 bg-neutral-50 text-sm text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400"
                      />

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Email digunakan untuk autentikasi dan tidak dapat
                        diubah.
                      </p>
                    </div>

                    <Separator />

                    {/* Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        Nama tampilan
                      </Label>

                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setNameSuccess(false);
                        }}
                        placeholder="Masukkan nama kamu"
                        className="h-9 text-sm dark:bg-neutral-950 dark:text-neutral-100"
                        required
                      />

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Nama ini akan ditampilkan pada profil dan aktivitas
                        kamu.
                      </p>
                    </div>

                    {/* Error */}
                    {nameError && (
                      <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                        {nameError}
                      </div>
                    )}

                    {/* Success */}
                    {nameSuccess && (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Profil berhasil diperbarui.
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-950/40">
                    <p className="hidden text-[11px] text-neutral-500 dark:text-neutral-400 sm:block">
                      Perubahan akan diterapkan pada akun kamu.
                    </p>

                    <Button
                      type="submit"
                      disabled={nameLoading}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                    >
                      <Save className="h-3.5 w-3.5" />

                      {nameLoading ? "Menyimpan..." : "Simpan perubahan"}
                    </Button>
                  </div>
                </form>
              </section>
            )}

            {/* =====================================================
                SECURITY
            ====================================================== */}
            {activeTab === "security" && (
              <section className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                {/* Header */}
                <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Keamanan akun
                      </h2>

                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        Perbarui password untuk menjaga keamanan akun kamu.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleChangePassword}>
                  <div className="space-y-5 p-5">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-neutral-400" />

                        <Label
                          htmlFor="currentPassword"
                          className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Password saat ini
                        </Label>
                      </div>

                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Masukkan password saat ini"
                        className="h-9 text-sm dark:bg-neutral-950 dark:text-neutral-100"
                        required
                      />
                    </div>

                    <Separator />

                    {/* New Password */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="newPassword"
                          className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Password baru
                        </Label>

                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Masukkan password baru"
                          className="h-9 text-sm dark:bg-neutral-950 dark:text-neutral-100"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Konfirmasi password baru
                        </Label>

                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Masukkan kembali password baru"
                          className="h-9 text-sm dark:bg-neutral-950 dark:text-neutral-100"
                          required
                        />
                      </div>

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Gunakan password yang kuat dan sulit ditebak.
                      </p>
                    </div>

                    {/* Error */}
                    {passwordError && (
                      <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                        {passwordError}
                      </div>
                    )}

                    {/* Success */}
                    {passwordSuccess && (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Password berhasil diubah.
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end border-t border-neutral-100 bg-neutral-50/50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-950/40">
                    <Button
                      type="submit"
                      disabled={passwordLoading}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />

                      {passwordLoading ? "Menyimpan..." : "Ubah password"}
                    </Button>
                  </div>
                </form>
              </section>
            )}

            {/* =====================================================
                NOTIFICATION
            ====================================================== */}
            {activeTab === "notification" && (
              <section className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                {/* Header */}
                <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                      <Bell className="h-4 w-4" />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Notifikasi
                      </h2>

                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        Atur jenis peringatan yang ingin kamu terima.
                      </p>
                    </div>
                  </div>
                </div>

                {!isNotifLoaded ? (
                  <div className="p-5">
                    <div className="animate-pulse space-y-4">
                      <div className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                      <div className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                      <div className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {/* AQI */}
                      <NotificationSetting
                        icon={Wind}
                        iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        title="Peringatan kualitas udara"
                        description="Dapatkan notifikasi saat AQI melebihi ambang batas."
                        checked={notifSettings.enableAqiWarnings}
                        onCheckedChange={(value) =>
                          updateNotifSettings({
                            enableAqiWarnings: value,
                          })
                        }
                        id="aqiWarnings"
                      />

                      {/* Temperature */}
                      <NotificationSetting
                        icon={Thermometer}
                        iconClassName="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                        title="Peringatan suhu tinggi"
                        description="Dapatkan notifikasi saat suhu mencapai ≥35°C."
                        checked={notifSettings.enableTempWarnings}
                        onCheckedChange={(value) =>
                          updateNotifSettings({
                            enableTempWarnings: value,
                          })
                        }
                        id="tempWarnings"
                      />

                      {/* Rain */}
                      <NotificationSetting
                        icon={CloudRain}
                        iconClassName="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400"
                        title="Peringatan hujan"
                        description="Dapatkan notifikasi saat kemungkinan hujan ≥80%."
                        checked={notifSettings.enableRainWarnings}
                        onCheckedChange={(value) =>
                          updateNotifSettings({
                            enableRainWarnings: value,
                          })
                        }
                        id="rainWarnings"
                      />

                      {/* Nearby */}
                      <NotificationSetting
                        icon={Bell}
                        iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
                        title="Laporan stasiun terdekat"
                        description="Notifikasi dari stasiun AQI dalam radius 10 km."
                        checked={notifSettings.enableNearbyReports}
                        onCheckedChange={(value) =>
                          updateNotifSettings({
                            enableNearbyReports: value,
                          })
                        }
                        id="nearbyReports"
                      />
                    </div>

                    {/* Threshold */}
                    <div className="border-t border-neutral-100 p-5 dark:border-neutral-800">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="max-w-lg">
                          <Label
                            htmlFor="aqiThreshold"
                            className="text-xs font-medium text-neutral-800 dark:text-neutral-200"
                          >
                            Ambang batas AQI
                          </Label>

                          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                            Peringatan AQI dan stasiun terdekat akan dikirim
                            ketika nilai mencapai atau melebihi angka ini.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            id="aqiThreshold"
                            type="number"
                            min="50"
                            max="500"
                            value={notifSettings.aqiThreshold}
                            onChange={(e) =>
                              updateNotifSettings({
                                aqiThreshold: Number(e.target.value),
                              })
                            }
                            className="h-9 w-24 text-center text-sm dark:bg-neutral-950 dark:text-neutral-100"
                          />

                          <span className="text-xs text-neutral-500 dark:text-neutral-400">AQI</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-950/40">
                      {notifSuccess ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Pengaturan berhasil disimpan.
                        </div>
                      ) : (
                        <p className="hidden text-[11px] text-neutral-500 dark:text-neutral-400 sm:block">
                          Perubahan preferensi notifikasi kamu.
                        </p>
                      )}

                      <Button
                        onClick={handleSaveNotifSettings}
                        disabled={notifLoading}
                        size="sm"
                        className="ml-auto h-8 gap-1.5 text-xs"
                      >
                        <Save className="h-3.5 w-3.5" />

                        {notifLoading ? "Menyimpan..." : "Simpan perubahan"}
                      </Button>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* =====================================================
                APPEARANCE
            ====================================================== */}
            {activeTab === "appearance" && (
              <section className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                {/* Header */}
                <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                      {isDarkMode ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Tampilan
                      </h2>

                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        Sesuaikan tampilan aplikasi sesuai preferensi kamu.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Theme Setting */}
                <div className="p-5">
                  <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                          {isDarkMode ? (
                            <Moon className="h-4 w-4" />
                          ) : (
                            <Sun className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <Label
                            htmlFor="darkMode"
                            className="text-xs font-medium text-neutral-800 dark:text-neutral-200"
                          >
                            Mode gelap
                          </Label>

                          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                            Gunakan tampilan gelap untuk mengurangi cahaya pada
                            lingkungan dengan pencahayaan rendah.
                          </p>
                        </div>
                      </div>

                      <Switch
                        id="darkMode"
                        checked={isDarkMode}
                        onCheckedChange={handleThemeToggle}
                      />
                    </div>
                  </div>
                </div>

                {/* Current Theme */}
                <div className="border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Tema saat ini
                    </span>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      {isDarkMode ? (
                        <>
                          <Moon className="h-3.5 w-3.5" />
                          Gelap
                        </>
                      ) : (
                        <>
                          <Sun className="h-3.5 w-3.5" />
                          Terang
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* =============================================================
   Notification Setting Component
============================================================= */

type NotificationSettingProps = {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
};

function NotificationSetting({
  id,
  title,
  description,
  checked,
  onCheckedChange,
  icon: Icon,
  iconClassName,
}: NotificationSettingProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0">
          <Label
            htmlFor={id}
            className="cursor-pointer text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            {title}
          </Label>

          <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        </div>
      </div>

      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
