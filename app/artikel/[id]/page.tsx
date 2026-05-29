import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import QuestionForm from './QuestionForm'

export default async function ArtikelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (!article) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-sm text-orange-600 hover:underline mb-4 inline-block">
        ← Terug naar overzicht
      </Link>

      <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {article.image_url && (
          <img
            src={article.image_url}
            alt=""
            className="w-full h-56 object-cover"
          />
        )}
        <div className="p-6">
          <p className="text-xs text-orange-500 font-semibold mb-2">
            {new Date(article.published_at).toLocaleDateString('nl-NL', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-gray-600 text-base leading-relaxed mb-4 font-medium border-l-4 border-orange-300 pl-4">
              {article.summary}
            </p>
          )}

          {article.content ? (
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
              {article.content.split('\n\n').map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic">Volledige tekst wordt geladen bij de volgende scrape.</p>
          )}

          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-5 text-sm text-orange-600 hover:underline"
            >
              Bekijk op Jeugdjournaal →
            </a>
          )}
        </div>
      </article>

      <div className="mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Welke vraag stelde jouw kind?
        </h2>
        <QuestionForm articleId={article.id} userId={user?.id ?? null} />
      </div>
    </div>
  )
}
