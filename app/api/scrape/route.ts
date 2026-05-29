import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://jeugdjournaal.nl'

function decodeHtml(str: string): string {
  return str
    .replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

type ImagesByRatio = Record<string, Array<{ url: string; width: number; height: number }>>

function bestImageUrl(imagesByRatio: ImagesByRatio): string | null {
  // Prefer 16:9, fall back to 4:3, then any ratio
  const ratio = imagesByRatio['16:9'] ?? imagesByRatio['4:3'] ?? Object.values(imagesByRatio)[0]
  if (!ratio?.length) return null
  // Pick ~768px wide — large enough but not massive
  const sorted = [...ratio].sort((a, b) => a.width - b.width)
  const preferred = sorted.find(img => img.width >= 640) ?? sorted[sorted.length - 1]
  return preferred?.url ?? null
}

type ContentBlock = {
  type: string
  id: string
  content?: string | ContentBlock[] | Record<string, unknown>
}

function extractFromNextData(html: string): {
  title: string
  summary: string | null
  image_url: string | null
  content: string
  published_at: string
} | null {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) return null

  let data
  try {
    const json = JSON.parse(match[1])
    data = json?.props?.pageProps?.data
  } catch { return null }

  if (!data) return null

  const title = decodeHtml(data.title ?? '')
  const summary = data.description ? decodeHtml(data.description) : null
  const published_at = data.publishedAt ? new Date(data.publishedAt).toISOString() : new Date().toISOString()

  // Hero image from headerImage or headerVideo thumbnail
  let image_url: string | null = null
  if (data.headerImage?.imagesByRatio) {
    image_url = bestImageUrl(data.headerImage.imagesByRatio)
  } else if (data.shareImageSrc) {
    image_url = data.shareImageSrc
  }

  // Build content from structured blocks
  const parts: string[] = []
  const blocks: ContentBlock[] = data.content ?? []

  for (const block of blocks) {
    switch (block.type) {
      case 'text': {
        const text = typeof block.content === 'string' ? block.content.trim() : ''
        if (text.length > 10) parts.push(decodeHtml(text))
        break
      }
      case 'title': {
        const text = typeof block.content === 'string' ? block.content.trim() : ''
        if (text.length > 3) parts.push(`**${decodeHtml(text)}**`)
        break
      }
      case 'quote': {
        const inner = block.content as Record<string, unknown>
        const text = typeof inner?.text === 'string' ? inner.text.trim() : ''
        if (text.length > 10) parts.push(`"${decodeHtml(text)}"`)
        break
      }
      case 'image': {
        const inner = block.content as Record<string, unknown>
        const ratios = inner?.imagesByRatio as ImagesByRatio
        const url = ratios ? bestImageUrl(ratios) : null
        if (url) parts.push(`[IMG:${url}]`)
        break
      }
      case 'video': {
        // Add video thumbnail if available
        const inner = block.content as Record<string, unknown>
        const ratios = inner?.imagesByRatio as ImagesByRatio
        const url = ratios ? bestImageUrl(ratios) : null
        if (url) parts.push(`[IMG:${url}]`)
        break
      }
      // Skip linkContainer, poll, etc.
    }
  }

  return { title, summary, image_url, content: parts.join('\n\n'), published_at }
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

        const extracted = extractFromNextData(detailHtml)
        if (!extracted || !extracted.title) continue

        const { error } = await supabase.from('articles').upsert({
          ...extracted,
          source_url: `${BASE_URL}${article.path}`,
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
