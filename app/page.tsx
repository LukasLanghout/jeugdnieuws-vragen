import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Article } from '@/lib/supabase'
import SearchBar from './SearchBar'
import RefreshButton from './RefreshButton'

async function getArticles(): Promise<Article[]> {
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
    .limit(20)
  return data ?? []
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export default async function HomePage() {
  const articles = await getArticles()
  const [hero, second, ...rest] = articles

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9c8b78', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 26, fontWeight: 700, color: '#1a1209', margin: 0, letterSpacing: '-0.3px' }}>
            Nieuws van vandaag
          </h1>
        </div>
        <RefreshButton />
      </div>

      <SearchBar />

      {articles.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 20, padding: 48, textAlign: 'center', border: '2px solid #ede8e0', boxShadow: '0 4px 0 0 #ede8e0' }}>
          <div style={{ width: 56, height: 56, background: '#f3ede6', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b0a090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
            </svg>
          </div>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 18, color: '#1a1209', margin: '0 0 6px' }}>Nog geen nieuwsberichten</p>
          <p style={{ fontSize: 14, color: '#9c8b78', margin: 0 }}>Klik op de ververs-knop om artikelen te laden</p>
        </div>
      ) : (
        <div>
          {/* Hero card */}
          {hero && (
            <Link href={`/artikel/${hero.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
              <div className="card-hover" style={{
                background: 'white',
                borderRadius: 22,
                overflow: 'hidden',
                border: '2px solid #ede8e0',
                boxShadow: '0 4px 0 0 rgba(0,0,0,0.10)',
              }}>
                {hero.image_url && (
                  <div style={{ position: 'relative' }}>
                    <img src={hero.image_url} alt="" style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(transparent, rgba(20,12,4,0.5))',
                      height: 100,
                    }} />
                    <span style={{
                      position: 'absolute', top: 14, left: 14,
                      background: '#f97316',
                      color: 'white',
                      fontSize: 10, fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: 999,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      boxShadow: '0 2px 0 0 rgba(0,0,0,0.2)',
                    }}>
                      Nieuwste
                    </span>
                  </div>
                )}
                <div style={{ padding: '20px 24px 24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b87c3e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    {formatDate(hero.published_at)}
                  </div>
                  <h2 style={{
                    fontFamily: "'Newsreader', Georgia, serif",
                    fontSize: 26, fontWeight: 700,
                    color: '#1a1209',
                    margin: '0 0 10px',
                    lineHeight: 1.2,
                    letterSpacing: '-0.3px',
                  }}>
                    {hero.title}
                  </h2>
                  {hero.summary && (
                    <p style={{ fontSize: 14.5, color: '#7c6f5e', lineHeight: 1.65, margin: '0 0 16px' }} className="line-clamp-2">
                      {hero.summary}
                    </p>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316', display: 'flex', alignItems: 'center', gap: 5 }}>
                    Lees verder
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Second article */}
          {second && (
            <Link href={`/artikel/${second.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
              <div className="card-hover-sm" style={{
                background: 'white',
                borderRadius: 18,
                overflow: 'hidden',
                border: '2px solid #ede8e0',
                boxShadow: '0 3px 0 0 rgba(0,0,0,0.08)',
                display: 'flex',
              }}>
                {second.image_url && (
                  <img src={second.image_url} alt="" style={{ width: 130, flexShrink: 0, objectFit: 'cover' }} />
                )}
                <div style={{ padding: '16px 18px', flex: 1 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b87c3e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {formatDate(second.published_at)}
                  </div>
                  <h3 style={{
                    fontFamily: "'Newsreader', Georgia, serif",
                    fontSize: 17, fontWeight: 700,
                    color: '#1a1209', margin: '0 0 8px',
                    lineHeight: 1.3,
                  }} className="line-clamp-2">
                    {second.title}
                  </h3>
                  {second.summary && (
                    <p style={{ fontSize: 13, color: '#9c8b78', lineHeight: 1.55, margin: 0 }} className="line-clamp-2">
                      {second.summary}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* Divider */}
          {rest.length > 0 && (
            <div className="divider-fancy" style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9c8b78', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                Meer nieuws
              </span>
            </div>
          )}

          {/* Rest — compact list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rest.map((article) => (
              <Link key={article.id} href={`/artikel/${article.id}`} style={{ textDecoration: 'none' }}>
                <div className="card-hover-sm" style={{
                  background: 'white',
                  borderRadius: 14,
                  padding: '12px 14px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  border: '1.5px solid #ede8e0',
                  boxShadow: '0 2px 0 0 rgba(0,0,0,0.05)',
                }}>
                  {article.image_url ? (
                    <img src={article.image_url} alt="" style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 72, height: 56, background: '#f3ede6', borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4b09a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'Newsreader', Georgia, serif",
                      fontSize: 14.5, fontWeight: 600,
                      color: '#1a1209', margin: '0 0 4px',
                      lineHeight: 1.3,
                    }} className="line-clamp-2">
                      {article.title}
                    </p>
                    <span style={{ fontSize: 11, color: '#b0a090', fontWeight: 500 }}>
                      {formatDateShort(article.published_at)}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4c4a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
