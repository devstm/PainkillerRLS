   # Database migrations

   SQL files in this directory are applied **manually** via the Supabase Dashboard SQL editor.

   ## How to apply

   1. Open the Supabase Dashboard for the target project (Genius in Supabase — same DB as `rls_docs`)
   2. Go to SQL Editor → New Query
   3. Paste the contents of the migration file
   4. Run it
   5. Run the verification queries (commented at the bottom of each file) to confirm

   ## Files

   - `001_chat_messages.sql` — chat memory table + IVFFlat index + `match_chat_messages` RPC
