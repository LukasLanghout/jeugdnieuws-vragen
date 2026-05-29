'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Verkeerd e-mailadres of wachtwoord.')
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account aangemaakt! Je kunt nu inloggen.')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {mode === 'login'
            ? 'Log in om vragen te delen over het nieuws.'
            : 'Maak een account aan om vragen te delen.'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-800 text-sm mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="jouw@email.nl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="password"
            required
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Laden...' : mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-500">
          {mode === 'login' ? (
            <>Nog geen account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); setSuccess('') }} className="text-orange-600 hover:underline font-medium">
                Aanmelden
              </button>
            </>
          ) : (
            <>Al een account?{' '}
              <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className="text-orange-600 hover:underline font-medium">
                Inloggen
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
