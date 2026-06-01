'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type User = { id: string } | null

export default function AddToDiary({ articleId, user, alreadyAdded }: { articleId: string; user: User; alreadyAdded: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>(alreadyAdded ? 'done' : 'idle')
  const router = useRouter()
  const supabase = createClient()

  async function handleAdd() {
    if (!user || state !== 'idle') return
    setState('loading')
    await supabase.from('diary_entries').insert({ user_id: user.id, article_id: articleId })
    setState('done')
    router.refresh()
  }

  if (!user) {
    return (
      <Link href="/login" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 600, color: '#9c8b78',
        textDecoration: 'none', padding: '8px 14px',
        background: '#fdf8f3', border: '1.5px solid #ede8e0', borderRadius: 10,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
        </svg>
        Inloggen om toe te voegen aan dagboek
      </Link>
    )
  }

  if (state === 'done') {
    return (
      <Link href="/profiel" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 700, color: '#16a34a',
        textDecoration: 'none', padding: '8px 14px',
        background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        In dagboek — bekijk
      </Link>
    )
  }

  return (
    <button onClick={handleAdd} disabled={state === 'loading'} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 13, fontWeight: 700, color: '#f97316',
      background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10,
      padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
      </svg>
      {state === 'loading' ? 'Toevoegen...' : 'Toevoegen aan dagboek'}
    </button>
  )
}
