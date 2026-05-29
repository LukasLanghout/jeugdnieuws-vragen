'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/` },
    })
    setLoading(false)
    if (!error) setSent(true)
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Inloggen</h2>
        <p className="text-gray-500 text-sm mb-6">
          We sturen je een inloglink per e-mail. Je hebt geen wachtwoord nodig.
        </p>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-sm">
            ✅ Check je e-mail! We hebben een inloglink gestuurd naar <strong>{email}</strong>.
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="jouw@email.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Versturen...' : 'Stuur inloglink'}
            </button>
          </form>
        )}

        <p className="text-xs text-gray-400 mt-4 text-center">
          Je blijft anoniem — we gebruiken je e-mail alleen om in te loggen.
        </p>
      </div>
    </div>
  )
}
