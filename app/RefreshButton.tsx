'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RefreshButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function handleRefresh() {
    setState('loading')
    setMsg('')
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setMsg(`${data.inserted} nieuwe artikel${data.inserted === 1 ? '' : 'en'} gevonden`)
        setState('done')
        router.refresh()
        setTimeout(() => setState('idle'), 4000)
      } else {
        setMsg(data.error ?? 'Onbekende fout')
        setState('error')
        setTimeout(() => setState('idle'), 4000)
      }
    } catch {
      setMsg('Verbindingsfout')
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  const colors = {
    idle:    { bg: '#f9fafb', border: '#e5e7eb', color: '#6b7280' },
    loading: { bg: '#fff7ed', border: '#fed7aa', color: '#f97316' },
    done:    { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a' },
    error:   { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
  }
  const c = colors[state]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={handleRefresh}
        disabled={state === 'loading'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px',
          background: c.bg,
          border: `1.5px solid ${c.border}`,
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          color: c.color,
          cursor: state === 'loading' ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: state === 'loading' ? 'spin 1s linear infinite' : 'none' }}
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>
        </svg>
        {state === 'loading' ? 'Vernieuwen...' : 'Vernieuwen'}
      </button>
      {msg && (
        <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>
          {state === 'done' ? '✓ ' : '✗ '}{msg}
        </span>
      )}
    </div>
  )
}
