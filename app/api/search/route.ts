import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()
  if (!query) return NextResponse.json({ results: [] })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, summary, published_at')
    .order('published_at', { ascending: false })
    .limit(50)

  if (!articles?.length) return NextResponse.json({ results: [] })

  const articleList = articles.map((a, i) =>
    `${i}. [${a.id}] ${a.title}${a.summary ? ' — ' + a.summary : ''}`
  ).join('\n')

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `Je bent een zoekassistent voor een Nederlandse nieuwsapp voor kinderen (Jeugdjournaal). Gegeven een zoekterm, geef de meest relevante artikelen terug als JSON array met de artikel IDs. Reageer ALLEEN met een JSON array van IDs, niets anders. Voorbeeld: ["uuid1", "uuid2"]. Als er geen relevante artikelen zijn, geef een lege array: []`,
        },
        {
          role: 'user',
          content: `Zoekterm: "${query}"\n\nArtikelen:\n${articleList}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    }),
  })

  if (!groqRes.ok) {
    const q = query.toLowerCase()
    return NextResponse.json({
      results: articles.filter(a =>
        a.title.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q)
      ).slice(0, 5)
    })
  }

  const groqData = await groqRes.json()
  const raw = groqData.choices?.[0]?.message?.content?.trim() || '[]'

  let matchedIds: string[] = []
  try { matchedIds = JSON.parse(raw) } catch { matchedIds = [] }

  const results = matchedIds
    .map((id: string) => articles.find(a => a.id === id))
    .filter(Boolean)

  if (results.length === 0) {
    const q = query.toLowerCase()
    return NextResponse.json({
      results: articles.filter(a =>
        a.title.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q)
      ).slice(0, 5)
    })
  }

  return NextResponse.json({ results })
}
