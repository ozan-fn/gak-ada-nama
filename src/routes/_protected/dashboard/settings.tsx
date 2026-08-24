import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Settings as SettingsIcon } from "lucide-react";
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

function Settings() {
  const { user } = Route.useRouteContext();
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "notification"
  >("profile");

  const [name, setName] = useState(user.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  const {
    settings: notifSettings,
    updateSettings: updateNotifSettings,
    isLoaded: isNotifLoaded,
  } = useNotificationSettings();

  const handleSaveNotifSettings = () => {
    setNotifLoading(true);
    setNotifSuccess(false);
    // The hook already auto-saves to localStorage on change, 
    // this button provides visual confirmation for user consistency.
    setTimeout(() => {
      setNotifLoading(false);
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
    }, 500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setNameSuccess(false);
    setNameLoading(true);
    try {
      const result = await authClient.updateUser({ name });
      if (result.error) {
        setNameError(result.error.message || "Failed to update profile.");
      } else {
        setNameSuccess(true);
      }
    } catch {
      setNameError("Failed to update profile.");
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
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
        setPasswordError(result.error.message || "Failed to change password.");
      } else {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError(
        "Failed to change password. Check your current password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full px-4 py-6">
        {/* Page header */}
        <div className="mb-5 flex items-center gap-2 border-b border-neutral-200 pb-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <SettingsIcon className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-neutral-900">
              Pengaturan Akun
            </h1>
            <p className="text-xs text-neutral-500">
              Kelola profil dan keamanan akun Anda
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          {/* Sidebar */}
          <SettingsNav
            user={user}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Content */}
          <div className="min-w-0 flex-1">
            {activeTab === "profile" && (
              <section className="rounded-lg border border-neutral-200 bg-white p-4">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900">
                      Informasi Profil
                    </h2>
                    <p className="mt-1 text-xs text-neutral-500">
                      Perbarui nama tampilan dan informasi profil publik Anda
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        disabled
                        className="bg-neutral-50 text-neutral-500"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Alamat email tidak dapat diubah
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nama</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama Anda"
                        required
                      />
                    </div>

                    {nameError && (
                      <p className="text-sm text-destructive">{nameError}</p>
                    )}
                    {nameSuccess && (
                      <p className="text-sm text-emerald-600">
                        Profil berhasil diperbarui
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={nameLoading}>
                    {nameLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </form>
              </section>
            )}

            {activeTab === "security" && (
              <section className="rounded-lg border border-neutral-200 bg-white p-4">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900">
                      Ubah Password
                    </h2>
                    <p className="mt-1 text-xs text-neutral-500">
                      Perbarui password Anda untuk menjaga keamanan akun
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="currentPassword">Password Saat Ini</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Masukkan password saat ini"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword">Password Baru</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Masukkan password baru"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">
                        Konfirmasi Password Baru
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Konfirmasi password baru"
                        required
                      />
                    </div>

                    {passwordError && (
                      <p className="text-sm text-destructive">
                        {passwordError}
                      </p>
                    )}
                    {passwordSuccess && (
                      <p className="text-sm text-emerald-600">
                        Password berhasil diubah
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? "Menyimpan..." : "Ubah Password"}
                  </Button>
                </form>
              </section>
            )}

            {activeTab === "notification" && (
              <section className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900">
                      Notifikasi
                    </h2>
                    <p className="mt-1 text-xs text-neutral-500">
                      Kelola preferensi notifikasi Anda
                    </p>
                  </div>

                  {!isNotifLoaded ? (
                    <div className="text-xs text-neutral-500">
                      Memuat pengaturan...
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <Label htmlFor="aqiWarnings">
                              Peringatan Kualitas Udara
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                              Dapatkan notifikasi saat polusi udara (AQI)
                              melebihi batas.
                            </p>
                          </div>
                          <Switch
                            id="aqiWarnings"
                            checked={notifSettings.enableAqiWarnings}
                            onCheckedChange={(v) =>
                              updateNotifSettings({ enableAqiWarnings: v })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <Label htmlFor="tempWarnings">
                              Peringatan Suhu Tinggi
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                              Dapatkan notifikasi jika suhu sangat panas
                              (&ge;35&deg;C).
                            </p>
                          </div>
                          <Switch
                            id="tempWarnings"
                            checked={notifSettings.enableTempWarnings}
                            onCheckedChange={(v) =>
                              updateNotifSettings({ enableTempWarnings: v })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <Label htmlFor="rainWarnings">
                              Peringatan Hujan
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                              Dapatkan notifikasi jika kemungkinan hujan tinggi
                              (&ge;80%).
                            </p>
                          </div>
                          <Switch
                            id="rainWarnings"
                            checked={notifSettings.enableRainWarnings}
                            onCheckedChange={(v) =>
                              updateNotifSettings({ enableRainWarnings: v })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <Label htmlFor="nearbyReports">
                              Laporan Stasiun Terdekat
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                              Notifikasi dari stasiun AQI terdekat (radius 10km)
                              yang menunjukkan peringatan.
                            </p>
                          </div>
                          <Switch
                            id="nearbyReports"
                            checked={notifSettings.enableNearbyReports}
                            onCheckedChange={(v) =>
                              updateNotifSettings({ enableNearbyReports: v })
                            }
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1.5">
                        <Label htmlFor="aqiThreshold">
                          Ambang Batas AQI Peringatan
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Notifikasi AQI dan Stasiun Terdekat akan muncul jika
                          nilainya melebihi angka ini.
                        </p>
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
                          className="max-w-50"
                        />
                      </div>

                      {notifSuccess && (
                        <p className="text-sm text-emerald-600">
                          Pengaturan notifikasi berhasil disimpan
                        </p>
                      )}

                      <Button onClick={handleSaveNotifSettings} disabled={notifLoading}>
                        {notifLoading ? "Menyimpan..." : "Simpan Perubahan"}
                      </Button>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
