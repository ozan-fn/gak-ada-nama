import { createFileRoute, useNavigate, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { getSession } from '#/lib/auth.functions'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import googleIcon from '#/assets/icons/google.svg'
import logoBlue from '#/assets/images/logo-blue.png'

type RegisterSearch = {
  redirect?: string
}

export const Route = createFileRoute('/_auth/register')({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => {
    return {
      redirect: (search.redirect as string) || undefined,
    }
  },
  beforeLoad: async ({ search }) => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: search.redirect || '/dashboard' })
    }
  },
  component: Register,
})

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleRegister = async () => {
    setGoogleLoading(true)
    setError('')

    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    })

    if (error) {
      setError(error.message || 'Google registration failed')
      setGoogleLoading(false)
    }
    // ponytail: no finally block - social login redirects away on success
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    })

    if (error) {
      setError(error.message || 'Registration failed')
      setLoading(false)
      return
    }

    // Success - navigate to redirect URL or dashboard
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Logo */}
      <Link to="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8">
        <img src={logoBlue} alt="Prita Logo" className="h-6 sm:h-6.5" />
      </Link>

      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20">
        <div className="w-full max-w-77.5 sm:max-w-87.5 md:max-w-95 space-y-5 sm:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Daftar</h1>

            <p className="text-xs sm:text-sm text-gray-500">
              Buat akun baru untuk memulai 🚀
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5 sm:space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs sm:text-sm">
                {error}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full h-9 sm:h-10 gap-2 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm"
              disabled={googleLoading || loading}
              onClick={handleGoogleRegister}
            >
              <img src={googleIcon} alt="Google" className="w-4 h-4" />
              {googleLoading ? "Membuka Google..." : "Daftar dengan Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-[10px] sm:text-xs">
                <span className="bg-white px-2 text-gray-500">
                  atau
                </span>
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="name" className="text-gray-900 text-xs sm:text-sm">Nama</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nama lengkap"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 sm:h-9 border-gray-300 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="email" className="text-gray-900 text-xs sm:text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prita@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 sm:h-9 border-gray-300 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="password" className="text-gray-900 text-xs sm:text-sm">Kata Sandi</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 8 karakter"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-8 sm:h-9 border-gray-300 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-3 sm:mt-4 h-9 sm:h-10 bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm"
            >
              {loading ? "Memuat..." : "Daftar"}
            </Button>

            <p className="text-center text-[11px] sm:text-sm">
              <span className="text-gray-500">
                Sudah punya akun?
              </span>{" "}
              <Link
                to="/login"
                className="font-medium text-gray-900 hover:underline"
              >
                Masuk sekarang
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
