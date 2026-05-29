import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://jeugdjournaal.nl'

function decodeHtml(str: string): string {
  return str
    .replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function isNavText(text: string): boolean {
  return text.includes("Menu") || text.includes("Zoek in") || text.includes("Uitzendin") ||
    text.includes("TikTok") || text.includes("Instagram") || text.includes("Gekopieerd") ||
    text.includes("Kopieer link") || text.includes("YouTube")
}

function extractContent(html: string): string {
  // Grab article body
  const bodyMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/) ||
                    html.match(/<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/)
  const body = bodyMatch?.[1] || html

  // Walk through body finding <p> and <img> tags in order
  const parts: string[] = []
  // Match both <p>...</p> and standalone <img ...>
  const combined = body.matchAll(/(<img\b[^>]*>|<p[^>]*>([\s\S]*?)<\/p>)/g)

  let paraCount = 0

  for (const m of combined) {
    const full = m[1]

    if (full.startsWith('<img')) {
      // Extract src attribute
      const srcMatch = full.match(/\bsrc="([^"]+)"/)
      if (srcMatch) {
        const src = srcMatch[1]
        // Skip tiny icons, data URLs, and svgs
        if (!src.startsWith('data:') && !src.endsWith('.svg') && !src.includes('icon') && !src.includes('logo')) {
          // Make absolute URL if needed
          const url = src.startsWith('http') ? src : `${BASE_URL}${src}`
          parts.push(`[IMG:${url}]`)
        }
      }
    } else {
      // It's a <p> tag
      const inner = m[2] ?? ''
      const text = inner.replace(/<[^>]+>/g, '').trim()
      if (text.length > 30 && !isNavText(text)) {
        parts.push(decodeHtml(text))
        paraCount++
        if (paraCount >= 15) break
      }
    }
  }

  return parts.join('\n\n')
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
