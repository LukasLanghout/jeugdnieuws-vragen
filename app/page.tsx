import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Article } from '@/lib/supabase'

async function getArticles(): Promise<Article[]> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data } = await supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(20)
  return data ?? []
}

export default async function HomePage() {
  const articles = await getArticles()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Nieuw van het Jeugdjournaal</h2>
        <Link href="/login" className="text-sm text-orange-600 hover:underline">Inloggen</Link>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm">
          <p className="text-4xl mb-3">📺</p>
          <p className="font-medium">Nog geen nieuwsberichten</p>
          <p className="text-sm mt-1">Kom later terug of voeg nieuws toe via de beheerpagina</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <Link key={article.id} href={`/artikel/${article.id}`}>
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 flex gap-4 items-start cursor-pointer">
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt=""
                    className="w-24 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-orange-500 font-semibold mb-1">
                    {new Date(article.published_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                  </p>
                  <h3 className="font-bold text-gray-900 leading-snug">{article.title}</h3>
                  {article.summary && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.summary}</p>
                  )}
                  <span className="inline-block mt-2 text-sm text-orange-600 font-medium">
                    Vraag toevoegen →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
