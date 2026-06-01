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
      return (
        <div key={i} style={{ margin: '20px -28px', overflow: 'hidden' }}>
          <img src={imgMatch[1]} alt="" style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'cover' }} />
        </div>
      )
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <h3 key={i} style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontWeight: 700, fontSize: 19,
          color: '#1a1209', margin: i === 0 ? 0 : '24px 0 6px',
          lineHeight: 1.3,
        }}>
          {part.slice(2, -2)}
        </h3>
      )
    }
    if (part.startsWith('"') && part.endsWith('"')) {
      return (
        <blockquote key={i} style={{
          margin: '20px 0',
          padding: '14px 20px',
          background: '#fff7ed',
          borderLeft: '4px solid #f97316',
          borderRadius: '0 14px 14px 0',
          fontFamily: "'Newsreader', Georgia, serif",
          fontStyle: 'italic',
          fontSize: 17,
          color: '#7c4a1a',
          lineHeight: 1.6,
        }}>
          {part}
        </blockquote>
      )
    }
    if (!part.trim()) return null
    return (
      <p key={i} style={{
        margin: i === 0 ? 0 : '16px 0 0',
        lineHeight: 1.8,
        fontSize: 16,
        color: '#3d3022',
      }}>
        {part}
      </p>
    )
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
    <div style={{ maxWidth: 660, margin: '0 auto' }}>
      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 700, color: '#9c8b78',
        textDecoration: 'none', marginBottom: 22,
      }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
        </svg>
        Alle berichten
      </Link>

      <article style={{
        background: 'white',
        borderRadius: 22,
        overflow: 'hidden',
        border: '2px solid #ede8e0',
        boxShadow: '0 4px 0 0 rgba(0,0,0,0.08)',
        marginBottom: 20,
      }}>
        {article.image_url && (
          <img src={article.image_url} alt="" style={{ width: '100%', height: 300, objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ padding: '24px 28px 28px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#b87c3e', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
            {fullDate}
          </p>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 30, fontWeight: 700,
            color: '#1a1209', margin: '0 0 18px',
            lineHeight: 1.2, letterSpacing: '-0.3px',
          }}>
            {article.title}
          </h1>

          {article.summary && (
            <p style={{
              fontSize: 16, fontWeight: 500,
              color: '#5c4a30',
              lineHeight: 1.65,
              margin: '0 0 22px',
              padding: '14px 18px',
              background: '#fff7ed',
              borderLeft: '4px solid #f97316',
              borderRadius: '0 12px 12px 0',
            }}>
              {article.summary}
            </p>
          )}

          {article.content ? (
            <div style={{ fontSize: 16, color: '#3d3022', lineHeight: 1.8 }}>
              {renderContent(article.content)}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: '#b0a090', fontStyle: 'italic' }}>Volledige tekst wordt geladen bij de volgende scrape.</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 28, paddingTop: 22, borderTop: '1.5px solid #ede8e0', flexWrap: 'wrap' }}>
            {article.source_url && (
              <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 700, color: '#9c8b78',
                  textDecoration: 'none', padding: '8px 14px',
                  background: '#fdf8f3', borderRadius: 10,
                  border: '1.5px solid #ede8e0',
                }}>
                Jeugdjournaal.nl
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            )}
            <AddToDiary articleId={article.id} user={user} alreadyAdded={alreadyAdded} />
          </div>
        </div>
      </article>

      <div style={{
        background: 'white',
        borderRadius: 20,
        border: '2px solid #ede8e0',
        boxShadow: '0 4px 0 0 rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #ede8e0', background: '#fdf8f3' }}>
          <h2 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 18, fontWeight: 700,
            color: '#1a1209', margin: 0,
          }}>
            💬 Welke vraag stelde jouw kind?
          </h2>
          <p style={{ fontSize: 13, color: '#9c8b78', margin: '4px 0 0' }}>
            Deel het gesprek dat jullie hadden aan tafel
          </p>
        </div>
        <div style={{ padding: 24 }}>
          <QuestionForm articleId={article.id} user={user} />
        </div>
      </div>
    </div>
  )
}
