import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import DeleteFamily from './DeleteFamily'

const ADMIN_EMAIL = 'admin@tafelvragen.nl'

const CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: 'Natuur & Wetenschap', keywords: ['natuur','wetenschap','ruimte','planeet','dier','plant','klimaat','water','lucht','energie','onderzoek','ontdekking','vliegen','vliegt','robot'] },
  { label: 'Politiek & Maatschappij', keywords: ['politiek','regering','wet','rechter','verkiezing','president','minister','gemeente','stem','oorlog','vrede','recht','regels','verbod','politie','gevangenis','asiel','grens'] },
  { label: 'Dieren', keywords: ['dier','hond','kat','beer','leeuw','tijger','vogel','vis','paard','olifant','aap','insect','slang','krokodil','wolf','vos','konijn','dierentuin'] },
  { label: 'Sport', keywords: ['sport','voetbal','tennis','zwemmen','fietsen','olympisch','wedstrijd','kampioen','speler','team','coach','stadion','training','winnaar'] },
  { label: 'Kunst & Cultuur', keywords: ['kunst','muziek','film','boek','museum','theater','zingen','dansen','schilder','schrijver','concert','foto','tentoonstelling','kunstwerk','banaan'] },
  { label: 'Technologie', keywords: ['computer','internet','app','telefoon','robot','ai','technologie','machine','data','hack','software','digitaal','scherm'] },
  { label: 'Wereld & Geografie', keywords: ['land','wereld','europa','africa','azië','oceaan','zee','berg','rivier','stad','hoofdstad','vlucht','reizen','toerisme'] },
  { label: 'Gezondheid', keywords: ['ziek','ziekenhuis','dokter','medicijn','vaccin','gezondheid','bewegen','eten','voeding','operatie','virus','corona'] },
]

function categorize(text: string): string {
  if (!text) return 'Overig'
  const lower = text.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => lower.includes(k))) return cat.label
  }
  return 'Overig'
}

