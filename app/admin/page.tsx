import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'
import Link from 'next/link'

const ADMIN_EMAIL = 'admin@tafelvragen.nl'

const CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: 'Natuur & Wetenschap', keywords: ['natuur','wetenschap','ruimte','planeet','dier','plant','klimaat','water','lucht','energie','onderzoek','ontdekking','vliegen','vliegt','robot'] },
  { label: 'Politiek & Maatschappij', keywords: ['politiek','regering','wet','rechter','verkiezing','president','minister','gemeente','stem','oorlog','vrede','recht','regels','verbod','politie','gevangenis','asiel','grens'] },
  { label: 'Dieren', keywords: ['dier','hond','kat','beer','leeuw','tijger','vogel','vis','paard','olifant','aap','insect','slang','krokodil','wolf','vos','konijn','dierentuin'] },
  { label: 'Sport', keywords: ['sport','voetbal','tennis','zwemmen','fietsen','olympisch','wedstrijd','kampioen','speler','team','coach','stadion','training','winnaar'] },
  { label: 'Kunst & Cultuur', keywords: ['kunst','muziek','film','boek','museum','theater','zingen','dansen','schilder','schrijver','concert','foto','tentoonstelling','kunstwerk','banaan'] },
  { label: 'Technologie', keywords: ['computer','internet','app','telefoon','robot','ai','technologie','machine','data','hack','software','digitaal','scherm'] },
  { label: 'Wereld & Geografie', keywords: ['land','wereld','europa','africa','azië','oceaan','zee','berg','rivier','stad','hoofdstad','vlucht','reizen','toerisme'] },
  { label: 'Gezondheid', keywords: ['ziek','ziekenhuis','dokter','medicijn','vaccin','gezondheid','sport','bewegen','eten','voeding','operatie','virus','corona'] },
]

function categorize(text: string): string {
  if (!text) return 'Overig'
  const lower = text.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => lower.includes(k))) return cat.label
  }
  return 'Overig'
}

