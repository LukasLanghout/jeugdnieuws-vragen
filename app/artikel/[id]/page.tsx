import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import QuestionForm from './QuestionForm'
import { Article, Question } from '@/lib/supabase'

async function getData(id: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const [{ data: article }, { data: questions }, { data: { user } }] = await Promise.all([
    supabase.from('articles').select('*').eq('id', id).single(),
    supabase.from('questions').select('*').eq('article_id', id).order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])
  return { article: article as Article | null, questions: (questions ?? []) as Question[], user }
}

export default async function ArtikelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { article, questions, user } = await getData(id)

  if (!article) notFound()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        {article.image_url && (
          <img src={article.image_url} alt="" className="w-full h-48 object-cover rounded-xl mb-4" />
        )}
        <p className="text-xs text-orange-500 font-semibold mb-1">
          {new Date(article.published_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h2>
        {article.summary && <p className="text-gray-600">{article.summary}</p>}
        {article.source_url && (
          <a href={article.source_url} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-3 text-sm text-orange-600 hover:underline">
            Bekijk op Jeugdjournaal →
          </a>
        )}
      </div>

      <QuestionForm articleId={article.id} user={user} />

      {questions.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-700 mb-3">
            {questions.length} {questions.length === 1 ? 'vraag' : 'vragen'} gedeeld
          </h3>
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-gray-800">💬 {q.question}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(q.created_at).toLocaleDateString('nl-NL')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
