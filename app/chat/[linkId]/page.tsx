import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import ChatWindow from './ChatWindow'

export default async function ChatPage({ params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: link } = await supabase
    .from('family_links')
    .select('id, parent_id, child_id, child_name, accepted_at')
    .eq('id', linkId)
    .single()

  if (!link || (link.parent_id !== user.id && link.child_id !== user.id)) notFound()
  if (!link.accepted_at) redirect('/profiel')

  const isParent = link.parent_id === user.id

  const { data: messages } = await supabase
    .from('messages')
    .select('*, articles(id, title, image_url)')
    .eq('family_link_id', linkId)
    .order('created_at', { ascending: true })

  // Get article list for parent to attach
  const { data: articles } = isParent ? { data: [] } : await supabase
    .from('articles')
    .select('id, title, image_url, published_at')
    .order('published_at', { ascending: false })
    .limit(30)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <ChatWindow
        linkId={linkId}
        userId={user.id}
        isParent={isParent}
        childName={link.child_name ?? 'Kind'}
        initialMessages={messages ?? []}
        articles={articles ?? []}
      />
    </div>
  )
}
