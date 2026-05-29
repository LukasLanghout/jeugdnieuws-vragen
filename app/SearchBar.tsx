'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Article = { id: string; title: string; summary: string | null; published_at: string }

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setOpen(true)
      setLoading(false)
    }, 400)
  }, [query])

  return (
    <div style={{ position: 'relative', marginBottom: 24 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
          {loading ? (
            <svg style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
            </svg>
          )}
        </div>
        <input
          type="text"
          placeholder="Zoek op onderwerp… bijv. klimaat, raket, verkiezingen"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          style={{
            width: '100%',
            border: '1.5px solid #e5e7eb',
            borderRadius: 14,
            padding: '13px 16px 13px 46px',
            fontSize: 14,
            background: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            outline: 'none',
            boxSizing: 'border-box',
            color: '#111827',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
        />
      </div>

      {open && results.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 50, width: '100%', marginTop: 8, background: 'white', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          {results.map((article, i) => (
            <Link
              key={article.id}
              href={`/artikel/${article.id}`}
              onClick={() => { setOpen(false); setQuery('') }}
              style={{ display: 'flex', flexDirection: 'column', padding: '12px 18px', textDecoration: 'none', borderBottom: i < results.length - 1 ? '1px solid #f9fafb' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fff7ed')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {new Date(article.published_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginTop: 2 }}>{article.title}</span>
              {article.summary && (
                <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }} className="line-clamp-1">{article.summary}</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.trim() && (
        <div style={{ position: 'absolute', zIndex: 50, width: '100%', marginTop: 8, background: 'white', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #f3f4f6', padding: '14px 18px', fontSize: 14, color: '#9ca3af' }}>
          Geen artikelen gevonden voor "<strong style={{ color: '#374151' }}>{query}</strong>"
        </div>
      )}
    </div>
  )
}
