import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'
import DiaryEntry from './DiaryEntry'
import ArticlePicker from './ArticlePicker'

export default async function ProfielPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entries } = await supabase
    .from('diary_entries')
    .select('*, articles(id, title, image_url, published_at, source_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const existingArticleIds = (entries ?? []).map((e: Record<string, unknown>) => e.article_id as string)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Profile header */}
      <div style={{ background: 'white', borderRadius: 20, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #f97316, #fb923c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white', fontWeight: 800, flexShrink: 0 }}>
            {user.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>{user.email}</p>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>
              {entries?.length ?? 0} dagboek{(entries?.length ?? 0) === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* Diary section */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>📖 Ons dagboek</h2>
        <ArticlePicker userId={user.id} existingArticleIds={existingArticleIds} />
      </div>

      {!entries || entries.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 20, padding: '48px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
          <p style={{ fontWeight: 700, color: '#111827', fontSize: 16, margin: '0 0 8px' }}>Nog geen dagboek entries</p>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>Klik op "Nieuw artikel koppelen" om te beginnen, of open een artikel en klik op "Toevoegen aan dagboek".</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {entries.map((entry: Record<string, unknown>) => (
            <DiaryEntry key={entry.id as string} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
