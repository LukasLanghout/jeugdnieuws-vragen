'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Article = { id: string; title: string; image_url: string | null; published_at: string }

export default function ArticlePicker({ userId, existingArticleIds }: { userId: string; existingArticleIds: string[] }) {
  const [open, setOpen] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    supabase
      .from('articles')
      .select('id, title, image_url, published_at')
      .order('published_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setArticles(data ?? []))
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const filtered = articles.filter(a =>
    !existingArticleIds.includes(a.id) &&
    a.title.toLowerCase().includes(query.toLowerCase())
  )

  function toggleArticle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleAdd() {
    if (selected.size === 0) return
    setSaving(true)
    const rows = Array.from(selected).map(article_id => ({ user_id: userId, article_id }))
    await supabase.from('diary_entries').insert(rows)
    setSaving(false)
    setOpen(false)
    setSelected(new Set())
    setQuery('')
    router.refresh()
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ fontSize: 13, fontWeight: 600, color: '#f97316', textDecoration: 'none', padding: '6px 14px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
        </svg>
        Nieuw artikel koppelen
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 360, background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #f3f4f6', zIndex: 200, overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '14px 14px 10px' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="Zoek artikel..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 10px 8px 30px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = '#f97316'}
                onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          {/* Article list */}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: '16px 16px', fontSize: 13, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
                {articles.length === 0 ? 'Artikelen laden...' : 'Geen artikelen gevonden'}
              </p>
            ) : (
              filtered.map(article => {
                const isSelected = selected.has(article.id)
                return (
                  <div
                    key={article.id}
                    onClick={() => toggleArticle(article.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: isSelected ? '#fff7ed' : 'white', borderBottom: '1px solid #f9fafb', transition: 'background 0.1s' }}
                  >
                    {/* Checkbox */}
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? '#f97316' : '#d1d5db'}`, background: isSelected ? '#f97316' : 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}>
                      {isSelected && (
                        <svg width="10" height="10" fill="none" stroke="white" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                    {article.image_url && (
                      <img src={article.image_url} alt="" style={{ width: 44, height: 34, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#f97316', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {new Date(article.published_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {article.title}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
              {selected.size > 0 ? `${selected.size} geselecteerd` : 'Selecteer artikelen'}
            </span>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0 || saving}
              style={{ background: selected.size === 0 ? '#e5e7eb' : '#f97316', color: selected.size === 0 ? '#9ca3af' : 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: selected.size === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              {saving ? 'Toevoegen...' : `Toevoegen${selected.size > 0 ? ` (${selected.size})` : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
