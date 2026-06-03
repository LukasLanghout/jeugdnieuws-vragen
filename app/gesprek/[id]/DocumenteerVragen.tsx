'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type User = { id: string } | null

export default function DocumenteerVragen({ articleId, user, alreadyAdded }: {
  articleId: string; user: User; alreadyAdded: boolean
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>(alreadyAdded ? 'done' : 'idle')
  const router = useRouter()
  const supabase = createClient()

  async function handleAdd() {
    if (!user || state !== 'idle') return
    setState('loading')
    await supabase.from('diary_entries').insert({ user_id: user.id, article_id: articleId })
    setState('done')
    router.push('/profiel')
  }

  if (!user) {
    return (
      <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: 'white', border: '2px solid #ede8e0', borderRadius: 12, boxShadow: '0 3px 0 0 #ede8e0', fontSize: 14, fontWeight: 700, color: '#7c6f5e', textDecoration: 'none' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Inloggen om vragen te documenteren
      </Link>
    )
  }

  if (state === 'done') {
    return (
      <Link href="/profiel" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 12, boxShadow: '0 3px 0 0 #bbf7d0', fontSize: 14, fontWeight: 700, color: '#15803d', textDecoration: 'none' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        In dagboek — vragen invullen
      </Link>
    )
  }

  return (
    <button onClick={handleAdd} disabled={state === 'loading'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: '#f97316', border: '2px solid transparent', borderRadius: 12, boxShadow: '0 3px 0 0 rgba(0,0,0,0.18)', fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      {state === 'loading' ? 'Toevoegen...' : 'Vragen documenteren'}
    </button>
  )
}
