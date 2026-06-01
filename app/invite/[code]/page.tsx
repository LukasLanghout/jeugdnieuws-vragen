import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AcceptInvite from './AcceptInvite'

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: link } = await supabase
    .from('family_links')
    .select('id, child_name, accepted_at, parent_id')
    .eq('invite_code', code)
    .single()

  const { data: { user } } = await supabase.auth.getUser()

  if (!link) {
    return (
      <div style={{ maxWidth: 400, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>Ongeldige uitnodiging</h2>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Deze link bestaat niet of is verlopen.</p>
      </div>
    )
  }

  if (link.accepted_at) {
    return (
      <div style={{ maxWidth: 400, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>Al gekoppeld</h2>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Deze uitnodiging is al gebruikt.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', padding: '32px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👨‍👩‍👧</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 6px' }}>Je bent uitgenodigd!</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Koppel jouw account aan het gezin van <strong>{link.child_name ?? 'je ouder'}</strong>
          </p>
        </div>
        <div style={{ padding: 28 }}>
          <AcceptInvite linkId={link.id} childName={link.child_name} user={user} inviteCode={code} />
        </div>
      </div>
    </div>
  )
}
