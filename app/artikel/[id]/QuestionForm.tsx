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
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
        <p style={{ fontWeight: 700, color: '#111827', fontSize: 15, margin: '0 0 6px' }}>Log in om een vraag te delen</p>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 18px' }}>Maak een gratis account aan en deel de vragen van je kind</p>
        <Link href="/login" style={{ display: 'inline-block', background: '#f97316', color: 'white', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Inloggen of aanmelden
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
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
        <p style={{ fontWeight: 700, color: '#111827', fontSize: 15, margin: '0 0 12px' }}>Bedankt voor het delen!</p>
        <button
          onClick={() => setSubmitted(false)}
          style={{ fontSize: 13, color: '#f97316', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Nog een vraag toevoegen
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Bijv: Waarom mogen kinderen in dat land niet naar school?"
        rows={3}
        style={{
          border: '1.5px solid #e5e7eb',
          borderRadius: 12,
          padding: '12px 14px',
          fontSize: 14,
          resize: 'none',
          outline: 'none',
          color: '#111827',
          lineHeight: 1.6,
          transition: 'border-color 0.15s',
          fontFamily: 'inherit',
        }}
        onFocus={e => e.currentTarget.style.borderColor = '#f97316'}
        onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
      />
      {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}
      <button
        type="submit"
        disabled={loading || !question.trim()}
        style={{
          background: loading || !question.trim() ? '#e5e7eb' : '#f97316',
          color: loading || !question.trim() ? '#9ca3af' : 'white',
          border: 'none',
          borderRadius: 10,
          padding: '12px 0',
          fontWeight: 700,
          fontSize: 14,
          cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
          fontFamily: 'inherit',
        }}
      >
        {loading ? 'Opslaan...' : 'Vraag delen'}
      </button>
    </form>
  )
}
