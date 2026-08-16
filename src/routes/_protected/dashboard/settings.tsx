import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Settings as SettingsIcon, User, Lock } from 'lucide-react'

export const Route = createFileRoute('/_protected/dashboard/settings')({
  component: Settings,
})

function Settings() {
  const { user } = Route.useRouteContext()
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')

  const [name, setName] = useState(user.name || '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    setNameSuccess(false)
    setNameLoading(true)
    try {
      const result = await authClient.updateUser({ name })
      if (result.error) {
        setNameError(result.error.message || 'Failed to update profile.')
      } else {
        setNameSuccess(true)
      }
    } catch {
      setNameError('Failed to update profile.')
    } finally {
      setNameLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setPasswordLoading(true)
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      })
      if (result.error) {
        setPasswordError(result.error.message || 'Failed to change password.')
      } else {
        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setPasswordError('Failed to change password. Check your current password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      <div className="flex flex-col gap-2 p-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-xl bg-muted/50 p-2">
          {/* Header */}
          <section className="rounded-lg bg-white p-4 shadow-sm">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
              <SettingsIcon className="h-3.5 w-3.5" />
              Pengaturan
            </div>

            <h1 className="mt-2.5 text-base font-semibold tracking-tight text-neutral-900">
              Pengaturan Akun
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Kelola profil dan keamanan akun Anda
            </p>

            {/* Tabs */}
            <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Profil
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                Keamanan
              </button>
            </div>
          </section>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <section className="rounded-lg bg-white p-4 shadow-sm">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">
                    Informasi Profil
                  </h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    Perbarui nama tampilan dan informasi profil publik Anda
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-neutral-700">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="mt-1.5 h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-xs text-neutral-500"
                    />
                    <p className="mt-1 text-xs text-neutral-400">
                      Alamat email tidak dapat diubah
                    </p>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-xs font-medium text-neutral-700">
                      Nama
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Anda"
                      required
                      className="mt-1.5 h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  {nameError && (
                    <p className="text-xs text-red-500">{nameError}</p>
                  )}
                  {nameSuccess && (
                    <p className="text-xs text-emerald-600">Profil berhasil diperbarui</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={nameLoading}
                  className="h-9 rounded-lg bg-neutral-900 px-4 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                >
                  {nameLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </section>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <section className="rounded-lg bg-white p-4 shadow-sm">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">
                    Ubah Password
                  </h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    Perbarui password Anda untuk menjaga keamanan akun
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="currentPassword" className="block text-xs font-medium text-neutral-700">
                      Password Saat Ini
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password saat ini"
                      required
                      className="mt-1.5 h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-medium text-neutral-700">
                      Password Baru
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                      required
                      className="mt-1.5 h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-neutral-700">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Konfirmasi password baru"
                      required
                      className="mt-1.5 h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-xs text-red-500">{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-xs text-emerald-600">Password berhasil diubah</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="h-9 rounded-lg bg-neutral-900 px-4 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                >
                  {passwordLoading ? 'Menyimpan...' : 'Ubah Password'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
