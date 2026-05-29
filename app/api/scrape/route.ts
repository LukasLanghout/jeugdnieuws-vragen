import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Jeugdjournaal RSS feed
const FEED_URL = 'https://jeugdjournaal.nl/rss'

export async function POST(req: NextRequest) {
  // Protect with a secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SCRAPE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const res = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'JeugdnieuwsApp/1.0' },
    })

    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)

    const xml = await res.text()

    // Parse RSS items
    const items: Array<{ title: string; summary: string; image_url: string | null; source_url: string; published_at: string }> = []

    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
    for (const match of itemMatches) {
      const item = match[1]
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || ''
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
      const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || item.match(/<description>(.*?)<\/description>/)?.[1] || ''
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      const imageUrl = item.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] ||
                       item.match(/<enclosure[^>]+url="([^"]+)"/)?.[1] || null

      // Strip HTML tags from description
      const summary = description.replace(/<[^>]+>/g, '').trim().slice(0, 300)

      if (title && link) {
        items.push({
          title: title.trim(),
          summary,
          image_url: imageUrl,
          source_url: link.trim(),
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        })
      }
    }

    // Upsert articles (skip duplicates by source_url)
    let inserted = 0
    for (const item of items.slice(0, 10)) {
      const { error } = await supabase
        .from('articles')
        .upsert(item, { onConflict: 'source_url', ignoreDuplicates: true })
      if (!error) inserted++
    }

    return NextResponse.json({ success: true, fetched: items.length, inserted })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
