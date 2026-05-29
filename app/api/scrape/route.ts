import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://jeugdjournaal.nl'

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

    // Extract article links from homepage
    const articleRegex = /href="(\/artikel\/(\d+)-([^"]+))"/g
    const seen = new Set<string>()
    const articles: Array<{ id: string; slug: string; path: string }> = []

    let match
    while ((match = articleRegex.exec(html)) !== null) {
      const [, path, id, slug] = match
      if (!seen.has(id)) {
        seen.add(id)
        articles.push({ id, slug, path })
      }
    }

    // Fetch detail pages for first 8 articles
    let inserted = 0
    for (const article of articles.slice(0, 8)) {
      try {
        const detailRes = await fetch(`${BASE_URL}${article.path}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JeugdnieuwsApp/1.0)' },
        })
        const detailHtml = await detailRes.text()

        // Extract title
        const titleMatch = detailHtml.match(/<h1[^>]*>([^<]+)<\/h1>/) ||
                           detailHtml.match(/<title>([^<]+)<\/title>/)
        const title = titleMatch?.[1]?.replace(' - NOS Jeugdjournaal', '').trim() || article.slug.replace(/-/g, ' ')

        // Extract image
        const imgMatch = detailHtml.match(/og:image" content="([^"]+)"/) ||
                         detailHtml.match(/<img[^>]+src="(https:\/\/static\.nos\.nl[^"]+)"/)
        const image_url = imgMatch?.[1] || null

        // Extract description
        const descMatch = detailHtml.match(/og:description" content="([^"]+)"/)
        const summary = descMatch?.[1] || null

        const { error } = await supabase.from('articles').upsert({
          title,
          summary,
          image_url,
          source_url: `${BASE_URL}${article.path}`,
          published_at: new Date().toISOString(),
        }, { onConflict: 'source_url', ignoreDuplicates: true })

        if (!error) inserted++
      } catch {
        // skip failed articles
      }
    }

    return NextResponse.json({ success: true, found: articles.length, inserted })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
