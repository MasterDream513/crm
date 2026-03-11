'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const { t, locale, setLocale } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.login(email, password)
      localStorage.setItem('crm_access_token', res.accessToken)
      localStorage.setItem('crm_user', JSON.stringify(res.user))
      router.push('/')
    } catch (err: any) {
      setError(err.message ?? t.login.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative">
        <button
          type="button"
          onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
          className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5"
        >
          <Globe className="w-3.5 h-3.5" />
          {locale === 'ja' ? 'English' : '日本語'}
        </button>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t.login.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.login.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.login.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder={t.login.emailPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.login.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? t.login.submitting : t.login.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
