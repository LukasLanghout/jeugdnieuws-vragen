'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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


  async function handleDemoLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: 'demo.ouder@tafelvragen.nl',
      password: 'demo1234',
    })
    if (error) {
      setError('Demo login mislukt, probeer het opnieuw.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const inputStyle = {
    width: '100%',
    border: '1.5px solid #e5e7eb',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 14,
    outline: 'none',
    color: '#111827',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: 20 }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#f97316', textDecoration: 'none', marginBottom: 28 }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
        </svg>
        Terug
      </Link>

      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{
                flex: 1,
                padding: '16px 0',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: mode === m ? '#f97316' : '#9ca3af',
                borderBottom: mode === m ? '2px solid #f97316' : '2px solid transparent',
                transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {m === 'login' ? 'Inloggen' : 'Account aanmaken'}
            </button>
          ))}
        </div>

        <div style={{ padding: 28 }}>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 22px' }}>
            {mode === 'login'
              ? 'Log in om vragen van je kind te delen over het nieuws.'
              : 'Maak een gratis account aan om vragen te delen.'}
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16a34a', marginBottom: 16 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              required
              placeholder="jouw@email.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <input
              type="password"
              required
              placeholder="Wachtwoord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#e5e7eb' : '#f97316',
                color: loading ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: 10,
                padding: '13px 0',
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Laden...' : mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
            </button>
          </form>
        </div>

        <div style={{ padding: '0 28px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 14px' }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>of probeer de demo</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            style={{ width: '100%', background: '#fff7ed', color: '#f97316', border: '1.5px solid #fed7aa', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Demo gezin bekijken
          </button>
        </div>
      </div>
    </div>
  )
}
