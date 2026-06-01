import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import QuestionForm from './QuestionForm'
import AddToDiary from './AddToDiary'

function renderContent(content: string) {
  const parts = content.split('\n\n')
  return parts.map((part, i) => {
    const imgMatch = part.match(/^\[IMG:(.*)\]$/)
    if (imgMatch) {
      return <img key={i} src={imgMatch[1]} alt="" style={{ width: '100%', borderRadius: 12, margin: '8px 0', display: 'block' }} />
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <p key={i} style={{ fontWeight: 700, color: '#111827', margin: i === 0 ? 0 : '18px 0 0', fontSize: 15 }}>{part.slice(2, -2)}</p>
    }
    if (part.startsWith('"') && part.endsWith('"')) {
      return (
        <blockquote key={i} style={{ margin: i === 0 ? 0 : '14px 0 0', padding: '10px 16px', background: '#f9fafb', borderLeft: '3px solid #d1d5db', borderRadius: '0 8px 8px 0', fontStyle: 'italic', color: '#6b7280', fontSize: 14 }}>
          {part}
        </blockquote>
      )
    }
    return <p key={i} style={{ margin: i === 0 ? 0 : '14px 0 0' }}>{part}</p>
  })
}

export default async function ArtikelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: article } = await supabase.from('articles').select('*').eq('id', id).single()
  if (!article) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if already in diary
  let alreadyAdded = false
  if (user) {
    const { data: existing } = await supabase
      .from('diary_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('article_id', id)
      .single()
    alreadyAdded = !!existing
  }

  const fullDate = new Date(article.published_at).toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#f97316', textDecoration: 'none', marginBottom: 20 }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
        </svg>
        Terug naar overzicht
      </Link>

      <article style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 24 }}>
        {article.image_url && (
          <img src={article.image_url} alt="" style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ padding: '24px 28px 28px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
            {fullDate}
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 16px', lineHeight: 1.2 }}>
            {article.title}
          </h1>

          {article.summary && (
            <div style={{ fontSize: 15, fontWeight: 500, color: '#374151', lineHeight: 1.65, margin: '0 0 20px', padding: '12px 16px', background: '#fff7ed', borderLeft: '3px solid #fb923c', borderRadius: '0 10px 10px 0' }}>
              {article.summary}
            </div>
          )}

          {article.content ? (
            <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.75 }}>
              {renderContent(article.content)}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>Volledige tekst wordt geladen bij de volgende scrape.</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            {article.source_url && (
              <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="source-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#f97316', textDecoration: 'none', padding: '8px 14px', background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa' }}>
                Bekijk op Jeugdjournaal
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            )}
            <AddToDiary articleId={article.id} user={user} alreadyAdded={alreadyAdded} />
          </div>
        </div>
      </article>

      <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div style={{ padding: '20px 28px 18px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>💬 Welke vraag stelde jouw kind?</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Deel het gesprek dat jullie hadden aan tafel</p>
        </div>
        <div style={{ padding: 28 }}>
          <QuestionForm articleId={article.id} user={user} />
        </div>
      </div>
    </div>
  )
}
