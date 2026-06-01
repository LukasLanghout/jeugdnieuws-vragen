'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Article = { id: string; title: string; image_url: string | null; published_at: string; source_url: string }
type Entry = {
  id: string
  article_id: string
  child_question: string | null
  parent_answer: string | null
  child_opinion: string | null
  free_note: string | null
  created_at: string
  articles: Article
}

export default function DiaryEntry({ entry }: { entry: Record<string, unknown> }) {
  const e = entry as unknown as Entry
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [childQuestion, setChildQuestion] = useState(e.child_question ?? '')
  const [parentAnswer, setParentAnswer] = useState(e.parent_answer ?? '')
  const [childOpinion, setChildOpinion] = useState(e.child_opinion ?? '')
  const [freeNote, setFreeNote] = useState(e.free_note ?? '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const date = new Date(e.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  async function handleSave() {
    setSaving(true)
    await supabase.from('diary_entries').update({
      child_question: childQuestion || null,
      parent_answer: parentAnswer || null,
      child_opinion: childOpinion || null,
      free_note: freeNote || null,
      updated_at: new Date().toISOString(),
    }).eq('id', e.id)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je deze entry wilt verwijderen?')) return
    await supabase.from('diary_entries').delete().eq('id', e.id)
    router.refresh()
  }

  const hasContent = e.child_question || e.parent_answer || e.child_opinion || e.free_note

  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Article header */}
      <div
        style={{ display: 'flex', gap: 14, padding: '16px 18px', cursor: 'pointer', alignItems: 'center' }}
        onClick={() => setExpanded(!expanded)}
      >
        {e.articles?.image_url && (
          <img src={e.articles.image_url} alt="" style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 3px' }}>
            {new Date(e.articles?.published_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>
            {e.articles?.title}
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>{date} · {hasContent ? 'Ingevuld' : 'Leeg'}</p>
        </div>
        <svg width="16" height="16" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </div>

      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f3f4f6' }}>
          {editing ? (
            <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: '🧒 Vraag van het kind', value: childQuestion, set: setChildQuestion, placeholder: 'Wat vroeg je kind over dit bericht?' },
                { label: '👨‍👩‍👦 Antwoord van de ouder', value: parentAnswer, set: setParentAnswer, placeholder: 'Hoe heb je het uitgelegd?' },
                { label: '💭 Wat het kind ervan vond', value: childOpinion, set: setChildOpinion, placeholder: 'Wat vond je kind ervan?' },
                { label: '📝 Vrije notitie', value: freeNote, set: setFreeNote, placeholder: 'Iets bijzonders om te onthouden...' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
                  <textarea
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    rows={2}
                    style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5 }}
                    onFocus={ev => ev.currentTarget.style.borderColor = '#f97316'}
                    onBlur={ev => ev.currentTarget.style.borderColor = '#e5e7eb'}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: saving ? '#e5e7eb' : '#f97316', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: 9, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '10px 16px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#6b7280' }}>
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 14 }}>
              {[
                { label: '🧒 Vraag van het kind', value: e.child_question },
                { label: '👨‍👩‍👦 Antwoord van de ouder', value: e.parent_answer },
                { label: '💭 Wat het kind ervan vond', value: e.child_opinion },
                { label: '📝 Vrije notitie', value: e.free_note },
              ].filter(f => f.value).map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 3px' }}>{label}</p>
                  <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{value}</p>
                </div>
              ))}
              {!hasContent && (
                <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', marginBottom: 12 }}>Nog niets ingevuld — klik op bewerken om te beginnen.</p>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setEditing(true)} style={{ fontSize: 13, fontWeight: 600, color: '#f97316', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✏️ Bewerken
                </button>
                <Link href={`/artikel/${e.article_id}`} style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
                  Artikel bekijken
                </Link>
                <button onClick={handleDelete} style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '7px 4px' }}>
                  Verwijderen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
