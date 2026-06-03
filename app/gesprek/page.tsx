import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Article } from '@/lib/supabase'

const DIFFICULT_KEYWORDS = [
  'oorlog','conflict','vluchtelingen','politiek','verkiezing','klimaat','armoede',
  'racisme','discriminatie','geweld','aanslag','terrorisme','crisis','protest',
  'dood','overlijden','ramp','aardbeving','overstroming','brand','explosie',
  'staking','minister','president','wet','rechtbank','gevangenis','asiel','grens',
  'schietpartij','aanval','bezetting','invasie','sanctie','inflatie','werkloosheid',
  'ongelijkheid','kinderarbeid','mensenhandel','foltering',
]

function difficultyScore(article: Article): number {
  const text = `${article.title} ${article.summary ?? ''}`.toLowerCase()
  return DIFFICULT_KEYWORDS.filter(k => text.includes(k)).length
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
}

const THEME_COLORS = [
  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', label: 'Politiek' },
  { bg: '#fff1f2', border: '#fecdd3', text: '#be123c', label: 'Conflict' },
  { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', label: 'Klimaat' },
  { bg: '#fef3c7', border: '#fde68a', text: '#b45309', label: 'Maatschappij' },
  { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce', label: 'Wereld' },
]

export default async function GesprekPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data } = await supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(40)

  const articles = (data ?? []) as Article[]
  const difficult = articles
    .map(a => ({ ...a, score: difficultyScore(a) }))
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.published_at).getTime() - new Date(a.published_at).getTime())

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 999, padding: '4px 14px', marginBottom: 14 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Gesprek bij het avondeten
          </span>
        </div>

        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 30, fontWeight: 700, color: '#1a1209', margin: '0 0 10px', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
          Moeilijke onderwerpen,<br />makkelijk besproken
        </h1>
        <p style={{ fontSize: 15, color: '#7c6f5e', margin: 0, lineHeight: 1.65, maxWidth: 520 }}>
          Deze artikelen gaan over complexe thema's. Elke pagina bevat een neutrale rode draad zodat ouders het gesprek kunnen openen — zonder bias.
        </p>
      </div>

      {/* How it works */}
      <div style={{ background: 'white', borderRadius: 18, border: '2px solid #ede8e0', boxShadow: '0 3px 0 0 rgba(0,0,0,0.06)', padding: '18px 22px', marginBottom: 28, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { step: '1', title: 'Kies een artikel', text: 'Selecteer een actueel onderwerp dat jou opvalt.' },
          { step: '2', title: 'Lees de rode draad', text: 'AI geeft neutrale achtergrond — geen mening, wel context.' },
          { step: '3', title: 'Documenteer vragen', text: 'Sla de vragen van je kind op in het dagboek.' },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', boxShadow: '0 2px 0 rgba(0,0,0,0.15)', flexShrink: 0 }}>
              {s.step}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1209', marginBottom: 3 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#9c8b78', lineHeight: 1.5 }}>{s.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Articles */}
      {difficult.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 18, border: '2px solid #ede8e0', padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 700, color: '#1a1209', margin: '0 0 8px' }}>Geen artikelen gevonden</p>
          <p style={{ fontSize: 13, color: '#9c8b78', margin: 0 }}>Ververs de artikelen via de homepagina.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {difficult.map((article, i) => {
            const theme = THEME_COLORS[i % THEME_COLORS.length]
            return (
              <Link key={article.id} href={`/gesprek/${article.id}`} style={{ textDecoration: 'none' }}>
                <div className="card-hover" style={{ background: 'white', borderRadius: 18, border: '2px solid #ede8e0', boxShadow: '0 3px 0 0 rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex' }}>
                  {article.image_url && (
                    <img src={article.image_url} alt="" style={{ width: 140, flexShrink: 0, objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '16px 20px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 999, background: theme.bg, color: theme.text, border: `1.5px solid ${theme.border}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {theme.label}
                      </span>
                      <span style={{ fontSize: 11, color: '#b0a090', fontWeight: 500 }}>{formatDate(article.published_at)}</span>
                      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#f97316' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                        </svg>
                        Rode draad beschikbaar
                      </span>
                    </div>
                    <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, fontWeight: 700, color: '#1a1209', margin: '0 0 6px', lineHeight: 1.3 }} className="line-clamp-2">
                      {article.title}
                    </h2>
                    {article.summary && (
                      <p style={{ fontSize: 13, color: '#9c8b78', margin: 0, lineHeight: 1.55 }} className="line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
