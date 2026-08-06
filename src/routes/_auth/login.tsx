import { createFileRoute, useNavigate, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { getSession } from '@/lib/auth.functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import googleIcon from '@/assets/icons/google.svg'

type LoginSearch = {
  redirect?: string
}

export const Route = createFileRoute('/_auth/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
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
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: search.redirect || '/dashboard',
    })

    if (error) {
      setError(error.message || 'Google login failed')
      setLoading(false)
      return
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await authClient.signIn.email({
      email,
      password,
    })

    if (error) {
      setError(error.message || 'Invalid email or password')
      setLoading(false)
      return
    }

    // Success - navigate to redirect URL or dashboard
    navigate({ to: search.redirect || '/dashboard' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Logo */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8">
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-xl font-bold text-gray-900">Prita.</span>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20">
        <div className="w-full max-w-77.5 sm:max-w-87.5 md:max-w-95 space-y-5 sm:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Login</h1>

            <p className="text-xs sm:text-sm text-gray-500">
              Haii! Senang lihat kamu kembali 👋
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs sm:text-sm">
                {error}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full h-9 sm:h-10 gap-2 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm"
              disabled={loading}
              onClick={handleGoogleLogin}
            >
              <img src={googleIcon} alt="Google" className="w-4 h-4" />
              Masuk dengan Google
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
                    placeholder="Masukkan kata sandi"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-8 sm:h-9 border-gray-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Checkbox id="remember" />
                  <Label
                    htmlFor="remember"
                    className="text-[11px] sm:text-sm font-normal cursor-pointer text-gray-700"
                  >
                    Ingat saya
                  </Label>
                </div>

                <span className="text-[11px] sm:text-sm text-gray-900 hover:underline cursor-pointer">
                  Lupa kata sandi?
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-3 sm:mt-4 h-9 sm:h-10 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm"
            >
              {loading ? "Memuat..." : "Masuk"}
            </Button>

            <p className="text-center text-[11px] sm:text-sm">
              <span className="text-gray-500">
                Belum punya akun?
              </span>{" "}
              <Link
                to="/register"
                className="font-medium text-gray-900 hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