const CAT_COLORS: Record<string, { bg: string; color: string; border: string; bar: string }> = {
  'Natuur & Wetenschap': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', bar: '#22c55e' },
  'Politiek & Maatschappij': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', bar: '#3b82f6' },
  'Dieren': { bg: '#fef3c7', color: '#b45309', border: '#fde68a', bar: '#f59e0b' },
  'Sport': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', bar: '#f97316' },
  'Kunst & Cultuur': { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff', bar: '#a855f7' },
  'Technologie': { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd', bar: '#0ea5e9' },
  'Wereld & Geografie': { bg: '#fefce8', color: '#854d0e', border: '#fef08a', bar: '#eab308' },
  'Gezondheid': { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', bar: '#f43f5e' },
  'Overig': { bg: '#f8f7f4', color: '#7c6f5e', border: '#ede8e0', bar: '#a8a29e' },
}

function CategoryBadge({ cat }: { cat: string }) {
  const c = CAT_COLORS[cat] ?? CAT_COLORS['Overig']
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, border: `1.5px solid ${c.border}`, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {cat}
    </span>
  )
}

export default async function AdminPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

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

  const { data: { users: authUsers } } = await admin.auth.admin.listUsers()
  const emailMap = Object.fromEntries((authUsers ?? []).map((u: { id: string; email?: string }) => [u.id, u.email ?? u.id.slice(0, 8)]))

  const familiesWithEmails = (families ?? []).map(f => ({
    ...f,
    parentEmail: emailMap[f.parent_id] ?? f.parent_id.slice(0, 8),
    childEmail: f.child_id ? (emailMap[f.child_id] ?? f.child_id.slice(0, 8)) : null,
    diaryCount: (diaryEntries ?? []).filter(e => e.user_id === f.parent_id).length,
    messageCount: (messages ?? []).filter(m => m.family_link_id === f.id).length,
  }))

  type DiaryEntry = {
    id: string; user_id: string; article_id: string
    child_question: string | null; parent_answer: string | null
    child_opinion: string | null; free_note: string | null; created_at: string
    articles: { id: string; title: string; image_url: string | null; published_at: string } | null
  }
  type Article = { id: string; title: string; image_url: string | null; published_at: string }

  const questions = (diaryEntries as unknown as DiaryEntry[] ?? [])
    .filter(e => e.child_question?.trim())
    .map(e => ({
      id: e.id, question: e.child_question!, answer: e.parent_answer,
      article: e.articles, user: emailMap[e.user_id] ?? '—',
      created_at: e.created_at, category: categorize(e.child_question!),
    }))

  const catCounts: Record<string, number> = {}
  for (const q of questions) catCounts[q.category] = (catCounts[q.category] ?? 0) + 1
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1])
  const maxCatCount = sortedCats[0]?.[1] ?? 1

  const articleStats = (articles as unknown as Article[] ?? []).map(a => {
    const entries = (diaryEntries as unknown as DiaryEntry[] ?? []).filter((e: DiaryEntry) => e.article_id === a.id)
    const qs = entries.filter(e => e.child_question?.trim())
    return { ...a, entryCount: entries.length, questionCount: qs.length, questions: qs.map(e => ({ text: e.child_question!, category: categorize(e.child_question!) })) }
  }).filter(a => a.entryCount > 0).sort((a, b) => b.entryCount - a.entryCount)

  const fmt = (s: string) => new Date(s).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  const fmtShort = (s: string) => new Date(s).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

  const statsData = [
    { label: 'Gezinnen', value: familiesWithEmails.filter(f => f.accepted_at).length, icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'Kinderen', value: familiesWithEmails.filter(f => f.child_id).length, icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z', color: '#8b5cf6', bg: '#fdf4ff', border: '#e9d5ff' },
    { label: 'Dagboekentries', value: diaryEntries?.length ?? 0, icon: 'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
    { label: 'Kindvragen', value: questions.length, icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Chatberichten', value: messages?.length ?? 0, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' },
    { label: 'Artikelen', value: articles?.length ?? 0, icon: 'M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  ]

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9c8b78', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Beheer</p>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 34, fontWeight: 700, color: '#1a1209', margin: 0, letterSpacing: '-0.5px' }}>
            Dashboard
          </h1>
        </div>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#9c8b78', textDecoration: 'none', padding: '8px 14px', background: 'white', border: '1.5px solid #ede8e0', borderRadius: 10, boxShadow: '0 2px 0 0 #ede8e0' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
          Terug naar site
        </Link>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {statsData.map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '20px 22px', border: '2px solid #ede8e0', boxShadow: '0 3px 0 0 rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, border: `1.5px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon}/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#1a1209', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9c8b78', marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout: Families + Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 16, alignItems: 'start' }}>

        {/* Families */}
        <div style={{ background: 'white', borderRadius: 20, border: '2px solid #ede8e0', boxShadow: '0 4px 0 0 rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1.5px solid #f3ede6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 700, color: '#1a1209', margin: 0 }}>Gezinnen</h2>
              <p style={{ fontSize: 12, color: '#9c8b78', margin: '2px 0 0' }}>{familiesWithEmails.length} gekoppeld</p>
            </div>
          </div>
          {familiesWithEmails.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center', color: '#9c8b78', fontSize: 13 }}>Nog geen gezinnen aangemaakt.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {familiesWithEmails.map((f, i) => (
                <div key={f.id} style={{ padding: '14px 22px', borderBottom: i < familiesWithEmails.length - 1 ? '1px solid #f8f4f0' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#f97316', fontFamily: "'Newsreader', Georgia, serif", flexShrink: 0 }}>
                    {f.parentEmail[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1209', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.parentEmail}</div>
                    <div style={{ fontSize: 11, color: '#9c8b78', marginTop: 2 }}>
                      Kind: <span style={{ fontWeight: 600, color: '#5c4a30' }}>{f.child_name}</span>
                      {f.childEmail && <span style={{ color: '#b0a090' }}> · {f.childEmail}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: f.diaryCount > 0 ? '#fff7ed' : '#f3ede6', color: f.diaryCount > 0 ? '#c2410c' : '#b0a090', border: `1px solid ${f.diaryCount > 0 ? '#fed7aa' : '#ede8e0'}` }}>
                        {f.diaryCount} entries
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: f.messageCount > 0 ? '#ecfeff' : '#f3ede6', color: f.messageCount > 0 ? '#0369a1' : '#b0a090', border: `1px solid ${f.messageCount > 0 ? '#a5f3fc' : '#ede8e0'}` }}>
                        {f.messageCount} berichten
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: '#b0a090' }}>{fmtShort(f.created_at)}</span>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: f.accepted_at ? '#f0fdf4' : '#f3ede6', color: f.accepted_at ? '#15803d' : '#9c8b78', border: `1px solid ${f.accepted_at ? '#bbf7d0' : '#ede8e0'}` }}>
                        {f.accepted_at ? 'Actief' : 'Uitnodiging'}
                      </span>
                      <DeleteFamily familyId={f.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories sidebar */}
        <div style={{ background: 'white', borderRadius: 20, border: '2px solid #ede8e0', boxShadow: '0 4px 0 0 rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1.5px solid #f3ede6' }}>
            <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 700, color: '#1a1209', margin: 0 }}>Categorieën</h2>
            <p style={{ fontSize: 12, color: '#9c8b78', margin: '2px 0 0' }}>{questions.length} vragen totaal</p>
          </div>
          {sortedCats.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center', color: '#9c8b78', fontSize: 13 }}>Nog geen vragen.</div>
          ) : (
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedCats.map(([cat, count]) => {
                const c = CAT_COLORS[cat] ?? CAT_COLORS['Overig']
                const pct = Math.round((count / maxCatCount) * 100)
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{cat}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1a1209' }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: '#f3ede6', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: c.bar, borderRadius: 999 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Questions feed */}
      <div style={{ background: 'white', borderRadius: 20, border: '2px solid #ede8e0', boxShadow: '0 4px 0 0 rgba(0,0,0,0.06)', marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1.5px solid #f3ede6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 700, color: '#1a1209', margin: 0 }}>Vragen van kinderen</h2>
            <p style={{ fontSize: 12, color: '#9c8b78', margin: '2px 0 0' }}>Uit het dagboek, met antwoorden van ouders</p>
          </div>
          {questions.length > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#9c8b78', background: '#f3ede6', padding: '4px 12px', borderRadius: 999 }}>{questions.length}</span>
          )}
        </div>
        {questions.length === 0 ? (
          <div style={{ padding: '40px 22px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#9c8b78', margin: 0 }}>Nog geen vragen ingevuld in het dagboek.</p>
          </div>
        ) : (
          <div>
            {questions.map((q, i) => (
              <div key={q.id} style={{ padding: '18px 22px', borderBottom: i < questions.length - 1 ? '1px solid #f8f4f0' : 'none', display: 'grid', gridTemplateColumns: '56px 1fr', gap: 14 }}>
                <div style={{ flexShrink: 0 }}>
                  {q.article?.image_url ? (
                    <img src={q.article.image_url} alt="" style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                  ) : (
                    <div style={{ width: 56, height: 42, background: '#f3ede6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4b09a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <CategoryBadge cat={q.category} />
                    {q.article && (
                      <Link href={`/artikel/${q.article.id}`} style={{ fontSize: 11, color: '#9c8b78', textDecoration: 'none', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                        {q.article.title}
                      </Link>
                    )}
                    <span style={{ fontSize: 11, color: '#c4b09a', marginLeft: 'auto' }}>{fmtShort(q.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: q.answer ? 8 : 0, alignItems: 'flex-start' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                    </div>
                    <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: '#1a1209', margin: 0, fontStyle: 'italic', lineHeight: 1.45 }}>
                      &ldquo;{q.question}&rdquo;
                    </p>
                  </div>
                  {q.answer && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <p style={{ fontSize: 13, color: '#5c4a30', margin: 0, lineHeight: 1.55 }}>{q.answer}</p>
                    </div>
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
          <div style={{ padding: '18px 22px', borderBottom: '1.5px solid #f3ede6' }}>
            <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 700, color: '#1a1209', margin: 0 }}>Artikelen</h2>
            <p style={{ fontSize: 12, color: '#9c8b78', margin: '2px 0 0' }}>Gerangschikt op betrokkenheid</p>
          </div>
          <div>
            {articleStats.map((a, i) => (
              <div key={a.id} style={{ padding: '16px 22px', borderBottom: i < articleStats.length - 1 ? '1px solid #f8f4f0' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {a.image_url ? (
                  <img src={a.image_url} alt="" style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 72, height: 52, background: '#f3ede6', borderRadius: 10, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: a.questions.length > 0 ? 10 : 0 }}>
                    <Link href={`/artikel/${a.id}`} style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, fontWeight: 700, color: '#1a1209', textDecoration: 'none', lineHeight: 1.3 }}>
                      {a.title}
                    </Link>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7c6f5e', background: '#f3ede6', padding: '2px 8px', borderRadius: 999 }}>
                        {a.entryCount} {a.entryCount === 1 ? 'entry' : 'entries'}
                      </span>
                      {a.questionCount > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: 999 }}>
                          {a.questionCount} vragen
                        </span>
                      )}
                    </div>
                  </div>
                  {a.questions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {a.questions.map((q, qi) => (
                        <div key={qi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <CategoryBadge cat={q.category} />
                          <p style={{ fontSize: 13, color: '#7c6f5e', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>&ldquo;{q.text}&rdquo;</p>
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
