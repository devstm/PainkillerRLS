import { getSupabaseClient } from './supabase'
import { getEmbedding } from './embeddings'

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  similarity?: number
  created_at: string
}

export async function getRecentMessages(
  conversationId: string,
  limit = 4
): Promise<StoredMessage[]> {
  const supabase = getSupabaseClient()
  const { data } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data?.length) return []
  return (data as StoredMessage[]).reverse()
}

export async function countMessages(conversationId: string): Promise<number> {
  const supabase = getSupabaseClient()
  const { count } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  return count ?? 0
}

export async function getSemanticMessages(
  userQuery: string,
  conversationId: string,
  excludeIds: string[]
): Promise<StoredMessage[]> {
  const embedding = await getEmbedding(userQuery.slice(0, 500))
  const supabase = getSupabaseClient()

  const { data } = await supabase.rpc('match_chat_messages', {
    query_embedding: embedding,
    conversation_id_filter: conversationId,
    match_threshold: 0.7,
    match_count: 2,
    exclude_ids: excludeIds,
  })

  return (data ?? []) as StoredMessage[]
}

export async function saveMessages(
  conversationId: string,
  userContent: string,
  assistantContent: string
): Promise<void> {
  const [userEmbedding, assistantEmbedding] = await Promise.all([
    getEmbedding(userContent.slice(0, 500)),
    getEmbedding(assistantContent.slice(0, 500)),
  ])

  const supabase = getSupabaseClient()
  await supabase.from('chat_messages').insert([
    { conversation_id: conversationId, role: 'user', content: userContent, embedding: userEmbedding },
    { conversation_id: conversationId, role: 'assistant', content: assistantContent, embedding: assistantEmbedding },
  ])
}
