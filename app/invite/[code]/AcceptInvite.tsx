'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type User = { id: string; email?: string } | null

export default function AcceptInvite({ linkId, childName, user, inviteCode }: {
  linkId: string; childName: string | null; user: User; inviteCode: string
}) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'accept' | 'login' | 'signup'>('accept')
  const router = useRouter()
  const supabase = createClient()

  async function handleAccept() {
    if (!user) { setMode('login'); return }
    setLoading(true)
    await supabase.from('family_links').update({
      child_id: user.id,
      accepted_at: new Date().toISOString(),
    }).eq('id', linkId)
    setLoading(false)
    router.push(`/chat/${linkId}`)
  }

  async function handleAuth(type: 'login' | 'signup') {
    setLoading(true); setError('')
    const fn = type === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { error: err } = await fn
    if (err) { setError(err.message); setLoading(false); return }
    // After auth, accept invite
    const { data: { user: newUser } } = await supabase.auth.getUser()
    if (newUser) {
      await supabase.from('family_links').update({
        child_id: newUser.id,
        accepted_at: new Date().toISOString(),
      }).eq('id', linkId)
      router.push(`/chat/${linkId}`)
    }
    setLoading(false)
  }

  const inputStyle = { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px 13px', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }

  if (user && mode === 'accept') {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
          Je bent ingelogd als <strong>{user.email}</strong>. Klik om je account te koppelen aan het gezin.
        </p>
        <button
          onClick={handleAccept}
          disabled={loading}
          style={{ width: '100%', background: '#f97316', color: 'white', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {loading ? 'Koppelen...' : '✓ Uitnodiging accepteren'}
        </button>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
          Niet jouw account?{' '}
          <button onClick={() => setMode('login')} style={{ color: '#f97316', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
            Ander account gebruiken
          </button>
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 20, border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        {(['login', 'signup'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '10px 0', fontWeight: 700, fontSize: 13, border: 'none', background: mode === m ? '#f97316' : 'white', color: mode === m ? 'white' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>
            {m === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </button>
        ))}
      </div>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="email" placeholder="E-mailadres" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor='#f97316'} onBlur={e => e.currentTarget.style.borderColor='#e5e7eb'} />
        <input type="password" placeholder="Wachtwoord" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor='#f97316'} onBlur={e => e.currentTarget.style.borderColor='#e5e7eb'} />
        <button onClick={() => handleAuth(mode === 'accept' ? 'login' : mode)} disabled={loading || !email || !password}
          style={{ background: email && password ? '#f97316' : '#e5e7eb', color: email && password ? 'white' : '#9ca3af', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 14, cursor: email && password ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          {loading ? 'Laden...' : mode === 'login' ? 'Inloggen & koppelen' : 'Aanmelden & koppelen'}
        </button>
      </div>
    </div>
  )
}
