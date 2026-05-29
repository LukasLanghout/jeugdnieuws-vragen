import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://jeugdjournaal.nl'

function decodeHtml(str: string): string {
  return str
    .replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function extractContent(html: string): string {
  // Try to grab article paragraphs
  const bodyMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/) ||
                    html.match(/<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/)
  const body = bodyMatch?.[1] || html

  // Extract all <p> tag content
  const paragraphs: string[] = []
  const pMatches = body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)
  for (const m of pMatches) {
    const text = m[1].replace(/<[^>]+>/g, '').trim()
    // Skip navigation/boilerplate paragraphs
    const isNav = text.includes("Menu") || text.includes("Zoek in") || text.includes("Uitzendin") || text.includes("TikTok") || text.includes("Instagram") || text.includes("Gekopieerd")
    if (text.length > 30 && !isNav) paragraphs.push(decodeHtml(text))
  }
  return paragraphs.slice(0, 15).join('\n\n')
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SCRAPE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const res = await fetch(BASE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JeugdnieuwsApp/1.0)' },
    })
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
    const html = await res.text()

    const articleRegex = /href="(\/artikel\/(\d+)-([^"]+))"/g
    const seen = new Set<string>()
    const articles: Array<{ id: string; slug: string; path: string }> = []

    let match
    while ((match = articleRegex.exec(html)) !== null) {
      const [, path, id, slug] = match
      if (!seen.has(id)) { seen.add(id); articles.push({ id, slug, path }) }
    }

    let inserted = 0
    for (const article of articles.slice(0, 8)) {
      try {
        const detailRes = await fetch(`${BASE_URL}${article.path}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JeugdnieuwsApp/1.0)' },
        })
        const detailHtml = await detailRes.text()

        const titleMatch = detailHtml.match(/<h1[^>]*>([^<]+)<\/h1>/) || detailHtml.match(/<title>([^<]+)<\/title>/)
        const rawTitle = titleMatch?.[1]?.replace(' - NOS Jeugdjournaal', '').trim() || article.slug.replace(/-/g, ' ')
        const title = decodeHtml(rawTitle)

        const imgMatch = detailHtml.match(/og:image" content="([^"]+)"/)
        const image_url = imgMatch?.[1] || null

        const descMatch = detailHtml.match(/og:description" content="([^"]+)"/)
        const summary = descMatch?.[1] ? decodeHtml(descMatch[1]) : null

        const content = extractContent(detailHtml)

        const { error } = await supabase.from('articles').upsert({
          title, summary, content, image_url,
          source_url: `${BASE_URL}${article.path}`,
          published_at: new Date().toISOString(),
        }, { onConflict: 'source_url', ignoreDuplicates: false })

        if (!error) inserted++
      } catch { /* skip */ }
    }

    return NextResponse.json({ success: true, found: articles.length, inserted })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
