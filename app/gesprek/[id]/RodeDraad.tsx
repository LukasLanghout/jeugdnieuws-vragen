'use client'
import { useState, useEffect } from 'react'

export default function RodeDraad({ title, content, summary }: { title: string; content: string | null; summary: string | null }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/rode-draad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, summary }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.explanation) setText(d.explanation)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [title, content, summary])

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff7ed 0%, #fef9f5 100%)',
      border: '2px solid #fed7aa',
      borderRadius: 18,
      padding: '20px 22px',
      marginTop: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, background: '#f97316', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 0 rgba(0,0,0,0.15)', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#c2410c' }}>Rode draad voor ouders</div>
          <div style={{ fontSize: 11, color: '#b87c3e' }}>Neutrale achtergrond voor het gesprek</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, border: '2px solid #fed7aa', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 13, color: '#b87c3e' }}>Even nadenken...</span>
        </div>
      ) : error ? (
        <p style={{ fontSize: 14, color: '#b87c3e', margin: 0, fontStyle: 'italic' }}>
          Rode draad kon niet worden geladen. Probeer de pagina te vernieuwen.
        </p>
      ) : (
        <p style={{ fontSize: 15, color: '#7c3a0e', lineHeight: 1.7, margin: 0, fontFamily: "'Newsreader', Georgia, serif" }}>
          {text}
        </p>
      )}
    </div>
  )
}
