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
    <div className="relative mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Zoek op onderwerp... (bijv. klimaat, sport, ruimte)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full border border-gray-200 rounded-2xl px-5 py-3 pr-12 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
            </svg>
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {results.map(article => (
            <Link
              key={article.id}
              href={`/artikel/${article.id}`}
              onClick={() => { setOpen(false); setQuery('') }}
              className="flex flex-col px-5 py-3 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <span className="text-xs text-orange-500 font-semibold">
                {new Date(article.published_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
              </span>
              <span className="text-sm font-semibold text-gray-800">{article.title}</span>
              {article.summary && (
                <span className="text-xs text-gray-500 mt-0.5 line-clamp-1">{article.summary}</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.trim() && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 px-5 py-4 text-sm text-gray-500">
          Geen artikelen gevonden voor "{query}"
        </div>
      )}
    </div>
  )
}
