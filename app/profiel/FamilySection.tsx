'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type FamilyLink = {
  id: string
  invite_code: string
  child_name: string | null
  child_id: string | null
  accepted_at: string | null
  created_at: string
}

export default function FamilySection({ userId }: { userId: string }) {
  const [links, setLinks] = useState<FamilyLink[]>([])
  const [creating, setCreating] = useState(false)
  const [childName, setChildName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('family_links')
      .select('*')
      .eq('parent_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setLinks(data ?? []))
  }, [])

  async function handleCreate() {
    if (!childName.trim()) return
    setCreating(true)
    const { data } = await supabase
      .from('family_links')
      .insert({ parent_id: userId, child_name: childName.trim() })
      .select()
      .single()
    if (data) setLinks(prev => [data, ...prev])
    setChildName('')
    setShowForm(false)
    setCreating(false)
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/invite/${code}`
    navigator.clipboard.writeText(url)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  async function deleteLink(id: string) {
    if (!confirm('Koppeling verwijderen?')) return
    await supabase.from('family_links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>👨‍👩‍👧 Gezin</h3>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>Koppel je kind aan jouw account</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ fontSize: 13, fontWeight: 600, color: '#f97316', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
          </svg>
          Kind toevoegen
        </button>
      </div>

      {showForm && (
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', gap: 8 }}>
          <input
            autoFocus
            type="text"
            placeholder="Naam van je kind (bijv. Emma)"
            value={childName}
            onChange={e => setChildName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.currentTarget.style.borderColor = '#f97316'}
            onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !childName.trim()}
            style={{ background: childName.trim() ? '#f97316' : '#e5e7eb', color: childName.trim() ? 'white' : '#9ca3af', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: childName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
          >
            {creating ? '...' : 'Aanmaken'}
          </button>
        </div>
      )}

      <div>
        {links.length === 0 ? (
          <p style={{ padding: '20px 24px', fontSize: 13, color: '#9ca3af', margin: 0, textAlign: 'center' }}>
            Nog geen kinderen gekoppeld. Maak een uitnodigingslink aan.
          </p>
        ) : (
          links.map(link => (
            <div key={link.id} style={{ padding: '14px 24px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: link.accepted_at ? 'linear-gradient(135deg, #22c55e, #4ade80)' : 'linear-gradient(135deg, #e5e7eb, #d1d5db)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {link.accepted_at ? '👦' : '⏳'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{link.child_name ?? 'Kind'}</p>
                <p style={{ fontSize: 11, color: link.accepted_at ? '#16a34a' : '#f97316', margin: '1px 0 0', fontWeight: 600 }}>
                  {link.accepted_at ? '✓ Gekoppeld' : '⏳ Wacht op acceptatie'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {link.accepted_at ? (
                  <Link
                    href={`/chat/${link.id}`}
                    style={{ fontSize: 12, fontWeight: 600, color: '#f97316', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 7, padding: '5px 10px', textDecoration: 'none' }}
                  >
                    💬 Chat
                  </Link>
                ) : (
                  <button
                    onClick={() => copyLink(link.invite_code)}
                    style={{ fontSize: 12, fontWeight: 600, color: copied === link.invite_code ? '#16a34a' : '#6b7280', background: copied === link.invite_code ? '#f0fdf4' : '#f9fafb', border: `1.5px solid ${copied === link.invite_code ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {copied === link.invite_code ? '✓ Gekopieerd' : '🔗 Kopieer link'}
                  </button>
                )}
                <button
                  onClick={() => deleteLink(link.id)}
                  style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '5px' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
