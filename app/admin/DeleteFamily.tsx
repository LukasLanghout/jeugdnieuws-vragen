'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DeleteFamily({ familyId }: { familyId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    setLoading(true)
    await supabase.from('family_links').delete().eq('id', familyId)
    router.refresh()
  }

  if (confirm) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{ fontSize: 11, fontWeight: 700, color: 'white', background: '#dc2626', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {loading ? 'Bezig...' : 'Ja, verwijder'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          style={{ fontSize: 11, fontWeight: 700, color: '#7c6f5e', background: '#f3ede6', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Annuleer
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      style={{ fontSize: 11, fontWeight: 700, color: '#9c8b78', background: 'none', border: '1.5px solid #ede8e0', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
    >
      Verwijder
    </button>
  )
}