const CAT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Natuur & Wetenschap': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'Politiek & Maatschappij': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Dieren': { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  'Sport': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'Kunst & Cultuur': { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  'Technologie': { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  'Wereld & Geografie': { bg: '#fefce8', color: '#854d0e', border: '#fef08a' },
  'Gezondheid': { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  'Overig': { bg: '#f8f7f4', color: '#7c6f5e', border: '#ede8e0' },
}

function CategoryBadge({ cat }: { cat: string }) {
  const c = CAT_COLORS[cat] ?? CAT_COLORS['Overig']
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, border: `1.5px solid ${c.border}`, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {cat}
    </span>
  )
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', border: '2px solid #ede8e0', boxShadow: '0 3px 0 0 rgba(0,0,0,0.07)', flex: 1, minWidth: 120 }}>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 32, fontWeight: 700, color: '#1a1209', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#7c6f5e', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#b0a090', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
      <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#1a1209', margin: 0 }}>{title}</h2>
      {count !== undefined && (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#9c8b78', background: '#f3ede6', padding: '2px 8px', borderRadius: 999 }}>{count}</span>
      )}
    </div>
  )
}

export default async function AdminPage() {
  // Auth check
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  // Fetch all data via admin client (bypasses RLS)
  const admin = createAdminClient()

  const [
    { data: families },
    { data: diaryEntries },
    { data: messages },
    { data: articles },
  ] = await Promise.all([
    admin.from('family_links').select('id, child_name, accepted_at, created_at, parent_id, child_id').order('created_at', { ascending: false }),
    admin.from('diary_entries').select('id, user_id, article_id, child_question, parent_answer, child_opinion, free_note, created_at, articles(id, title, image_url, published_at)').order('created_at', { ascending: false }),
    admin.from('messages').select('id, sender_id, body, created_at, family_link_id, article_id').order('created_at', { ascending: false }),
    admin.from('articles').select('id, title, image_url, published_at').order('published_at', { ascending: false }),
  ])

  // Get user emails via admin auth API
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers()
  const emailMap = Object.fromEntries((authUsers ?? []).map((u: { id: string; email?: string }) => [u.id, u.email ?? u.id.slice(0, 8)]))

  // Build family data with emails
  const familiesWithEmails = (families ?? []).map(f => ({
    ...f,
    parentEmail: emailMap[f.parent_id] ?? f.parent_id.slice(0, 8),
    childEmail: f.child_id ? (emailMap[f.child_id] ?? f.child_id.slice(0, 8)) : null,
    diaryCount: (diaryEntries ?? []).filter(e => e.user_id === f.parent_id).length,
    messageCount: (messages ?? []).filter(m => m.family_link_id === f.id).length,
  }))

  // Questions from diary entries
  type DiaryEntry = {
    id: string
    user_id: string
    article_id: string
    child_question: string | null
    parent_answer: string | null
    child_opinion: string | null
    free_note: string | null
    created_at: string
    articles: { id: string; title: string; image_url: string | null; published_at: string } | null
  }
  const questions = (diaryEntries as unknown as DiaryEntry[] ?? [])
    .filter(e => e.child_question && e.child_question.trim())
    .map(e => ({
      id: e.id,
      question: e.child_question!,
      answer: e.parent_answer,
      article: e.articles,
      user: emailMap[e.user_id] ?? e.user_id.slice(0, 8),
      created_at: e.created_at,
      category: categorize(e.child_question!),
    }))

  // Category counts
  const catCounts: Record<string, number> = {}
  for (const q of questions) {
    catCounts[q.category] = (catCounts[q.category] ?? 0) + 1
  }
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1])
  const maxCatCount = sortedCats[0]?.[1] ?? 1

  // Per article stats
  type Article = { id: string; title: string; image_url: string | null; published_at: string }
  const articleStats = (articles as unknown as Article[] ?? []).map(a => {
    const entries = (diaryEntries as unknown as DiaryEntry[] ?? []).filter((e: DiaryEntry) => e.article_id === a.id)
    const qs = entries.filter(e => e.child_question?.trim())
    return {
      ...a,
      entryCount: entries.length,
      questionCount: qs.length,
      questions: qs.map(e => ({ text: e.child_question!, category: categorize(e.child_question!) })),
    }
  }).filter(a => a.entryCount > 0).sort((a, b) => b.entryCount - a.entryCount)

  const formatDate = (s: string) => new Date(s).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatTime = (s: string) => new Date(s).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9c8b78', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Beheer
          </div>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 30, fontWeight: 700, color: '#1a1209', margin: 0, letterSpacing: '-0.3px' }}>
            Admin Dashboard
          </h1>
        </div>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: '#7c6f5e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
          Terug naar site
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
        <StatCard label="Gezinnen" value={familiesWithEmails.filter(f => f.accepted_at).length} />
        <StatCard label="Kinderen" value={familiesWithEmails.filter(f => f.child_id).length} />
        <StatCard label="Dagboekentries" value={diaryEntries?.length ?? 0} />
        <StatCard label="Vragen" value={questions.length} sub="van kinderen" />
        <StatCard label="Berichten" value={messages?.length ?? 0} sub="in chat" />
        <StatCard label="Artikelen" value={articles?.length ?? 0} />
      </div>

      {/* Gezinnen */}
      <div style={{ background: 'white', borderRadius: 20, border: '2px solid #ede8e0', boxShadow: '0 4px 0 0 rgba(0,0,0,0.06)', marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #ede8e0', background: '#fdf8f3' }}>
          <SectionHeader title="Gezinnen" count={familiesWithEmails.length} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fdf8f3', borderBottom: '1.5px solid #ede8e0' }}>
                {['Ouder', 'Kind', 'Gekoppeld', 'Entries', 'Berichten', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#7c6f5e', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {familiesWithEmails.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: i < familiesWithEmails.length - 1 ? '1px solid #f3ede6' : 'none' }}>
                  <td style={{ padding: '12px 16px', color: '#1a1209', fontWeight: 600 }}>{f.parentEmail}</td>
                  <td style={{ padding: '12px 16px', color: '#3d3022' }}>{f.childEmail ?? <span style={{ color: '#b0a090', fontStyle: 'italic' }}>Nog niet gekoppeld</span>}</td>
                  <td style={{ padding: '12px 16px', color: '#7c6f5e' }}>{f.child_name} &middot; {formatDate(f.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 700, color: f.diaryCount > 0 ? '#f97316' : '#b0a090' }}>{f.diaryCount}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 700, color: f.messageCount > 0 ? '#f97316' : '#b0a090' }}>{f.messageCount}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: f.accepted_at ? '#f0fdf4' : '#f3ede6', color: f.accepted_at ? '#15803d' : '#9c8b78', border: `1.5px solid ${f.accepted_at ? '#bbf7d0' : '#ede8e0'}` }}>
                      {f.accepted_at ? 'Actief' : 'Uitnodiging'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category overview */}
      {sortedCats.length > 0 && (
        <div style={{ background: 'white', borderRadius: 20, border: '2px solid #ede8e0', boxShadow: '0 4px 0 0 rgba(0,0,0,0.06)', marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #ede8e0', background: '#fdf8f3' }}>
            <SectionHeader title="Vragen per categorie" count={questions.length} />
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedCats.map(([cat, count]) => {
              const c = CAT_COLORS[cat] ?? CAT_COLORS['Overig']
              const pct = Math.round((count / maxCatCount) * 100)
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 180, flexShrink: 0 }}>
                    <CategoryBadge cat={cat} />
                  </div>
                  <div style={{ flex: 1, height: 10, background: '#f3ede6', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: c.color, borderRadius: 999, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1209', width: 24, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Questions feed */}
      <div style={{ background: 'white', borderRadius: 20, border: '2px solid #ede8e0', boxShadow: '0 4px 0 0 rgba(0,0,0,0.06)', marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #ede8e0', background: '#fdf8f3' }}>
          <SectionHeader title="Vragen van kinderen" count={questions.length} />
        </div>
        {questions.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#9c8b78', fontSize: 14 }}>
            Nog geen vragen ingevoerd in het dagboek.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {questions.map((q, i) => (
              <div key={q.id} style={{ padding: '16px 24px', borderBottom: i < questions.length - 1 ? '1px solid #f3ede6' : 'none', display: 'flex', gap: 16 }}>
                {/* Article thumbnail */}
                <div style={{ flexShrink: 0 }}>
                  {q.article?.image_url ? (
                    <img src={q.article.image_url} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                  ) : (
                    <div style={{ width: 64, height: 48, background: '#f3ede6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b09a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <CategoryBadge cat={q.category} />
                    {q.article && (
                      <Link href={`/artikel/${q.article.id}`} style={{ fontSize: 11, color: '#9c8b78', textDecoration: 'none', fontWeight: 600 }}>
                        {q.article.title.length > 50 ? q.article.title.slice(0, 50) + '…' : q.article.title}
                      </Link>
                    )}
                    <span style={{ fontSize: 11, color: '#b0a090', marginLeft: 'auto' }}>{formatTime(q.created_at)}</span>
                  </div>
                  <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: '#1a1209', margin: '0 0 6px', fontStyle: 'italic', lineHeight: 1.4 }}>
                    &ldquo;{q.question}&rdquo;
                  </p>
                  {q.answer && (
                    <p style={{ fontSize: 13, color: '#7c6f5e', margin: 0, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700, color: '#f97316' }}>Antwoord: </span>{q.answer}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-article breakdown */}
      {articleStats.length > 0 && (
        <div style={{ background: 'white', borderRadius: 20, border: '2px solid #ede8e0', boxShadow: '0 4px 0 0 rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #ede8e0', background: '#fdf8f3' }}>
            <SectionHeader title="Per artikel" count={articleStats.length} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {articleStats.map((a, i) => (
              <div key={a.id} style={{ padding: '16px 24px', borderBottom: i < articleStats.length - 1 ? '1px solid #f3ede6' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {a.image_url ? (
                  <img src={a.image_url} alt="" style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 72, height: 54, background: '#f3ede6', borderRadius: 8, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <Link href={`/artikel/${a.id}`} style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, fontWeight: 700, color: '#1a1209', textDecoration: 'none', lineHeight: 1.3 }}>
                      {a.title}
                    </Link>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7c6f5e', background: '#f3ede6', padding: '2px 8px', borderRadius: 999 }}>
                        {a.entryCount} {a.entryCount === 1 ? 'entry' : 'entries'}
                      </span>
                      {a.questionCount > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', background: '#fff7ed', border: '1.5px solid #fed7aa', padding: '2px 8px', borderRadius: 999 }}>
                          {a.questionCount} {a.questionCount === 1 ? 'vraag' : 'vragen'}
                        </span>
                      )}
                    </div>
                  </div>
                  {a.questions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {a.questions.map((q, qi) => (
                        <div key={qi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <CategoryBadge cat={q.category} />
                          <p style={{ fontSize: 13, color: '#5c4a30', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                            &ldquo;{q.text}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
