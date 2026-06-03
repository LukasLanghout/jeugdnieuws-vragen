import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RodeDraad from './RodeDraad'
import DocumenteerVragen from './DocumenteerVragen'

function renderContent(content: string) {
  const parts = content.split('\n\n')
  return parts.map((part, i) => {
    const imgMatch = part.match(/^\[IMG:(.*)\]$/)
    if (imgMatch) return (
      <div key={i} style={{ margin: '20px -28px' }}>
        <img src={imgMatch[1]} alt="" style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }} />
      </div>
    )
    if (part.startsWith('**') && part.endsWith('**')) return (
      <h3 key={i} style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 18, color: '#1a1209', margin: i === 0 ? 0 : '22px 0 6px', lineHeight: 1.3 }}>
        {part.slice(2, -2)}
      </h3>
    )
    if (part.startsWith('"') && part.endsWith('"')) return (
      <blockquote key={i} style={{ margin: '18px 0', padding: '12px 18px', background: '#fff7ed', borderLeft: '4px solid #f97316', borderRadius: '0 12px 12px 0', fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 16, color: '#7c4a1a', lineHeight: 1.6 }}>
        {part}
      </blockquote>
    )
    if (!part.trim()) return null
    return <p key={i} style={{ margin: i === 0 ? 0 : '14px 0 0', lineHeight: 1.8, fontSize: 16, color: '#3d3022' }}>{part}</p>
  })
}

export default async function GesprekArtikelPage({ params }: { params: Promise<{ id: string }> }) {
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
    const { data: existing } = await supabase.from('diary_entries').select('id').eq('user_id', user.id).eq('article_id', id).single()
    alreadyAdded = !!existing
  }

  const fullDate = new Date(article.published_at).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ maxWidth: 660, margin: '0 auto' }}>
      <Link href="/gesprek" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#c2410c', textDecoration: 'none', marginBottom: 22, padding: '6px 12px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10 }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
        Gesprekken
      </Link>

      <article style={{ background: 'white', borderRadius: 22, overflow: 'hidden', border: '2px solid #ede8e0', boxShadow: '0 4px 0 0 rgba(0,0,0,0.08)', marginBottom: 20 }}>
        {article.image_url && (
          <img src={article.image_url} alt="" style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ padding: '22px 28px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'white', background: '#f97316', padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.07em', boxShadow: '0 2px 0 rgba(0,0,0,0.15)' }}>
              Gesprek bij het avondeten
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#b87c3e' }}>{fullDate}</span>
          </div>

          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#1a1209', margin: '0 0 16px', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
            {article.title}
          </h1>

          {article.summary && (
            <p style={{ fontSize: 16, fontWeight: 500, color: '#5c4a30', lineHeight: 1.65, margin: '0 0 20px', padding: '12px 16px', background: '#fdf8f3', borderLeft: '3px solid #d4c4a8', borderRadius: '0 10px 10px 0' }}>
              {article.summary}
            </p>
          )}

          {article.content && (
            <div style={{ fontSize: 16, color: '#3d3022', lineHeight: 1.8 }}>
              {renderContent(article.content)}
            </div>
          )}

          {/* AI Rode draad */}
          <RodeDraad title={article.title} content={article.content} summary={article.summary} />

          {/* Documenteer vragen */}
          <div style={{ marginTop: 24, paddingTop: 22, borderTop: '1.5px solid #ede8e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1209', marginBottom: 2 }}>Had je kind vragen?</div>
              <div style={{ fontSize: 12, color: '#9c8b78' }}>Sla ze op in het dagboek om later op terug te kijken.</div>
            </div>
            <DocumenteerVragen articleId={article.id} user={user} alreadyAdded={alreadyAdded} />
          </div>
        </div>
      </article>
    </div>
  )
}
