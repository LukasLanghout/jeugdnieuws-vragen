'use client'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
    >
      Uitloggen
    </button>
  )
}
