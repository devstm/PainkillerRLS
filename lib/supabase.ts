import { createClient } from '@supabase/supabase-js'

export const getSupabaseClient = (url?: string, serviceKey?: string) => {
  return createClient(
    url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
