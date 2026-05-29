'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type User = { id: string; email?: string } | null

export default function QuestionForm({ articleId, user }: { articleId: string; user: User }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  if (!user) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
        <p className="text-2xl mb-2">👋</p>
        <p className="font-semibold text-gray-800 mb-1">Wat vroeg jouw kind over dit bericht?</p>
        <p className="text-sm text-gray-500 mb-4">Log eerst in om een vraag te delen</p>
        <Link href="/login" className="bg-orange-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
          Inloggen
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.from('questions').insert({
      article_id: articleId,
      user_id: user!.id,
      question: question.trim(),
    })
    setLoading(false)
    if (error) {
      setError('Er ging iets mis. Probeer het opnieuw.')
    } else {
      setSubmitted(true)
      setQuestion('')
      router.refresh()
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-gray-800">Bedankt voor het delen!</p>
        <button onClick={() => setSubmitted(false)} className="mt-3 text-sm text-orange-600 hover:underline">
          Nog een vraag toevoegen
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="font-bold text-gray-900 mb-1">Wat vroeg jouw kind?</h3>
      <p className="text-sm text-gray-500 mb-4">Deel de vraag of het gesprek dat jullie hadden aan de eettafel</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Bijv: Waarom mogen kinderen in dat land niet naar school?"
          rows={3}
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Opslaan...' : 'Vraag delen'}
        </button>
      </form>
    </div>
  )
}
