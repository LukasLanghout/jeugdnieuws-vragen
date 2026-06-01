import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'
import DiaryEntry from './DiaryEntry'
import ArticlePicker from './ArticlePicker'
import FamilySection from './FamilySection'
import Link from 'next/link'

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

  const { data: childLink } = await supabase
    .from('family_links')
    .select('id, child_name, parent_id')
    .eq('child_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  const existingArticleIds = (entries ?? []).map((e: Record<string, unknown>) => e.article_id as string)
  const isParent = !childLink

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Profile header */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 24,
        border: '2px solid #ede8e0',
        boxShadow: '0 4px 0 0 rgba(0,0,0,0.07)',
        marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52,
            background: '#f97316',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: 'white', fontWeight: 800,
            boxShadow: '0 3px 0 0 rgba(0,0,0,0.18)',
            fontFamily: "'Newsreader', Georgia, serif",
          }}>
            {user.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, fontWeight: 700, color: '#1a1209', margin: 0 }}>
              {user.email}
            </p>
            <p style={{ fontSize: 12, color: '#9c8b78', margin: '3px 0 0', fontWeight: 500 }}>
              {isParent ? 'Ouder' : 'Kind, gekoppeld aan gezin'} &middot; {entries?.length ?? 0} {entries?.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* Chat shortcut for child */}
      {childLink && (
        <Link href={`/chat/${childLink.id}`} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'white',
          borderRadius: 16,
          padding: '16px 18px',
          border: '2px solid #ede8e0',
          boxShadow: '0 3px 0 0 rgba(0,0,0,0.06)',
          marginBottom: 20,
          textDecoration: 'none',
        }}>
          <div style={{ width: 40, height: 40, background: '#fff7ed', borderRadius: 12, border: '1.5px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1209', margin: 0 }}>Chat met je ouder</p>
            <p style={{ fontSize: 12, color: '#9c8b78', margin: '2px 0 0' }}>Stel vragen over het nieuws</p>
          </div>
          <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="16" height="16" fill="none" stroke="#d4c4a8" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </Link>
      )}

      {isParent && <FamilySection userId={user.id} />}

      {/* Diary section header */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#1a1209', margin: 0 }}>
          Ons dagboek
        </h2>
        <ArticlePicker userId={user.id} existingArticleIds={existingArticleIds} />
      </div>

      {!entries || entries.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '44px 32px',
          textAlign: 'center',
          border: '2px solid #ede8e0',
          boxShadow: '0 4px 0 0 rgba(0,0,0,0.06)',
        }}>
          <div style={{ width: 52, height: 52, background: '#f3ede6', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4b09a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
            </svg>
          </div>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, color: '#1a1209', fontSize: 17, margin: '0 0 6px' }}>
            Nog geen dagboek entries
          </p>
          <p style={{ fontSize: 13, color: '#9c8b78', margin: 0, lineHeight: 1.6 }}>
            Klik op &ldquo;Artikel toevoegen&rdquo; of open een artikel en voeg het toe aan het dagboek.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {entries.map((entry: Record<string, unknown>) => (
            <DiaryEntry key={entry.id as string} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
