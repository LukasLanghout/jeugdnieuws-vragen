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

export default async function HomePage() {
  const articles = await getArticles()
  const [hero, ...rest] = articles

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>Laatste nieuws</h2>
        <RefreshButton />
      </div>

      <SearchBar />

      {articles.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📺</div>
          <p style={{ fontWeight: 600, color: '#374151' }}>Nog geen nieuwsberichten</p>
          <p style={{ fontSize: 14, marginTop: 4 }}>Voer de scraper uit om artikelen te laden</p>
        </div>
      ) : (
        <div>
          {/* Hero card */}
          {hero && (
            <Link href={`/artikel/${hero.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
              <div className="card-hover" style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                {hero.image_url && (
                  <img src={hero.image_url} alt="" style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} />
                )}
                <div style={{ padding: '18px 22px 22px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {formatDate(hero.published_at)}
                  </span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '6px 0 8px', lineHeight: 1.25 }}>
                    {hero.title}
                  </h2>
                  {hero.summary && (
                    <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }} className="line-clamp-2">
                      {hero.summary}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* Article list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rest.map(article => (
              <Link key={article.id} href={`/artikel/${article.id}`} style={{ textDecoration: 'none' }}>
                <div className="card-hover" style={{ background: 'white', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  {article.image_url && (
                    <img src={article.image_url} alt="" style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {formatDate(article.published_at)}
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '3px 0 0', lineHeight: 1.35 }} className="line-clamp-2">
                      {article.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
