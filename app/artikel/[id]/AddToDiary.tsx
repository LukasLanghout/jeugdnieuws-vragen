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
    await supabase.from('diary_entries').insert({
      user_id: user.id,
      article_id: articleId,
    })
    setState('done')
    router.refresh()
  }

  if (!user) {
    return (
      <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#6b7280', textDecoration: 'none', padding: '8px 14px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 9 }}>
        📖 Inloggen om toe te voegen aan dagboek
      </Link>
    )
  }

  if (state === 'done') {
    return (
      <Link href="/profiel" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#16a34a', textDecoration: 'none', padding: '8px 14px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 9 }}>
        ✓ In dagboek — bekijk & bewerk
      </Link>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={state === 'loading'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#f97316', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 9, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
    >
      📖 {state === 'loading' ? 'Toevoegen...' : 'Toevoegen aan dagboek'}
    </button>
  )
}
