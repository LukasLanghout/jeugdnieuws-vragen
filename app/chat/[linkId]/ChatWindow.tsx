'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type Article = { id: string; title: string; image_url: string | null; published_at?: string }
type Message = {
  id: string
  sender_id: string
  body: string
  created_at: string
  article_id: string | null
  articles: Article | null
}

export default function ChatWindow({ linkId, userId, isParent, childName, initialMessages, articles }: {
  linkId: string
  userId: string
  isParent: boolean
  childName: string
  initialMessages: Message[]
  articles: Article[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [showArticlePicker, setShowArticlePicker] = useState(false)
  const [articleQuery, setArticleQuery] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${linkId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `family_link_id=eq.${linkId}`,
      }, async (payload) => {
        // Fetch full message with article
        const { data } = await supabase
          .from('messages')
          .select('*, articles(id, title, image_url)')
          .eq('id', payload.new.id)
          .single()
        if (data) setMessages(prev => [...prev, data as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [linkId])

  async function handleSend() {
    if (!body.trim()) return
    setSending(true)
    await supabase.from('messages').insert({
      family_link_id: linkId,
      sender_id: userId,
      body: body.trim(),
      article_id: selectedArticle?.id ?? null,
    })
    setBody('')
    setSelectedArticle(null)
    setSending(false)
  }

  const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(articleQuery.toLowerCase()))
  const otherName = isParent ? childName : 'Ouder'

  const formatTime = (str: string) =>
    new Date(str).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

  let lastDate = ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: 500 }}>
      {/* Header */}
      <div style={{ background: 'white', borderRadius: 16, padding: '14px 20px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href={isParent ? '/profiel' : '/'} style={{ color: '#f97316', textDecoration: 'none', lineHeight: 0 }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #f97316, #fb923c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {isParent ? '👦' : '👨‍👩‍👦'}
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>{otherName}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Gezinschat</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>Begin het gesprek!</p>
            <p style={{ fontSize: 13, margin: 0 }}>Stel een vraag of deel iets over het nieuws.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === userId
          const msgDate = formatDate(msg.created_at)
          const showDate = msgDate !== lastDate
          lastDate = msgDate

          return (
            <div key={msg.id}>
              {showDate && (
                <div style={{ textAlign: 'center', margin: '12px 0 6px' }}>
                  <span style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', borderRadius: 20, padding: '3px 12px', fontWeight: 600 }}>{msgDate}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', padding: '2px 0' }}>
                <div style={{ maxWidth: '75%' }}>
                  {/* Attached article */}
                  {msg.articles && (
                    <Link
                      href={`/artikel/${msg.articles.id}`}
                      style={{ display: 'flex', gap: 8, alignItems: 'center', background: isMine ? '#fff7ed' : 'white', border: `1px solid ${isMine ? '#fed7aa' : '#e5e7eb'}`, borderRadius: '12px 12px 0 0', padding: '8px 10px', textDecoration: 'none', marginBottom: -1 }}
                    >
                      {msg.articles.image_url && (
                        <img src={msg.articles.image_url} alt="" style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#f97316', lineHeight: 1.3 }}>{msg.articles.title}</span>
                    </Link>
                  )}
                  {/* Bubble */}
                  <div style={{
                    background: isMine ? '#f97316' : 'white',
                    color: isMine ? 'white' : '#111827',
                    borderRadius: msg.articles
                      ? (isMine ? '0 0 4px 16px' : '0 0 16px 4px')
                      : (isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px'),
                    padding: '10px 14px',
                    fontSize: 14,
                    lineHeight: 1.5,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}>
                    {msg.body}
                  </div>
                  <p style={{ fontSize: 10, color: '#9ca3af', margin: '3px 4px 0', textAlign: isMine ? 'right' : 'left' }}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Article attachment preview */}
      {selectedArticle && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '8px 12px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          {selectedArticle.image_url && <img src={selectedArticle.image_url} alt="" style={{ width: 36, height: 28, objectFit: 'cover', borderRadius: 5 }} />}
          <span style={{ fontSize: 12, fontWeight: 600, color: '#c2410c', flex: 1 }}>{selectedArticle.title}</span>
          <button onClick={() => setSelectedArticle(null)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* Article picker dropdown */}
      {showArticlePicker && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', marginBottom: 6, overflow: 'hidden', maxHeight: 240 }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
            <input
              autoFocus
              type="text"
              placeholder="Zoek artikel..."
              value={articleQuery}
              onChange={e => setArticleQuery(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 180 }}>
            {filteredArticles.map(a => (
              <div key={a.id} onClick={() => { setSelectedArticle(a); setShowArticlePicker(false); setArticleQuery('') }}
                style={{ display: 'flex', gap: 10, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f9fafb', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                {a.image_url && <img src={a.image_url} alt="" style={{ width: 36, height: 28, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div style={{ background: 'white', borderRadius: 14, padding: '10px 12px', boxShadow: '0 -2px 12px rgba(0,0,0,0.06)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        {!isParent && (
          <button
            onClick={() => setShowArticlePicker(!showArticlePicker)}
            title="Artikel koppelen"
            style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${showArticlePicker ? '#f97316' : '#e5e7eb'}`, background: showArticlePicker ? '#fff7ed' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}
          >
            📎
          </button>
        )}
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={`Stuur een bericht${!isParent ? ' of koppel een artikel' : ''}...`}
          rows={1}
          style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.4, maxHeight: 100, overflowY: 'auto' }}
          onFocus={e => e.currentTarget.style.borderColor = '#f97316'}
          onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
        />
        <button
          onClick={handleSend}
          disabled={sending || !body.trim()}
          style={{ width: 38, height: 38, borderRadius: 10, background: body.trim() ? '#f97316' : '#e5e7eb', border: 'none', cursor: body.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <svg width="16" height="16" fill="none" stroke={body.trim() ? 'white' : '#9ca3af'} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
