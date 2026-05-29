import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Article = {
  id: string
  title: string
  summary: string | null
  image_url: string | null
  source_url: string | null
  published_at: string
  created_at: string
}

export type Question = {
  id: string
  article_id: string
  user_id: string | null
  question: string
  created_at: string
}
