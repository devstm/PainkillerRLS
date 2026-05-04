   -- ============================================================
   -- PainkillerRLS — Chat Memory Schema
   -- Apply manually via Supabase Dashboard → SQL Editor
   -- Target project: same as rls_docs (Genius in Supabase)
   -- ============================================================

   -- Enable pgvector if not already enabled (safe to run again)
   create extension if not exists vector;

   -- The conversation memory table
   create table chat_messages (
     id uuid primary key default gen_random_uuid(),
     conversation_id uuid not null,
     role text not null check (role in ('user', 'assistant')),
     content text not null,
     embedding vector(768),
     token_count int,
     created_at timestamptz not null default now()
   );

   -- Fast filtering by conversation (every query uses this)
   create index chat_messages_conversation_id_idx
     on chat_messages (conversation_id, created_at desc);

   -- Vector similarity index for semantic retrieval
   create index chat_messages_embedding_idx
     on chat_messages
     using ivfflat (embedding vector_cosine_ops)
     with (lists = 100);

   -- RPC function for semantic search within a conversation
   create or replace function match_chat_messages (
     query_embedding vector(768),
     conversation_id_filter uuid,
     match_threshold float default 0.7,
     match_count int default 2,
     exclude_ids uuid[] default array[]::uuid[]
   )
   returns table (
     id uuid,
     role text,
     content text,
     similarity float,
     created_at timestamptz
   )
   language sql stable
   as $$
     select
       chat_messages.id,
       chat_messages.role,
       chat_messages.content,
       1 - (chat_messages.embedding <=> query_embedding) as similarity,
       chat_messages.created_at
     from chat_messages
     where chat_messages.conversation_id = conversation_id_filter
       and chat_messages.embedding is not null
       and length(chat_messages.content) > 100
       and not (chat_messages.id = any(exclude_ids))
       and 1 - (chat_messages.embedding <=> query_embedding) > match_threshold
     order by chat_messages.embedding <=> query_embedding
     limit match_count;
   $$;

   -- ============================================================
   -- Verification queries (run after the migration above)
   -- ============================================================

   -- Should list all columns of chat_messages
   -- select column_name, data_type from information_schema.columns
   -- where table_name = 'chat_messages';

   -- Should return one row with proname = 'match_chat_messages'
   -- select proname from pg_proc where proname = 'match_chat_messages';

   -- Should return zero rows but no error
   -- select * from chat_messages limit 1;
